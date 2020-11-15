const socket = io.connect("/");
let myPeers = [];
let currentlyAdmin = false;
let adminVideoStream;

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(stream, myVideo);
    main(stream);
  });

function main(stream) {
  //On join, tell the server that you joined
  socket.emit("join-room", ROOM_ID);

  //When received info on all users already in a room
  socket.on("all-users", (users) => {
    if (users.length == 0) {
      currentlyAdmin = true;
      handleVideoPlayback();
    }
    users.forEach((userId) => {
      //Create a new p2p connection for each of the users already in room
      const peer = createPeer(userId, socket.id, stream);
      //Push into the array of current user's peers
      myPeers.push({ peerId: userId, peer });
    });
  });

  //When new user joined
  socket.on("user-joined", (payload) => {
    //See if the user is already in myPeers list
    const item = myPeers.find((p) => p.peerId == payload.callerId);
    //If not in myPeers list, add him
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
    });
    peer.addStream(stream);
    if (currentlyAdmin) peer.addStream(dummyStream);
    //The signal event is going to be fired when current user is getting and offer
    peer.on("signal", (signal) => {
      //Let the caller know our signal
      socket.emit("return-signal", { signal, callerId });
    });

    peer.on("stream", (stream) => {
      handleVideoProcessing(callerId, stream);
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
    });
    peer.addStream(stream);
    if (currentlyAdmin) peer.addStream(dummyStream);

    //The signal event is going to fire instantly, because current user is initiator.
    //Tell the server that we are trying to signal userToSignal and that myId is our address
    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerId: myId, signal });
    });

    //When a stream is received, process it
    peer.on("stream", (stream) => {
      handleVideoProcessing(userToSignal, stream);
    });

    return peer;
  }
  socket.on("user-disconnected", (userId) => {
    document.getElementById(userId).remove();
    delete myPeers[userId];
  });

  socket.on("added-video", () => {
    myPeers.forEach((peer) => {
      console.log(peer["peer"].streams);
      if (peer.streams.length === 2) {
        handleVideoProcessing(peer.id + "-main", peer.streams[1]);
      }
    });
  });
}
function addVideoStream(stream, video) {
  //Check in case of old browser
  if ("srcObject" in video) {
    video.srcObject = stream;
  } else {
    video.src = window.URL.createObjectURL(stream);
  }
  videoGrid.append(video);
  video.play();
}

function handleVideoProcessing(videoId, stream) {
  console.log(stream);
  const video = document.createElement("video");
  video.id = videoId;
  addVideoStream(stream, video);
}
