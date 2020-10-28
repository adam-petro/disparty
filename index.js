const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const { v4: uuidV4 } = require("uuid");

//String
issuedRoomsId = [];

// roomId:initiatorConnectionString
initiators = {};
socketrooms = {};

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/new-room", (req, res) => {
  newId = uuidV4();
  issuedRoomsId.push(newId);
  res.redirect(`/room/${newId}/#init`);
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
    initiator: initiators[req.params.roomId],
  });
});
io.on("connection", (socket) => {
  socket.on("initiated-room", (data) => {
    if (!initiators[data.roomId]) {
      initiators[data.roomId] = data.userId;
      socketrooms[data.roomId] = data.socketId;
    }

    socket.on("disconnect", () => {
      socket.to(data.roomId).broadcast.emit("user-disconnected", data);
    });
  });

  socket.on("signal-reply", (data) => {
    socket.join(data.roomId);
    socket
      .to(socketrooms[data.roomId])
      .broadcast.emit("user-connected", data.connectionData);
  });
});

server.listen(8080, () => {
  console.log("app listening");
});
