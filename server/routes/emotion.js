const express = require("express");
const mongoose = require("mongoose");
const Emotion = require("../models/Emotion");

const router = express.Router();

const EMOTION_KEYS = ["angry", "disgusted", "fearful", "happy", "neutral", "sad", "surprised"];

const createEmptyCounts = () => EMOTION_KEYS.reduce((acc, key) => {
  acc[key] = 0;
  return acc;
}, {});

const normalizeEmotion = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const buildPercentages = (counts, total) => EMOTION_KEYS.reduce((acc, key) => {
  acc[key] = total > 0 ? Number(((counts[key] / total) * 100).toFixed(1)) : 0;
  return acc;
}, {});

const getEngagementScore = (counts, total) => {
  if (!total) return 0;
  return Number((((counts.happy + counts.neutral) / total) * 100).toFixed(1));
};

router.post("/", async (req, res) => {
  try {
    const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
    const emotion = normalizeEmotion(req.body?.emotion);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const timestamp = Number.isFinite(Number(req.body?.timestamp)) ? new Date(Number(req.body.timestamp)) : new Date();
    const userId = typeof req.body?.userId === "string" && mongoose.Types.ObjectId.isValid(req.body.userId)
      ? req.body.userId
      : null;

    if (!sessionId || !emotion) {
      return res.status(400).json({ error: "sessionId and emotion are required" });
    }

    const saved = await Emotion.create({
      userId,
      sessionId,
      name,
      emotion,
      timestamp,
    });

    return res.status(201).json({ message: "Emotion stored", emotion: saved });
  } catch (error) {
    console.error("[emotion/create]", error.message);
    return res.status(500).json({ error: "Failed to store emotion" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const sessionId = typeof req.query?.sessionId === "string" ? req.query.sessionId.trim() : "";

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const samples = await Emotion.find({ sessionId })
      .populate("userId", "name email")
      .sort({ timestamp: 1 })
      .lean();

    const counts = createEmptyCounts();
    const studentMap = new Map();

    samples.forEach((sample) => {
      const emotion = normalizeEmotion(sample.emotion);
      if (!(emotion in counts)) {
        counts[emotion] = 0;
      }
      counts[emotion] += 1;

      const user = sample.userId && typeof sample.userId === "object" ? sample.userId : null;
      const studentKey = user?._id ? String(user._id) : sample.name || "unknown";
      const studentName = user?.name || sample.name || "Unknown student";

      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, {
          userId: user?._id ? String(user._id) : null,
          studentName,
          total: 0,
          counts: createEmptyCounts(),
          latestEmotion: emotion,
          lastSeenAt: sample.timestamp,
        });
      }

      const student = studentMap.get(studentKey);
      student.total += 1;
      if (!(emotion in student.counts)) {
        student.counts[emotion] = 0;
      }
      student.counts[emotion] += 1;
      student.latestEmotion = emotion;
      student.lastSeenAt = sample.timestamp;
    });

    const total = samples.length;
    const percentages = buildPercentages(counts, total);
    const engagement = getEngagementScore(counts, total);

    const students = Array.from(studentMap.values())
      .map((student) => ({
        ...student,
        percentages: buildPercentages(student.counts, student.total),
        engagement: getEngagementScore(student.counts, student.total),
      }))
      .sort((a, b) => b.total - a.total || a.studentName.localeCompare(b.studentName));

    return res.json({
      sessionId,
      total,
      counts,
      percentages,
      engagement,
      students,
    });
  } catch (error) {
    console.error("[emotion/summary]", error.message);
    return res.status(500).json({ error: "Failed to build emotion summary" });
  }
});

module.exports = router;