const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Session = require("../models/Session");
const AdminSetting = require("../models/AdminSetting");

const router = express.Router();

const ADMIN_SETTINGS_KEY = "primary";
const ADMIN_CODE_REGEX = /^\d{6}$/;
const DEFAULT_ADMIN_CODE = "123456";

const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

const getNormalizedDefaultCode = () => {
  const envCode = typeof process.env.ADMIN_ACCESS_CODE === "string" ? process.env.ADMIN_ACCESS_CODE.trim() : "";
  return ADMIN_CODE_REGEX.test(envCode) ? envCode : DEFAULT_ADMIN_CODE;
};

const getOrCreateAdminSettings = async () => {
  let settings = await AdminSetting.findOne({ singletonKey: ADMIN_SETTINGS_KEY });

  if (!settings) {
    settings = await AdminSetting.create({
      singletonKey: ADMIN_SETTINGS_KEY,
      accessCodeHash: hashCode(getNormalizedDefaultCode()),
      updatedAt: new Date(),
    });
  }

  return settings;
};

const signAdminToken = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Server missing JWT_SECRET");
  }

  return jwt.sign({ role: "admin", type: "admin-access" }, process.env.JWT_SECRET, { expiresIn: "12h" });
};

const verifyAdminToken = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Admin token required" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.role !== "admin" || decoded?.type !== "admin-access") {
      return res.status(401).json({ error: "Invalid admin token" });
    }

    req.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
};

router.post("/login", async (req, res) => {
  try {
    const submittedCode = typeof req.body?.code === "string" ? req.body.code.trim() : "";

    if (!ADMIN_CODE_REGEX.test(submittedCode)) {
      return res.status(401).json({ error: "Invalid Admin Code" });
    }

    const settings = await getOrCreateAdminSettings();
    const isMatch = hashCode(submittedCode) === settings.accessCodeHash;

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Admin Code" });
    }

    const token = signAdminToken();
    return res.json({ token });
  } catch (err) {
    console.error("[Admin Login]", err.message);
    return res.status(500).json({ error: "Failed to process admin login" });
  }
});

router.get("/overview", verifyAdminToken, async (_req, res) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      totalMentors,
      totalLearners,
      totalSessions,
      liveSessions,
      completedSessions,
      users,
      mentors,
      sessions,
      settings,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "mentor" }),
      User.countDocuments({ role: "learner" }),
      Session.countDocuments({}),
      Session.countDocuments({ status: "live" }),
      Session.countDocuments({ status: "completed" }),
      User.find({})
        .select("name email role profileCompleted disabled createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ role: "mentor" })
        .select("name email profile.skills disabled createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Session.find({})
        .select("mentor mentorName mentorEmail title topic scheduledAt status roomId durationMinutes createdAt")
        .sort({ scheduledAt: -1 })
        .lean(),
      getOrCreateAdminSettings(),
    ]);

    const upcomingSessions = sessions.filter((session) => session.status === "scheduled" && new Date(session.scheduledAt) >= now);
    const liveSessionList = sessions.filter((session) => session.status === "live");
    const pastSessions = sessions.filter((session) => session.status === "completed" || new Date(session.scheduledAt) < now);

    return res.json({
      stats: {
        totalUsers,
        totalMentors,
        totalLearners,
        totalSessions,
        liveSessions,
        completedSessions,
      },
      users,
      mentors,
      sessions,
      sessionsByType: {
        upcoming: upcomingSessions,
        live: liveSessionList,
        past: pastSessions,
      },
      adminSettings: {
        updatedAt: settings.updatedAt,
      },
    });
  } catch (err) {
    console.error("[Admin Overview]", err.message);
    return res.status(500).json({ error: "Failed to fetch admin overview" });
  }
});

router.patch("/users/:id/disable", verifyAdminToken, async (req, res) => {
  try {
    const disabled = Boolean(req.body?.disabled);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { disabled },
      { new: true, runValidators: true }
    ).select("name email role disabled profileCompleted createdAt");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch {
    return res.status(400).json({ error: "Invalid user id" });
  }
});

router.delete("/users/:id", verifyAdminToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("_id role");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.deleteOne({ _id: user._id });

    if (user.role === "mentor") {
      await Session.deleteMany({ mentor: user._id });
    }

    return res.json({ message: "User removed" });
  } catch {
    return res.status(400).json({ error: "Invalid user id" });
  }
});

router.delete("/sessions/:id", verifyAdminToken, async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.json({ message: "Session removed" });
  } catch {
    return res.status(400).json({ error: "Invalid session id" });
  }
});

router.put("/settings/access-code", verifyAdminToken, async (req, res) => {
  try {
    const nextCode = typeof req.body?.newCode === "string" ? req.body.newCode.trim() : "";

    if (!ADMIN_CODE_REGEX.test(nextCode)) {
      return res.status(400).json({ error: "Admin code must be exactly 6 digits" });
    }

    const settings = await getOrCreateAdminSettings();
    settings.accessCodeHash = hashCode(nextCode);
    settings.updatedAt = new Date();
    await settings.save();

    return res.json({ message: "Admin code updated", updatedAt: settings.updatedAt });
  } catch (err) {
    console.error("[Admin Update Code]", err.message);
    return res.status(500).json({ error: "Failed to update admin code" });
  }
});

module.exports = { router };
