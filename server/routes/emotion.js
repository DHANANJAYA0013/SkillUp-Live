const express = require("express");
const mongoose = require("mongoose");
const Emotion = require("../models/Emotion");
const Session = require("../models/Session");

const router = express.Router();

const ATTENTION_KEYS = ["engaged", "focused", "distracted", "inactive"];
const ALL_ATTENTION_STATUSES = ["engaged", "focused", "distracted", "inactive", "present", "rejoining"];
const ATTENTION_SCORE_WEIGHTS = {
  engaged: 0.8,
  focused: 1,
  distracted: 0.3,
  inactive: 0,
};

const createEmptyAttentionCounts = () => ATTENTION_KEYS.reduce((acc, key) => {
  acc[key] = 0;
  return acc;
}, {});

const createEmptyAllAttentionCounts = () => ALL_ATTENTION_STATUSES.reduce((acc, key) => {
  acc[key] = 0;
  return acc;
}, {});

const normalizeAttentionStatus = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const buildAttentionPercentages = (counts, total) => ATTENTION_KEYS.reduce((acc, key) => {
  acc[key] = total > 0 ? Number(((counts[key] / total) * 100).toFixed(1)) : 0;
  return acc;
}, {});

const getAttentionScore = (counts, total) => {
  if (!total) return 0;

  const weightedScore = ATTENTION_KEYS.reduce((score, key) => score + (counts[key] || 0) * ATTENTION_SCORE_WEIGHTS[key], 0);
  return Number(((weightedScore / total) * 100).toFixed(1));
};

const isExcludedRole = (role) => {
  if (typeof role !== "string") return false;

  const normalizedRole = role.trim().toLowerCase();
  if (!normalizedRole) return false;

  return normalizedRole === "mentor" || normalizedRole === "admin";
};

const getSessionCreatorId = (session) => {
  const creator = session?.mentor || session?.createdBy || session?.host || session?.creator || null;

  if (!creator) return null;
  if (typeof creator === "string") return creator;
  if (typeof creator === "object" && creator._id) return String(creator._id);

  return null;
};

const resolveSessionContext = async (sessionId) => {
  const lookup = {
    $or: [
      { roomId: sessionId },
      ...(mongoose.Types.ObjectId.isValid(sessionId) ? [{ _id: sessionId }] : []),
    ],
  };

  const session = await Session.findOne(lookup)
    .populate("mentor", "name email role")
    .lean();

  const candidateSessionIds = Array.from(new Set([
    sessionId,
    session?.roomId,
    session?._id ? String(session._id) : null,
  ].filter(Boolean).map((value) => String(value).trim())));

  return {
    session,
    mentorUserId: getSessionCreatorId(session),
    candidateSessionIds,
  };
};

const fetchEmotionDocsForSession = async (candidateSessionIds) => Emotion.find({
  sessionId: { $in: candidateSessionIds },
})
  .populate("userId", "name email role")
  .lean();

const buildAttentionSessionSummary = (sessionId, emotionDocs, mentorUserId) => {
  const summaryCounts = createEmptyAttentionCounts();
  const studentMap = new Map();
  let totalSamples = 0;

  emotionDocs.forEach((doc) => {
    const user = doc.userId && typeof doc.userId === "object" ? doc.userId : null;
    const userId = user?._id ? String(user._id) : null;
    const userRole = typeof user?.role === "string" ? user.role.trim().toLowerCase() : "";

    if ((mentorUserId && userId === mentorUserId) || isExcludedRole(userRole)) {
      return;
    }

    const studentKey = userId || `${doc.name || "unknown"}-${doc.sessionId || sessionId}`;
    const studentName = user?.name || doc.name || "Unknown student";

    if (!studentMap.has(studentKey)) {
      studentMap.set(studentKey, {
        userId,
        userRole: userRole || null,
        studentName,
        totalSamples: 0,
        counts: createEmptyAttentionCounts(),
        allCounts: createEmptyAllAttentionCounts(),
        lastSeenAt: null,
      });
    }

    const student = studentMap.get(studentKey);

    if (!Array.isArray(doc.emotions)) {
      return;
    }

    doc.emotions.forEach((emotionEntry) => {
      const status = normalizeAttentionStatus(emotionEntry.emotion);
      const timestamp = emotionEntry.timestamp ? new Date(emotionEntry.timestamp) : null;

      totalSamples += 1;

      if (ATTENTION_KEYS.includes(status)) {
        summaryCounts[status] += 1;
        student.counts[status] += 1;
      }

      if (ALL_ATTENTION_STATUSES.includes(status)) {
        student.allCounts[status] += 1;
      }

      student.totalSamples += 1;

      if (timestamp && (!student.lastSeenAt || timestamp.getTime() > new Date(student.lastSeenAt).getTime())) {
        student.lastSeenAt = timestamp.toISOString();
      }
    });
  });

  const summaryPercentages = buildAttentionPercentages(summaryCounts, totalSamples);
  const attentionScore = getAttentionScore(summaryCounts, totalSamples);

  const students = Array.from(studentMap.values())
    .map((student) => ({
      userId: student.userId,
      userRole: student.userRole,
      studentName: student.studentName,
      totalSamples: student.totalSamples,
      counts: student.counts,
      percentages: buildAttentionPercentages(student.counts, student.totalSamples),
      attentionScore: getAttentionScore(student.counts, student.totalSamples),
      allCounts: student.allCounts,
      allPercentages: ALL_ATTENTION_STATUSES.reduce((acc, key) => {
        acc[key] = student.totalSamples > 0 ? Number(((student.allCounts[key] / student.totalSamples) * 100).toFixed(1)) : 0;
        return acc;
      }, {}),
      lastSeenAt: student.lastSeenAt,
    }))
    .sort((a, b) => b.totalSamples - a.totalSamples || a.studentName.localeCompare(b.studentName));

  return {
    summary: {
      engaged: summaryCounts.engaged,
      focused: summaryCounts.focused,
      distracted: summaryCounts.distracted,
      inactive: summaryCounts.inactive,
      engagedPercent: summaryPercentages.engaged,
      focusedPercent: summaryPercentages.focused,
      distractedPercent: summaryPercentages.distracted,
      inactivePercent: summaryPercentages.inactive,
      percentages: summaryPercentages,
      totalSamples,
      totalLearners: students.length,
      attentionScore,
    },
    students,
  };
};

