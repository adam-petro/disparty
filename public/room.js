const socket = io.connect("/");
let myPeers = [];

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);
    main(stream);
  });

function main(stream) {
  //On join, tell the server and all the users in the room tha
  socket.emit("join-room", ROOM_ID);

  //When received info on all users already in a room
  socket.on("all-users", (users) => {
    //initialize new array for rendering purposes
    users.forEach((userId) => {
      const peer = createPeer(userId, socket.id, stream);
      //Push into the array of current user's peers
      myPeers.push({ peerId: userId, peer });
    });
  });

  socket.on("user-joined", (payload) => {
    const item = myPeers.find((p) => p.peerId == payload.callerId);
    if (!item) {
      const peer = addPeer(payload.signal, payload.callerId, stream);
      myPeers.push({
        peerId: payload.callerId,
        peer,
      });
    }
  });

  socket.on("received-returned-signal", (payload) => {
    const item = myPeers.find((p) => p.peerId === payload.id);
    item.peer.signal(payload.signal);
  });

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      streams: [stream],
    });
    //The signal event is going to be fired when current user is getting and offer
    peer.on("signal", (signal) => {
      //Let the caller know our signal
      socket.emit("return-signal", { signal, callerId });
    });

    peer.on("stream", (stream) => {
      const video = document.createElement("video");
      addVideoStream(video, stream);
    });

    peer.on("track", () => {
      console.log("received track in addPeer");
    });

    //Signal back - accept the offer
    peer.signal(incomingSignal);
    return peer;
  }

  function createPeer(userToSignal, myId, stream) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      streams: [stream],
    });
    //The signal event is going to fire instantly, because current user is initiator
    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerId: myId, signal });
    });
    peer.on("stream", (stream) => {
      const video = document.createElement("video");
      addVideoStream(video, stream);
    });
    peer.on("track", () => {
      console.log("received track in createPeer");
    });
    return peer;
  }
}
function addVideoStream(video, stream) {
  if ("srcObject" in video) {
    video.srcObject = stream;
  } else {
    video.src = window.URL.createObjectURL(stream);
  }
  videoGrid.append(video);
  video.play();
}

// Whenever new video is added to the website, add it to each peer's stream. This does not work yet, needs to be fixed.

let localVideoInput = document.querySelector("#video-input");
localVideoInput.addEventListener("added-video", () => {
  localVideo = document.querySelector("#local-video");
  localVideo.addEventListener("loadedmetadata", async () => {
    stream = localVideo.captureStream();
    await myPeers.forEach((peer) => {
      peer["peer"].addStream(stream);
    });
    socket.emit("added-video", ROOM_ID);
  });
});

socket.on("added-video", () => {
  console.log("received added video event");
  myPeers.forEach((peer) => {
    console.log(peer["peer"].streams[0].getTracks());
    peer["peer"].on("stream", () => {
      console.log("received stream");
    });
    peer["peer"].on("track", () => {
      console.log("received track");
    });
  });
});

// Helper function to copy ROOM_ID to clipboard - for developing purposes only.
const copyButton = document.querySelector("#copy-button");
copyButton.addEventListener("click", function (event) {
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = ROOM_ID;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
});
