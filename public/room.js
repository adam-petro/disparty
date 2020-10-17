const socket = io("/");

var peer = new SimplePeer({ initiator: location.hash === "#init" });

peers = {};

//On established connection to WS server, connect to room
socket.on("connect", () => {
  peer.on("signal", (peerData) => {
    let connectionData = {
      roomId: ROOM_ID,
      userId: peerData,
      socketId: socket.id,
    };
    socket.emit("join-room", connectionData);
  });
});

//On new connected user, do the following actions
socket.on("user-connected", (userData) => {
  console.log("another user connected", userData);
  peer.on("connect", () => {
    peer.send("hello");
  });

  peer.on("data", (data) => {
    console.log("received data from:", data);
  });

  peers[userData.socketId] = userData.userId;
  console.log("peers:", peers);
});

//temp function to populate textarea with connection data
peer.on("signal", (data) => {
  $("#my-id").val(JSON.stringify(data));
});
