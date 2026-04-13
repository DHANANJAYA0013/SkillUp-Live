const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  maxHttpBufferSize: 1e7,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// roomId -> { users: Map<socketId, { socketId, name }> }
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { users: new Map() });
  }
  return rooms.get(roomId);
}

function getRoomUsers(roomId) {
  if (!rooms.has(roomId)) return [];
  return Array.from(rooms.get(roomId).users.values());
}

function leaveRoom(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.users.delete(socket.id);
  socket.to(roomId).emit("user-left", { socketId: socket.id });
  socket.to(roomId).emit("peer-left", { peerId: socket.id });

  if (room.users.size === 0) {
    rooms.delete(roomId);
    console.log(`[room-deleted] ${roomId}`);
  }

  socket.leave(roomId);
  console.log(`[leave] ${socket.id} <- ${roomId}`);
}

app.get("/", (_req, res) => {
  res.send("SkillBridge signaling server is running");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

app.get("/room/:id", (req, res) => {
  res.json({ users: getRoomUsers(req.params.id) });
});

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.on("join-room", ({ roomId, userName }) => {
    if (!roomId) return;

    socket.rooms.forEach((r) => {
      if (r !== socket.id) leaveRoom(socket, r);
    });

    const normalizedName = (userName || `Guest-${socket.id.slice(0, 5)}`).toString();
    const room = getOrCreateRoom(roomId);
    const userInfo = { socketId: socket.id, name: normalizedName };

    room.users.set(socket.id, userInfo);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = normalizedName;

    const existingUsers = getRoomUsers(roomId).filter((u) => u.socketId !== socket.id);
    socket.emit("room-users", existingUsers);
    socket.emit("room-peers", { peers: existingUsers.map((u) => u.socketId) });

    socket.to(roomId).emit("user-joined", userInfo);
    socket.to(roomId).emit("peer-joined", { peerId: socket.id });

    console.log(`[join] ${normalizedName} (${socket.id}) -> ${roomId} | total ${room.users.size}`);
  });

  socket.on("offer", ({ targetId, to, sdp, offer }) => {
    const receiver = targetId || to;
    const payloadSdp = sdp || offer;
    if (!receiver || !payloadSdp) return;

    io.to(receiver).emit("offer", {
      sdp: payloadSdp,
      offer: payloadSdp,
      fromId: socket.id,
      from: socket.id,
      fromName: socket.data.userName,
    });
  });

  socket.on("answer", ({ targetId, to, sdp, answer }) => {
    const receiver = targetId || to;
    const payloadSdp = sdp || answer;
    if (!receiver || !payloadSdp) return;

    io.to(receiver).emit("answer", {
      sdp: payloadSdp,
      answer: payloadSdp,
      fromId: socket.id,
      from: socket.id,
    });
  });

  socket.on("ice-candidate", ({ targetId, to, candidate }) => {
    const receiver = targetId || to;
    if (!receiver || !candidate) return;

    io.to(receiver).emit("ice-candidate", {
      candidate,
      fromId: socket.id,
      from: socket.id,
    });
  });

  socket.on("chat-message", ({ message }) => {
    const roomId = socket.data.roomId;
    if (!roomId || !message) return;

    io.to(roomId).emit("chat-message", {
      fromId: socket.id,
      fromName: socket.data.userName,
      message,
      timestamp: Date.now(),
    });
  });

  socket.on("media-state", ({ video, audio }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    socket.to(roomId).emit("peer-media-state", {
      peerId: socket.id,
      video,
      audio,
    });
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((r) => {
      if (r !== socket.id) leaveRoom(socket, r);
    });
  });

  socket.on("disconnect", () => {
    console.log(`[disconnect] ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});