const socket = io("/");

var peer = new SimplePeer({
  initiator: location.hash === "#init",
  trickle: false,
});

peers = {};

//On established connection to WS server, connect to room
socket.on("connect", () => {
  if (location.hash === "#init") {
    peer.on("signal", (peerData) => {
      console.log("someone is calling");
      let connectionData = {
        roomId: ROOM_ID,
        userId: btoa(JSON.stringify(peerData)),
        socketId: socket.id,
      };
      socket.emit("initiated-room", connectionData);
    });
  } else {
    console.log("emitted ordinary user-join");
    socket.emit("join-user", { socketId: socket.id, roomId: ROOM_ID });
  }
});

if (location.hash !== "#init") {
  peer.signal(atob(INITIATOR));
}
socket.on("initiator-address", (data) => {
  console.log(data);
});

//temp function to populate textarea with connection data
peer.on("signal", (data) => {
  $("#my-id").val(JSON.stringify(data));
  if (location.hash !== "#init") {
    socket.emit("signal-reply", {
      roomId: ROOM_ID,
      connectionData: btoa(JSON.stringify(data)),
    });
  }
});

if (location.hash === "#init") {
  socket.on("user-connected", (data) => {
    peer.signal(atob(data));
    console.log(data);
  });
}

document.getElementById("send").addEventListener("click", function () {
  var yourMessage = document.getElementById("yourMessage").value;
  peer.send(yourMessage);
});

peer.on("data", function (data) {
  document.getElementById("messages").textContent += data + "\n";
});
