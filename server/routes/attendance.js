const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Session = require("../models/Session");

const getTodayDateString = () => new Date().toISOString().split("T")[0];
const normalizeName = (name) => (typeof name === "string" ? name.trim() : "");
const hasValidObjectId = (value) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const participantMatches = (participant, userId, normalizedName) => {
  if (hasValidObjectId(userId) && participant.userId) {
    return participant.userId.toString() === userId;
  }

  return (
    typeof participant.name === "string" &&
    participant.name.trim().toLowerCase() === normalizedName.toLowerCase()
  );
};

const recordMatches = (record, userId, normalizedName) => {
  if (hasValidObjectId(userId) && record.userId) {
    return record.userId.toString() === userId;
  }

  return typeof record.name === "string" && record.name.trim().toLowerCase() === normalizedName.toLowerCase();
};

const resolveSessionByIdOrRoomId = async (identifier) => {
  if (!identifier) return null;

  let session = null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    session = await Session.findById(identifier);
  }

  if (!session) {
    session = await Session.findOne({ roomId: identifier });
  }

  return session;
};

const findOrCreateSessionAttendance = async ({ requestedSessionIdentifier, mentorId }) => {
  const today = getTodayDateString();
  const session = await resolveSessionByIdOrRoomId(requestedSessionIdentifier);
  const roomId = session?.roomId || requestedSessionIdentifier;

  const query = session ? { sessionId: session._id } : { roomId, date: today };

  let attendance = await Attendance.findOne(query);

  if (!attendance) {
    const resolvedMentorId = mentorId || session?.mentor || null;
    attendance = await Attendance.create({
      sessionId: session?._id,
      roomId,
      mentorId: resolvedMentorId,
      date: today,
      records: [],
      waitingUsers: [],
      faceDetectedUsers: [],
      faceNotDetectedUsers: [],
    });

    console.info("[attendance/create] auto-created attendance", {
      attendanceId: String(attendance._id),
      sessionId: session?._id ? String(session._id) : null,
      roomId,
      mentorId: resolvedMentorId ? String(resolvedMentorId) : null,
      date: today,
    });
  } else {
    let touched = false;

    if (!attendance.roomId) {
      attendance.roomId = roomId;
      touched = true;
    }

    if (session?._id && !attendance.sessionId) {
      attendance.sessionId = session._id;
      touched = true;
    }

    if (!attendance.mentorId && (mentorId || session?.mentor)) {
      attendance.mentorId = mentorId || session.mentor;
      touched = true;
    }

    if (!attendance.faceNotDetectedUsers) {
      attendance.faceNotDetectedUsers = [];
      touched = true;
    }

    if (touched) {
      await attendance.save();
    }
  }

  return { attendance, session, roomId };
};

// POST /attendance/create
// Create or get today's attendance for a session
router.post("/create", async (req, res) => {
  try {
    const { sessionId, sessionIdentifier, mentorId } = req.body;
    const requestedSessionIdentifier = sessionIdentifier || sessionId;

    if (!requestedSessionIdentifier) {
      return res.status(400).json({
        error: "sessionId or sessionIdentifier is required",
      });
    }

    const { attendance } = await findOrCreateSessionAttendance({
      requestedSessionIdentifier,
      mentorId,
    });

    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error creating attendance:", error);
    res.status(500).json({
      error: error.message || "Failed to create attendance",
    });
  }
});

