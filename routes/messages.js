const express = require("express");
const Message = require("../models/Message");
const auth = require("../middleware/auth");

const router = express.Router();

function normalizeRoom(room) {
  return String(room || "general").trim().toLowerCase().replace(/\s+/g, "-");
}

router.get("/:room", auth, async (req, res) => {
  const room = normalizeRoom(req.params.room);

  if (!/^[a-z0-9-]{1,30}$/.test(room)) {
    return res.status(400).json({ message: "Invalid room name." });
  }

  const messages = await Message.find({ room, status: "delivered" })
    .populate("sender", "username")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({
    messages: messages.reverse().map((message) => ({
      id: message._id,
      room: message.room,
      content: message.content,
      sender: message.sender?.username || "Unknown user",
      createdAt: message.createdAt
    }))
  });
});

module.exports = { router, normalizeRoom };
