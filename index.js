const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const { v4: uuidV4 } = require("uuid");

issuedRoomsId = [];

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
    res.send("sorry");
  }
});

app.get("/room/:roomId", (req, res) => {
  res.render("room", { roomId: req.params.roomId });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

server.listen(8080, () => {
  console.log("app listening");
});
