const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");

// POST /attendance/create
// Create or get today's attendance for a session
router.post("/create", async (req, res) => {
  try {
    const { sessionId, mentorId } = req.body;

    if (!sessionId || !mentorId) {
      return res.status(400).json({
        error: "sessionId and mentorId are required",
      });
    }

    // Get today's date as string (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    // Check if attendance already exists for this session today
    const existingAttendance = await Attendance.findOne({
      sessionId,
      mentorId,
      date: today,
    });

    if (existingAttendance) {
      return res.status(200).json(existingAttendance);
    }

    // Create new attendance document with empty records array
    const newAttendance = new Attendance({
      sessionId,
      mentorId,
      date: today,
      records: [],
    });

    await newAttendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    console.error("Error creating attendance:", error);
    res.status(500).json({
      error: error.message || "Failed to create attendance",
    });
  }
});

// POST /attendance/mark
// Mark attendance for a user
router.post("/mark", async (req, res) => {
  try {
    const { sessionId, userId, name } = req.body;

    if (!sessionId || !userId || !name) {
      return res.status(400).json({
        error: "sessionId, userId, and name are required",
      });
    }

    // Find attendance document by sessionId
    const attendance = await Attendance.findOne({ sessionId });

    if (!attendance) {
      return res.status(404).json({
        error: "Attendance record not found for this session",
      });
    }

    // Check if user already exists in records
    const userExists = attendance.records.some(
      (record) => record.userId && record.userId.toString() === userId
    );

    if (userExists) {
      return res.status(400).json({
        message: "Already marked",
      });
    }

    // Get current time in HH:MM:SS format
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Push new record
    attendance.records.push({
      userId,
      name,
      status: "present",
      time: currentTime,
      faceDetected: true,
    });

    await attendance.save();

    res.status(200).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      error: error.message || "Failed to mark attendance",
    });
  }
});

// GET /attendance/mentor/:mentorId
// Fetch all attendance documents by mentorId
router.get("/mentor/:mentorId", async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({
        error: "mentorId is required",
      });
    }

    // Fetch all attendance documents by mentorId, populate sessionId, and sort by latest date
    const attendanceRecords = await Attendance.find({ mentorId })
      .populate("sessionId")
      .sort({ date: -1 });

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({
        message: "No attendance records found for this mentor",
        data: [],
      });
    }

    res.status(200).json({
      message: "Attendance records fetched successfully",
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch attendance records",
    });
  }
});

// GET /attendance/session/:sessionId
// Get present and absent users for a session
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: "sessionId is required",
      });
    }

    // Find attendance document by sessionId
    const attendance = await Attendance.findOne({ sessionId });

    if (!attendance) {
      return res.status(404).json({
        error: "Attendance record not found for this session",
      });
    }

    // Fetch all users
    const allUsers = await User.find({}, { _id: 1, name: 1, email: 1 });

    // Extract present users from records
    const presentUserIds = attendance.records.map((record) =>
      record.userId?.toString()
    );
    const present = attendance.records;

    // Create absent users list by filtering users not in present list
    const absent = allUsers
      .filter((user) => !presentUserIds.includes(user._id.toString()))
      .map((user) => ({
        userId: user._id,
        name: user.name,
        status: "absent",
        time: null,
        faceDetected: false,
      }));

    res.status(200).json({
      message: "Attendance summary fetched successfully",
      data: {
        present,
        absent,
      },
    });
  } catch (error) {
    console.error("Error fetching session attendance summary:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch attendance summary",
    });
  }
});

module.exports = router;
