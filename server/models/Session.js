const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentorName: { type: String, required: true, trim: true, maxlength: 120 },
    mentorEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    date: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 1440 },
    topic: { type: String, required: true, trim: true, maxlength: 120 },
    roomId: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "completed"],
      default: "scheduled",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "sessions",
  }
);

sessionSchema.index({ mentor: 1, scheduledAt: 1 });

module.exports = mongoose.model("Session", sessionSchema);
