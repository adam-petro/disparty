const socket = io.connect("/");
let currentlyAdmin = false;
let currentlyStreaming = false;
let adminVideoStream;
let myId = socket.id;
let begin_time;
let end_time;
let time_difference;

const videoGrid = document.getElementById("video-grid");
displayPromptWhenNicknameNotPresent().then(() => {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      addVideoStream(stream, "my-webcam", sessionStorage.getItem("nickname"));
      main(stream);
    });
});

function main(stream) {
  myId = socket.id;
  createChatWindow("group", myPeers);
  //On join, tell the server that you joined
  begin_time = performance.now();
  socket.emit("join-room", ROOM_ID, sessionStorage.getItem("nickname"));

  //When received info on all users already in a room
  socket.on("all-users", (users) => {
    if (users.length == 0) {
      currentlyAdmin = true;
      handleVideoPlayback();
    }
    users.forEach((user) => {
      //Create a new p2p connection for each of the users already in room
      const peer = createPeer(user.userId, socket.id, stream);

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
  //Receive an answer from the other user
  socket.on("received-returned-signal", (payload) => {
    const item = myPeers.find((p) => p.peerId === payload.id);
    end_time = performance.now();
    time_difference = end_time - begin_time;
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
    //Receive data from other users - notification about status of streaming of local video or a message
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
  //Handle other user disconnection
  socket.on("user-disconnected", (userId) => {
    removeUser(userId);
  });
}

function removeUser(userId) {
  //Remove the videocard
  document.getElementById(userId + "-videocard").remove();
  //Remove the peer from remaining structures
  delete myPeers[userId];
  myPeers.splice(
    myPeers.indexOf(
      myPeers.find((p) => {
        return p.peerId === userId;
      })
    ),
    1
  );
}

async function addVideoStream(stream, peerId, nickname) {
  //Create new html element
  const video = document.createElement("video");
  //Set the id of the video to the peer streaming the stream that displays in the video
  video.id = peerId;
  //If my video, mute it for me.
  if (peerId === "my-webcam") video.muted = true;
  //Check in case of old browser
  if ("srcObject" in video) {
    video.srcObject = stream;
  } else {
    video.src = window.URL.createObjectURL(stream);
  }
  //Create couple of elements for prettier styles
  const videoCard = $(
    `<div style="margin:10px auto 10px;"id=${peerId}-videocard class="ui centered card"></div>`
  );
  const videoCardVideo = $(`<div class="ui image"></div>`);
  const videoCardContent = $(
    `<div class="content"><p class="header">${nickname}</p></div>`
  );

  //Append the jquery version of the html element video
  videoCardVideo.append($(video));
  //Append rest of the stuff
  videoCard.append(videoCardVideo);
  videoCard.append(videoCardContent);
  $(videoGrid).append(videoCard);
  //Play appended video
  video.play();
}

function handleVideoProcessing(peerId, stream) {
  if (!document.getElementById(peerId)) {
    const peer = myPeers.find((peer) => {
      return peer.peerId === peerId;
    });
    addVideoStream(stream, peerId, peer.nickname);
  } else {
    adminVideoStream = { videoId: peerId + "-admin", stream };
  }
}

function handleStartedStreaming() {
  const selector = "#" + adminVideoStream.videoId;
  if (!document.getElementById(selector)) {
    addVideoStream(
      adminVideoStream.stream,
      adminVideoStream.videoId,
      "Local stream from Admin"
    );
  } else {
    console.log("video playing");
    document.querySelector(querySelector).play();
  }
}
