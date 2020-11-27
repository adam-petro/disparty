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
  console.log(socket.id);
  socket.on("join-room", (roomId, nickname) => {
    if (users[roomId]) {
      users[roomId].push({ userId: socket.id, nickname: nickname });
    } else {
      users[roomId] = [{ userId: socket.id, nickname: nickname }];
    }
    socketToRoom[socket.id] = roomId;
    const usersInThisRoom = users[roomId].filter(
      (user) => user.userId !== socket.id
    );

    socket.emit("all-users", usersInThisRoom);
  });

  socket.on("added-video", (roomId) => {
    const usersInThisRoom = users[roomId].filter(
      (user) => user.userId !== socket.id
    );
    usersInThisRoom.forEach((user) => {
      io.to(user.userId).emit("added-video");
    });
  });

  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit("user-joined", {
      signal: payload.signal,
      callerId: payload.callerId,
      nickname: payload.nickname,
    });
  });

  socket.on("return-signal", (payload) => {
    io.to(payload.callerId).emit("received-returned-signal", {
      signal: payload.signal,
      id: socket.id,
      nickname: payload.nickname,
    });
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    let room = users[roomId];
    if (room) {
      room = room.filter((user) => user.userId !== socket.id);
      users[roomId] = room;
    }
    delete socketToRoom[socket.id];
    if (users[roomId]) {
      const usersInThisRoom = users[roomId].filter(
        (user) => user.userId !== socket.id
      );
      usersInThisRoom.forEach((user) => {
        socket.to(user.userId).emit("user-disconnected", socket.id);
      });
    }
  });
});

server.listen(8080, () => {
  console.log("app listening");
});
