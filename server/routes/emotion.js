const express = require("express");
const mongoose = require("mongoose");
const Emotion = require("../models/Emotion");

const router = express.Router();

const EMOTION_KEYS = ["angry", "disgusted", "fearful", "happy", "neutral", "sad", "surprised"];
const DUPLICATE_THROTTLE_MS = 5000; // 5 seconds - prevent duplicate spam

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
    const confidence = Number.isFinite(Number(req.body?.confidence)) ? Math.min(1, Math.max(0, Number(req.body.confidence))) : 0;
    const timestamp = Number.isFinite(Number(req.body?.timestamp)) ? new Date(Number(req.body.timestamp)) : new Date();
    const userId = typeof req.body?.userId === "string" && mongoose.Types.ObjectId.isValid(req.body.userId)
      ? req.body.userId
      : null;

    if (!sessionId || !emotion) {
      return res.status(400).json({ error: "sessionId and emotion are required" });
    }

    // Build query to find existing document for this user and session
    const query = {
      sessionId,
      ...(userId ? { userId } : { name }),
    };

    // Check if we should skip duplicate emotion within throttle window
    let skipDueToThrottle = false;
    const existing = await Emotion.findOne(query);
    
    if (existing && existing.emotions.length > 0) {
      const lastEmotion = existing.emotions[existing.emotions.length - 1];
      const timeSinceLastEmotion = timestamp - lastEmotion.timestamp;
      
      // Skip if same emotion detected within throttle window
      if (lastEmotion.emotion === emotion && timeSinceLastEmotion < DUPLICATE_THROTTLE_MS) {
        skipDueToThrottle = true;
      }
    }

    if (skipDueToThrottle) {
      return res.status(200).json({ message: "Emotion throttled (duplicate within 5s)", skipped: true });
    }

    // Use findOneAndUpdate to push emotion into emotions array
    const updated = await Emotion.findOneAndUpdate(
      query,
      {
        $set: {
          name: name || existing?.name || "Unknown",
          lastEmotionAt: timestamp,
        },
        $push: {
          emotions: {
            emotion,
            confidence,
            timestamp,
          },
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(201).json({ 
      message: "Emotion recorded", 
      emotionId: updated._id,
      total: updated.emotions.length,
      lastEmotion: emotion,
    });
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

    // Get all emotion documents for this session
    const emotionDocs = await Emotion.find({ sessionId })
      .populate("userId", "name email")
      .lean();

    const counts = createEmptyCounts();
    const studentMap = new Map();

    // Aggregate emotions from all documents
    emotionDocs.forEach((doc) => {
      const user = doc.userId && typeof doc.userId === "object" ? doc.userId : null;
      const studentKey = user?._id ? String(user._id) : doc.name || "unknown";
      const studentName = user?.name || doc.name || "Unknown student";

      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, {
          userId: user?._id ? String(user._id) : null,
          studentName,
          total: 0,
          counts: createEmptyCounts(),
          latestEmotion: "neutral",
          lastSeenAt: null,
          emotionHistory: [],
        });
      }

      const student = studentMap.get(studentKey);
      
      // Process emotions array from this document
      if (Array.isArray(doc.emotions)) {
        doc.emotions.forEach((emotionEntry) => {
          const emotion = normalizeEmotion(emotionEntry.emotion);
          
          // Add to global counts
          if (!(emotion in counts)) {
            counts[emotion] = 0;
          }
          counts[emotion] += 1;

          // Add to student counts
          student.total += 1;
          if (!(emotion in student.counts)) {
            student.counts[emotion] = 0;
          }
          student.counts[emotion] += 1;
          student.latestEmotion = emotion;
          student.lastSeenAt = emotionEntry.timestamp;
          
          // Keep history for reference
          student.emotionHistory.push({
            emotion,
            confidence: emotionEntry.confidence || 0,
            timestamp: emotionEntry.timestamp,
          });
        });
      }
    });

    const total = emotionDocs.reduce((sum, doc) => sum + (doc.emotions?.length || 0), 0);
    const percentages = buildPercentages(counts, total);
    const engagement = getEngagementScore(counts, total);

    const students = Array.from(studentMap.values())
      .map((student) => ({
        userId: student.userId,
        studentName: student.studentName,
        total: student.total,
        counts: student.counts,
        percentages: buildPercentages(student.counts, student.total),
        engagement: getEngagementScore(student.counts, student.total),
        latestEmotion: student.latestEmotion,
        lastSeenAt: student.lastSeenAt,
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
