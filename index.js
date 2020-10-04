const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const { PeerServer } = require("peer");
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`<h1>Disparty</h1>
  <a href="/new-room"><button>Create new room</button></a>`);
});

app.get("/new-room", (req, res) => {
  res.redirect(`/room/${uuidV4()}`);
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

const peerServer = PeerServer({ port: 8081, path: "/" });
server.listen(8080, () => {
  console.log("app listening");
});
