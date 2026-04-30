const mongoose = require("mongoose");

const emotionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      required: false,
    },
    emotion: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

emotionSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model("Emotion", emotionSchema);