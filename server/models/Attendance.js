const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    name: {
      type: String,
      trim: true,
      required: false,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
    time: {
      type: String,
      required: false,
    },
    faceDetected: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true, timestamps: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

// Compound index for efficient queries
attendanceSchema.index({ sessionId: 1, mentorId: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
