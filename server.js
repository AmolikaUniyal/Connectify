
const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");
const { checkMessageSafety } = require("./middleware/messageSafety");
const { router: messageRoutes, normalizeRoom } = require("./routes/messages");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));

//connect frontend
app.use(express.static("public"));

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);



// Port
const PORT = process.env.PORT || 5000;

connectDB();


const server=http.createServer(app);

//socket.io setup

const io=require("socket.io")(server,{
  cors:{
    origin:"*",
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required."));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("username");
    if (!user) {
      return next(new Error("User account no longer exists."));
    }

    socket.user = { id: user._id.toString(), username: user.username };
    next();
  } catch (error) {
    next(new Error("Invalid or expired authentication token."));
  }
});

function isValidRoom(room) {
  return /^[a-z0-9-]{1,30}$/.test(room);
}

async function emitRoomPresence(room) {
  const sockets = await io.in(room).fetchSockets();
  const users = [...new Set(sockets.map((socket) => socket.user.username))];
  io.to(room).emit("roomPresence", { room, users });
}

//socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.user.username);
  let currentRoom = "general";
  socket.join(currentRoom);
  emitRoomPresence(currentRoom);

  socket.on("joinRoom", async (roomName) => {
    const room = normalizeRoom(roomName);
    if (!isValidRoom(room)) {
      return socket.emit("messageError", { message: "Invalid room name." });
    }

    const previousRoom = currentRoom;
    socket.leave(previousRoom);
    currentRoom = room;
    socket.join(currentRoom);
    socket.emit("roomJoined", { room: currentRoom });
    await Promise.all([emitRoomPresence(previousRoom), emitRoomPresence(currentRoom)]);
  });

  socket.on("sendMessage", async ({ content, room } = {}) => {
    try {
      const normalizedRoom = normalizeRoom(room || currentRoom);
      if (!isValidRoom(normalizedRoom) || normalizedRoom !== currentRoom) {
        return socket.emit("messageError", { message: "Join a valid room before sending a message." });
      }

      const safetyResult = checkMessageSafety(content);

      if (!safetyResult.allowed) {
        await Message.create({
          room: currentRoom,
          sender: socket.user.id,
          content: typeof content === "string" ? content.slice(0, 1000) : "Invalid message input",
          status: "blocked",
          blockReason: safetyResult.reason
        });
        socket.emit("messageBlocked", { reason: safetyResult.reason });
        return;
      }

      const savedMessage = await Message.create({
        room: currentRoom,
        sender: socket.user.id,
        content: safetyResult.message
      });

      const message = {
        id: savedMessage._id,
        room: currentRoom,
        content: savedMessage.content,
        sender: socket.user.username,
        senderId: socket.user.id,
        createdAt: savedMessage.createdAt
      };

      io.to(currentRoom).emit("receiveMessage", message);
    } catch (error) {
      console.error("Unable to process message:", error);
      socket.emit("messageError", { message: "Unable to send the message. Please try again." });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.username);
    emitRoomPresence(currentRoom);
  });
});



// start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



