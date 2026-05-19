const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    senderName: {
      type: String,
      trim: true,
      required: false,
    },
    type: {
      type: String,
      trim: true,
      required: false,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: false,
      index: true,
    },
    sessionTitle: {
      type: String,
      trim: true,
      required: false,
    },
    message: {
      type: String,
      trim: true,
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Notification", notificationSchema);
