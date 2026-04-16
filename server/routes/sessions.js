const express = require("express");
const mongoose = require("mongoose");
const Session = require("../models/Session");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

const findSessionByIdOrRoomId = async (identifier) => {
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

router.get("/", async (_req, res) => {
  try {
    const sessions = await Session.find({})
      .populate("mentor", "name email")
      .sort({ scheduledAt: 1 });

    const normalizedSessions = sessions.map((session) => ({
      _id: session._id,
      mentorId: typeof session.mentor === "object" && session.mentor?._id ? String(session.mentor._id) : String(session.mentor),
      title: session.title,
      description: session.description,
      date: session.date || (session.scheduledAt ? session.scheduledAt.toISOString().slice(0, 10) : ""),
      startTime: session.startTime || (session.scheduledAt ? session.scheduledAt.toTimeString().slice(0, 5) : ""),
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      topic: session.topic,
      roomId: session.roomId || `ROOM-${String(session._id).slice(-6).toUpperCase()}`,
      status: session.status || "scheduled",
      mentorName: session.mentorName || session.mentor?.name || "Mentor",
      mentorEmail: session.mentorEmail || session.mentor?.email || "",
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));

    return res.json({ count: normalizedSessions.length, sessions: normalizedSessions });
  } catch (err) {
    console.error("[Get Sessions]", err.message);
    return res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.post("/", verifyToken, requireRole("mentor"), async (req, res) => {
  try {
    const { title, description, dateTime, date, startTime, duration, topic } = req.body;

    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedDescription = typeof description === "string" ? description.trim() : "";
    const normalizedTopic = typeof topic === "string" ? topic.trim() : "";
    const normalizedDate = typeof date === "string" ? date.trim() : "";
    const normalizedStartTime = typeof startTime === "string" ? startTime.trim() : "";
    const normalizedDuration = Number(duration);

    if (!normalizedTitle || !normalizedDescription || !normalizedTopic || (!dateTime && (!normalizedDate || !normalizedStartTime))) {
      return res.status(400).json({
        error: "title, description, dateTime, duration, and topic are required",
      });
    }

    if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
      return res.status(400).json({ error: "duration must be a positive number (minutes)" });
    }

    const combinedDateTime = dateTime || `${normalizedDate}T${normalizedStartTime}`;
    const parsedDateTime = new Date(combinedDateTime);
    if (Number.isNaN(parsedDateTime.getTime())) {
      return res.status(400).json({ error: "dateTime must be a valid datetime" });
    }

    const roomId = `ROOM-${String(req.user._id).slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const session = await Session.create({
      mentor: req.user._id,
      mentorName: req.user.name,
      mentorEmail: req.user.email,
      title: normalizedTitle,
      description: normalizedDescription,
      date: normalizedDate || parsedDateTime.toISOString().slice(0, 10),
      startTime: normalizedStartTime || parsedDateTime.toTimeString().slice(0, 5),
      scheduledAt: parsedDateTime,
      durationMinutes: Math.round(normalizedDuration),
      topic: normalizedTopic,
      roomId,
      status: "scheduled",
    });

    return res.status(201).json({ session });
  } catch (err) {
    console.error("[Create Session]", err.message);
    return res.status(500).json({ error: "Failed to create session" });
  }
});

router.patch("/:id/start-live", verifyToken, requireRole("mentor"), async (req, res) => {
  try {
    const session = await findSessionByIdOrRoomId(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (String(session.mentor) !== String(req.user._id)) {
      return res.status(403).json({ error: "Only the session mentor can start this session" });
    }

    if ((session.mentorEmail || "").trim().toLowerCase() !== (req.user.email || "").trim().toLowerCase()) {
      return res.status(403).json({ error: "Only the mentor who created this session can start it" });
    }

    if (session.status === "completed") {
      return res.status(400).json({ error: "Completed sessions cannot be started" });
    }

    if (!session.roomId) {
      session.roomId = `ROOM-${String(session._id).slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    }

    session.status = "live";
    await session.save();

    return res.json({
      message: "Session started",
      session: {
        _id: session._id,
        status: session.status,
        roomId: session.roomId,
      },
    });
  } catch (err) {
    console.error("[Start Session]", err.message);
    return res.status(400).json({ error: "Invalid session id" });
  }
});

router.patch("/:id/complete", verifyToken, requireRole("mentor"), async (req, res) => {
  try {
    const session = await findSessionByIdOrRoomId(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (String(session.mentor) !== String(req.user._id)) {
      return res.status(403).json({ error: "Only the session mentor can complete this session" });
    }

    if ((session.mentorEmail || "").trim().toLowerCase() !== (req.user.email || "").trim().toLowerCase()) {
      return res.status(403).json({ error: "Only the mentor who created this session can complete it" });
    }

    session.status = "completed";
    await session.save();

    return res.json({
      message: "Session completed",
      session: {
        _id: session._id,
        status: session.status,
      },
    });
  } catch (err) {
    console.error("[Complete Session]", err.message);
    return res.status(400).json({ error: "Invalid session id" });
  }
});

module.exports = { router };
