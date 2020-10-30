const socket = io.connect("/");
let stream;
let myPeers = [];

async function getMedia() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  } catch (err) {
    console.error("unable to retrieve user cam/mic", err);
  }
}

async function main() {
  //On join, tell the server and all the users in the room tha
  socket.emit("join-room", ROOM_ID);

  //When received info on all users already in a room
  socket.on("all-users", (users) => {
    //initialize new array for rendering purposes
    const peers = [];
    users.forEach((userId) => {
      const peer = createPeer(userId, socket.id, stream);
      //Push into the array of current user's peers
      myPeers.push({ peerId: userId, peer });
      peers.push(peer);
    });
  });

  socket.on("user-joined", (payload) => {
    const peer = addPeer(payload.signal, payload.callerId, stream);
    myPeers.push({
      peerId: payload.callerId,
      peer,
    });
  });

  socket.on("received-returned-signal", (payload) => {
    console.log("received");
    const item = myPeers.find((p) => p.peerId === payload.id);
    item.peer.signal(payload.signal);
  });

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });
    //The signal event is going to be fired when current user is getting and offer
    peer.on("signal", (signal) => {
      //Let the caller know our signal
      socket.emit("return-signal", { signal, callerId });
    });

    //Signal back - accept the offer
    peer.signal(incomingSignal);
  }

  function createPeer(userToSignal, myId, stream) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });
    //The signal event is going to fire instantly, because current user is initiator
    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, myId, signal });
    });
  }
}
getMedia();
main();

//On established connection to WS server, connect to room
// socket.on("connect", () => {
//   if (location.hash === "#init") {
//     peer.on("signal", (peerData) => {
//       console.log("someone is calling");
//       let connectionData = {
//         roomId: ROOM_ID,
//         userId: btoa(JSON.stringify(peerData)),
//         socketId: socket.id,
//       };
//       socket.emit("initiated-room", connectionData);
//     });
//   } else {
//     console.log("emitted ordinary user-join");
//     socket.emit("join-user", { socketId: socket.id, roomId: ROOM_ID });
//   }
// });

// if (location.hash !== "#init") {
//   peer.signal(atob(INITIATOR));
// }
// socket.on("initiator-address", (data) => {
//   console.log(data);
// });

// //temp function to populate textarea with connection data
// peer.on("signal", (data) => {
//   $("#my-id").val(JSON.stringify(data));
//   if (location.hash !== "#init") {
//     socket.emit("signal-reply", {
//       roomId: ROOM_ID,
//       connectionData: btoa(JSON.stringify(data)),
//     });
//   }
// });

// if (location.hash === "#init") {
//   socket.on("user-connected", (data) => {
//     peer.signal(atob(data));
//     console.log(data);
//   });
// }

// document.getElementById("send").addEventListener("click", function () {
//   var yourMessage = document.getElementById("yourMessage").value;
//   peer.send(yourMessage);
// });

// peer.on("data", function (data) {
//   document.getElementById("messages").textContent += data + "\n";
// });
