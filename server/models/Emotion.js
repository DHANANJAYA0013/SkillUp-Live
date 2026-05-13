const mongoose = require("mongoose");

const emotionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    emotions: [
      {
        emotion: {
          type: String,
          trim: true,
          lowercase: true,
          required: true,
        },
        confidence: {
          type: Number,
          default: 0,
          min: 0,
          max: 1,
        },
        timestamp: {
          type: Date,
          default: Date.now,
          index: true,
        },
      },
    ],
    lastEmotionAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

emotionSchema.index({ sessionId: 1, updatedAt: 1 });
emotionSchema.index({ sessionId: 1, userId: 1 });
emotionSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("Emotion", emotionSchema);