// POST /attendance/join
// Register a user in waiting list when they enter a room/session.
router.post("/join", async (req, res) => {
  try {
    const { sessionId, sessionIdentifier, roomId, mentorId, userId, name } = req.body;
    const requestedSessionIdentifier = sessionIdentifier || sessionId || roomId;
    const normalizedName = normalizeName(name);

    if (!requestedSessionIdentifier || !normalizedName) {
      return res.status(400).json({
        error: "sessionId/sessionIdentifier/roomId and name are required",
      });
    }

    const { attendance, roomId: resolvedRoomId } = await findOrCreateSessionAttendance({
      requestedSessionIdentifier,
      mentorId,
    });

    const participant = { name: normalizedName };
    if (hasValidObjectId(userId)) {
      participant.userId = userId;
    }

    const isAlreadyDetected = attendance.faceDetectedUsers.some((entry) =>
      participantMatches(entry, userId, normalizedName)
    );

    const waitingIndex = attendance.waitingUsers.findIndex((entry) =>
      participantMatches(entry, userId, normalizedName)
    );

    if (!isAlreadyDetected && waitingIndex === -1) {
      attendance.waitingUsers.push(participant);
    }

    const notDetectedIndex = (attendance.faceNotDetectedUsers || []).findIndex((entry) =>
      participantMatches(entry, userId, normalizedName)
    );
    if (!isAlreadyDetected && notDetectedIndex === -1) {
      attendance.faceNotDetectedUsers.push(participant);
    }

    const recordIndex = attendance.records.findIndex((record) =>
      recordMatches(record, userId, normalizedName)
    );

    if (recordIndex === -1) {
      const nextRecord = {
        name: normalizedName,
        status: isAlreadyDetected ? "present" : "waiting",
        time: null,
        faceDetected: isAlreadyDetected,
      };

      if (hasValidObjectId(userId)) {
        nextRecord.userId = userId;
      }

      attendance.records.push(nextRecord);
    } else if (!isAlreadyDetected) {
      attendance.records[recordIndex].status = "waiting";
      attendance.records[recordIndex].faceDetected = false;
      attendance.records[recordIndex].time = null;
    }

    await attendance.save();

    res.status(200).json({
      message: "User registered in waiting list",
      roomId: resolvedRoomId,
      attendance,
    });
  } catch (error) {
    console.error("Error registering join attendance:", error);
    res.status(500).json({
      error: error.message || "Failed to register joined user",
    });
  }
});

// POST /attendance/mark
// Mark attendance for a user
router.post("/mark", async (req, res) => {
  try {
    const { sessionId, sessionIdentifier, roomId, mentorId, userId, name } = req.body;
    const requestedSessionIdentifier = sessionIdentifier || sessionId || roomId;
    const normalizedName = normalizeName(name);
    const hasValidUserId = hasValidObjectId(userId);

    if (!requestedSessionIdentifier || !normalizedName) {
      return res.status(400).json({
        error: "sessionId/sessionIdentifier/roomId and name are required",
      });
    }

    const { attendance, session, roomId: resolvedRoomId } = await findOrCreateSessionAttendance({
      requestedSessionIdentifier,
      mentorId,
    });

    const alreadyDetected = attendance.faceDetectedUsers.some((entry) =>
      participantMatches(entry, userId, normalizedName)
    );

    if (alreadyDetected) {
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
    const waitingIndex = attendance.waitingUsers.findIndex((entry) =>
      participantMatches(entry, userId, normalizedName)
    );

    if (waitingIndex !== -1) {
      attendance.waitingUsers.splice(waitingIndex, 1);
    }

    const notDetectedIndex = (attendance.faceNotDetectedUsers || []).findIndex((entry) =>
      participantMatches(entry, userId, normalizedName)
    );
    if (notDetectedIndex !== -1) {
      attendance.faceNotDetectedUsers.splice(notDetectedIndex, 1);
    }

    const nextParticipant = { name: normalizedName };
    if (hasValidUserId) {
      nextParticipant.userId = userId;
    }

    attendance.faceDetectedUsers.push(nextParticipant);

    const existingRecordIndex = attendance.records.findIndex((record) =>
      recordMatches(record, userId, normalizedName)
    );

    if (existingRecordIndex === -1) {
      const nextRecord = {
        name: normalizedName,
        status: "present",
        time: currentTime,
        faceDetected: true,
      };

      if (hasValidUserId) {
        nextRecord.userId = userId;
      }

      attendance.records.push(nextRecord);
    } else {
      attendance.records[existingRecordIndex].status = "present";
      attendance.records[existingRecordIndex].time = currentTime;
      attendance.records[existingRecordIndex].faceDetected = true;
    }

    await attendance.save();

    console.info("[attendance/mark] marked present", {
      attendanceId: String(attendance._id),
      sessionId: session?._id ? String(session._id) : null,
      roomId: resolvedRoomId,
      userId: hasValidUserId ? userId : null,
      userName: normalizedName,
      recordCount: attendance.records.length,
    });

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
    const { sessionId: requestedSessionIdentifier } = req.params;

    if (!requestedSessionIdentifier) {
      return res.status(400).json({
        error: "sessionId is required",
      });
    }

    const session = await resolveSessionByIdOrRoomId(requestedSessionIdentifier);
    const attendanceQuery = session
      ? { sessionId: session._id }
      : { roomId: requestedSessionIdentifier };

    // Find latest attendance document for session or room.
    const attendance = await Attendance.findOne(attendanceQuery).sort({ date: -1, createdAt: -1 });

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
        waitingUsers: attendance.waitingUsers,
        faceDetectedUsers: attendance.faceDetectedUsers,
        faceNotDetectedUsers: attendance.faceNotDetectedUsers || [],
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
