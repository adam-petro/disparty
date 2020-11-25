const socket = io.connect("/");
let currentlyAdmin = false;
let currentlyStreaming = false;
let adminVideoStream;
let myId;

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
displayPromptWhenNicknameNotPresent().then(() => {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      addVideoStream(stream, myVideo);
      main(stream);
    });
});

function main(stream) {
  myId = socket.id;
  openChatWindow("group", myPeers);
  //On join, tell the server that you joined
  socket.emit("join-room", ROOM_ID, sessionStorage.getItem("nickname"));

  //When received info on all users already in a room
  socket.on("all-users", (users) => {
    if (users.length == 0) {
      currentlyAdmin = true;
      handleVideoPlayback();
    }
    console.log(users);
    users.forEach((user) => {
      //Create a new p2p connection for each of the users already in room
      const peer = createPeer(user.userId, socket.id, stream);
      console.log({
        peerId: user.userId,
        peer: peer,
        nickname: user.nickname,
      });
      //Push into the array of current user's peers
      myPeers.push({
        peerId: user.userId,
        peer: peer,
        nickname: user.nickname,
      });
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
        peer: peer,
        nickname: payload.nickname,
      });
    }
  });

  socket.on("received-returned-signal", (payload) => {
    const item = myPeers.find((p) => p.peerId === payload.id);
    item.peer.signal(payload.signal);
  });

  function addPeer(incomingSignal, callerId, stream) {
    const secondStream = stream.clone();
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      streams: [stream, secondStream],
      objectMode: true,
    });
    //The signal event is going to be fired when current user is getting and offer
    peer.on("signal", (signal) => {
      //Let the caller know our signal
      socket.emit("return-signal", { signal, callerId });
    });

    //On received stream, handle the video
    peer.on("stream", (stream) => {
      handleVideoProcessing(callerId, stream);
    });

    //on data, distinguish if message and handle accordingly
    peer.on("data", (data) => {
      data = JSON.parse(data);
      if (data["type"] === "message" || data["type"] === "group-message") {
        receiveMessage(data);
      }
    });

    //if currently streaming local video, let newly connected user know.
    peer.on("connect", () => {
      if (currentlyStreaming && currentlyAdmin) {
        const localVideo = getLocalVideo();
        const stream = localVideo.captureStream();
        replaceStreamTracks(peer, stream);
        const message = {
          type: "notification",
          data: "started-streaming",
          sender: socket.id,
        };
        peer.send(JSON.stringify(message));
      }
    });

    //if not currently admin, remove the second stream
    if (!currentlyAdmin) {
      peer.removeStream(secondStream);
    }

    //Signal back - accept the offer
    peer.signal(incomingSignal);
    return peer;
  }

  //userToSignal = socket id of user we're trying to signal
  //myId = socket id of current user
  //stream = mediastream of current user
  function createPeer(userToSignal, myId, stream) {
    const secondStream = stream.clone();
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      streams: [stream, secondStream],
      objectMode: true,
    });

    //The signal event is going to fire instantly, because current user is initiator.
    //Tell the server that we are trying to signal userToSignal and that myId is our address
    peer.on("signal", (signal) => {
      socket.emit("sending-signal", {
        userToSignal,
        callerId: myId,
        signal: signal,
        nickname: sessionStorage.getItem("nickname"),
      });
    });

    //When a stream is received, process it
    peer.on("stream", (stream) => {
      handleVideoProcessing(userToSignal, stream);
    });

    peer.on("data", (data) => {
      data = JSON.parse(data);
      if (
        data["type"] === "notification" &&
        data["data"] === "started-streaming"
      ) {
        handleStartedStreaming();
      } else if (
        data["type"] === "message" ||
        data["type"] === "group-message"
      ) {
        receiveMessage(data);
      }
    });
    if (!currentlyAdmin) {
      peer.removeStream(secondStream);
    }

    return peer;
  }
  socket.on("user-disconnected", (userId) => {
    removeUser(userId);
  });
}

function removeUser(userId) {
  document.getElementById(userId).remove();
  delete myPeers[userId];
  myPeers.splice(
    myPeers.indexOf(
      myPeers.find((p) => {
        return p.peerId === userId;
      })
    ),
    1
  );
  removeChatWindow(userId);
}

async function addVideoStream(stream, video) {
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
  if (!document.getElementById(videoId)) {
    const video = document.createElement("video");
    video.id = videoId;
    addVideoStream(stream, video);
  } else {
    adminVideoStream = { videoId, stream };
  }
}

function handleStartedStreaming() {
  const querySelector = "#" + adminVideoStream.videoId + "-admin";
  if (!document.querySelector(querySelector)) {
    const video = document.createElement("video");
    video.id = adminVideoStream.videoId + "-admin";
    addVideoStream(adminVideoStream.stream, video);
  }
}
