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

//Handle new connection
io.on("connection", (socket) => {
  //Create new room or join one if it already exists and notify others about new user
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
  //Notify new users a new local video has been added
  socket.on("added-video", (roomId) => {
    const usersInThisRoom = users[roomId].filter(
      (user) => user.userId !== socket.id
    );
    usersInThisRoom.forEach((user) => {
      io.to(user.userId).emit("added-video");
    });
  });
  //Receive a signal from new user who wants to establish a connection with existing user
  //Notify existing user about new connection request with an offer
  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit("user-joined", {
      signal: payload.signal,
      callerId: payload.callerId,
      nickname: payload.nickname,
    });
  });
  //Forward answer from existing user to an user requesting a connection
  socket.on("return-signal", (payload) => {
    io.to(payload.callerId).emit("received-returned-signal", {
      signal: payload.signal,
      id: socket.id,
      nickname: payload.nickname,
    });
  });
  //Handle user disconnection - remove him from server JSON structure and notify other users
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
