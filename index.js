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
    res.send("invalid room, 404 man");
  }
});

app.get("/room/:roomId", (req, res) => {
  res.render("room", { roomId: req.params.roomId });
});

io.on("connection", (socket) => {
  socket.on("join-room", (data) => {
    console.log("join-room", data.roomId, data.userId);
    socket.join(data.roomId);
    socket.to(data.roomId).broadcast.emit("user-connected", data);

    socket.on("disconnect", () => {
      socket.to(data.roomId).broadcast.emit("user-disconnected", data);
    });
  });
});

server.listen(8080, () => {
  console.log("app listening");
});
