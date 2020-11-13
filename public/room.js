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
  //On join, tell the server that you joined
  socket.emit("join-room", ROOM_ID);

  //When received info on all users already in a room
  socket.on("all-users", (users) => {
    users.forEach((userId) => {
      //Create a new p2p connection for each of the users already in room
      const peer = createPeer(userId, socket.id, stream);
      //Push into the array of current user's peers
      myPeers.push({ peerId: userId, peer });
    });
  });

  //When new user joined
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
    const dummyStream = stream.clone();
    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      streams: [stream, dummyStream],
    });
    //The signal event is going to be fired when current user is getting and offer
    peer.on("signal", (signal) => {
      //Let the caller know our signal
      socket.emit("return-signal", { signal, callerId });
    });

    peer.on("stream", (stream) => {
      const video = document.createElement("video");
      video.id = callerId;
      addVideoStream(video, stream);
    });

    //Signal back - accept the offer
    peer.signal(incomingSignal);
    return peer;
  }

  //userToSignal = socket id of user we're trying to signal
  //myId = socket id of current user
  //stream = mediastream of current user
  function createPeer(userToSignal, myId, stream) {
    const dummyStream = stream.clone();
    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      streams: [stream, dummyStream],
    });

    //The signal event is going to fire instantly, because current user is initiator.
    //Tell the server that we are trying to signal userToSignal and that myId is our address
    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerId: myId, signal });
    });

    //When a stream is received, process it
    peer.on("stream", (stream) => {
      const video = document.createElement("video");
      video.id = userToSignal;
      addVideoStream(video, stream);
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

socket.on("user-disconnected", (userId) => {
  document.getElementById(userId).remove();
  delete myPeers[userId];
});

// Whenever new video is added to the website, add it to each peer's stream. This does not work yet, needs to be fixed.

let localVideoInput = document.querySelector("#video-input");
localVideoInput.addEventListener("added-video", () => {
  localVideo = document.querySelector("#local-video");
  localVideo.addEventListener("loadedmetadata", async () => {
    stream = localVideo.captureStream();
    await myPeers.forEach((peer) => {
      console.log(peer["peer"].streams[1].getTracks());
      console.log(stream.getTracks());
      peer["peer"].replaceTrack(
        peer["peer"].streams[1].getTracks()[1],
        stream.getTracks()[1],
        peer["peer"].streams[1]
      );
      peer["peer"].replaceTrack(
        peer["peer"].streams[1].getTracks()[0],
        stream.getTracks()[0],
        peer["peer"].streams[1]
      );
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
