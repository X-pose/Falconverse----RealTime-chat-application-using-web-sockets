const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");
const { parse } = require("url");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connect", (socket) => {
    console.log("A user connected via connect:", socket.id);

    socket.on("create-room", () => {
      const roomId = Math.random().toString(36).substring(2, 8);
      socket.join(roomId);
      console.log("Room created:", roomId);
      socket.emit("room-created", roomId);
      socket.emit("room-joined", roomId)
    });

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-joined", socket.id);
      socket.emit("room-joined", roomId);
    });

    socket.on("send-message", ({ roomId, message, senderId }) => {
      socket.to(roomId).emit("receive-message", { message, senderId });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});