router.post("/", async (req, res) => {
  try {
    console.log("Emotion API hit");
    console.log(req.body);

    const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
    const attentionStatus = normalizeAttentionStatus(req.body?.emotion);
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const confidence = Number.isFinite(Number(req.body?.confidence)) ? Math.min(1, Math.max(0, Number(req.body.confidence))) : 0;
    const userId = typeof req.body?.userId === "string" && mongoose.Types.ObjectId.isValid(req.body.userId)
      ? req.body.userId
      : null;

    if (!sessionId || !userId || !attentionStatus) {
      return res.status(400).json({ error: "userId, sessionId and emotion are required" });
    }

    const timestamp = Number.isFinite(Number(req.body?.timestamp)) ? new Date(Number(req.body.timestamp)) : new Date();
    const SKIP_WINDOW_MS = 10000; // match frontend 10s cadence

    // Prevent noisy writes: skip if last stored emotion for this user/session is within SKIP_WINDOW_MS
    try {
      const existing = await Emotion.findOne({ userId, sessionId }).lean();
      if (existing && existing.lastEmotionAt) {
        const lastTs = new Date(existing.lastEmotionAt).getTime();
        if (timestamp.getTime() - lastTs < SKIP_WINDOW_MS) {
          console.log("[emotion] Skipped write due to server-side throttle", { userId, sessionId, attentionStatus, confidence, timestamp });
          return res.status(200).json({ success: true, skipped: true });
        }
      }
    } catch (err) {
      console.warn("[emotion] Error checking existing emotion:", err && err.message ? err.message : err);
    }

    const updated = await Emotion.findOneAndUpdate(
      {
        userId,
        sessionId,
      },
      {
        $push: {
          emotions: {
            emotion: attentionStatus,
            confidence,
            timestamp,
          },
        },
        $set: {
          name: name || "Unknown",
          lastEmotionAt: timestamp,
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
      lastEmotion: attentionStatus,
    });
  } catch (error) {
    console.error("[emotion/create]", error.message);
    return res.status(500).json({ error: "Failed to store emotion" });
  }
});

const handleSessionSummary = async (res, sessionId) => {
  try {
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const { mentorUserId, candidateSessionIds } = await resolveSessionContext(sessionId);
    const emotionDocs = await fetchEmotionDocsForSession(candidateSessionIds);

    return res.json(buildAttentionSessionSummary(sessionId, emotionDocs, mentorUserId));
  } catch (error) {
    console.error("[emotion/session-summary]", error.message);
    return res.status(500).json({ error: "Failed to build attention summary" });
  }
};

router.get("/summary", async (req, res) => {
  const sessionId = typeof req.query?.sessionId === "string" ? req.query.sessionId.trim() : "";
  return handleSessionSummary(res, sessionId);
});

router.get("/session-summary/:sessionId", async (req, res) => {
  const sessionId = typeof req.params?.sessionId === "string" ? req.params.sessionId.trim() : "";
  return handleSessionSummary(res, sessionId);
});

module.exports = router;
