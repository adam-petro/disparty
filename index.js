const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const { v4: uuidV4 } = require("uuid");

//String
issuedRoomsId = [];

const socketToRoom = {};

//JSON with structure roomId:[usersInRoom]
const users = {};

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/new-room", (req, res) => {
  newId = uuidV4();
  issuedRoomsId.push(newId);
  res.redirect(`/room/${newId}`);
});

app.get("/join-room", (req, res) => {
  if (issuedRoomsId.includes(req.query["room-id"])) {
    res.redirect(`/room/${req.query["room-id"]}`);
  } else {
    res.send("invalid room, 404 man");
  }
});

app.get("/room/:roomId", (req, res) => {
  res.render("room", {
    roomId: req.params.roomId,
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    if (users[roomId]) {
      users[roomId].push(socket.id);
    } else {
      users[roomId] = [socket.id];
    }
    socketToRoom[socket.id] = roomId;
    const usersInThisRoom = users[roomId].filter((id) => id !== socket.id);

    socket.emit("all-users", usersInThisRoom);
  });

  socket.on("added-video", (roomId) => {
    const usersInThisRoom = users[roomId].filter((id) => id !== socket.id);
    usersInThisRoom.forEach((user) => {
      io.to(user).emit("added-video");
    });
  });

  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit("user-joined", {
      signal: payload.signal,
      callerId: payload.callerId,
    });
  });

  socket.on("return-signal", (payload) => {
    io.to(payload.callerId).emit("received-returned-signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    let room = users[roomId];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomId] = room;
    }
    delete socketToRoom[socket.id];
    if (users[roomId]) {
      const usersInThisRoom = users[roomId].filter((id) => id !== socket.id);
      usersInThisRoom.forEach((user) => {
        socket.to(user).emit("user-disconnected", socket.id);
      });
    }
  });
});

server.listen(8080, () => {
  console.log("app listening");
});
