const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/google", async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "Server missing GOOGLE_CLIENT_ID" });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server missing JWT_SECRET" });
    }

    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Missing credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, name, email, picture } = ticket.getPayload();
    if (!email) {
      return res.status(400).json({ error: "Google account did not provide an email" });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ googleId, name, email, avatar: picture });
      isNewUser = true;
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = picture;
      await user.save();
    }

    if (user.disabled) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    res.json({
      token: signToken(user._id),
      user,
      isNewUser,
      profileCompleted: user.profileCompleted,
    });
  } catch (err) {
    console.error("[Google Auth]", err.message);
    const message = process.env.NODE_ENV === "production"
      ? "Google authentication failed"
      : `Google authentication failed: ${err.message}`;
    res.status(400).json({ error: message, details: err.message });
  }
});

router.post("/github", async (req, res) => {
  try {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      return res.status(500).json({ error: "Server missing GitHub OAuth environment variables" });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server missing JWT_SECRET" });
    }

    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Missing code" });

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const { access_token } = await tokenRes.json();
    if (!access_token) return res.status(400).json({ error: "GitHub token exchange failed" });

    const [ghUser, ghEmails] = await Promise.all([
      fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${access_token}` } }).then((r) => r.json()),
      fetch("https://api.github.com/user/emails", { headers: { Authorization: `Bearer ${access_token}` } }).then((r) => r.json()),
    ]);

    const primaryEmail = Array.isArray(ghEmails)
      ? ghEmails.find((e) => e.primary && e.verified)?.email || ghEmails[0]?.email
      : null;

    if (!primaryEmail) return res.status(400).json({ error: "Could not retrieve GitHub email" });

    const githubId = String(ghUser.id);
    let user = await User.findOne({ $or: [{ githubId }, { email: primaryEmail }] });
    let isNewUser = false;

    if (!user) {
      user = await User.create({
        githubId,
        name: ghUser.name || ghUser.login,
        email: primaryEmail,
        avatar: ghUser.avatar_url,
      });
      isNewUser = true;
    } else if (!user.githubId) {
      user.githubId = githubId;
      await user.save();
    }

    if (user.disabled) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    res.json({
      token: signToken(user._id),
      user,
      isNewUser,
      profileCompleted: user.profileCompleted,
    });
  } catch (err) {
    console.error("[GitHub Auth]", err.message);
    res.status(400).json({ error: "GitHub authentication failed", details: err.message });
  }
});

router.get("/me", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

router.get("/mentors", async (_req, res) => {
  try {
    const mentors = await User.find({ role: "mentor" })
      .select("name email avatar profile.skills profile.bio followers")
      .sort({ createdAt: -1 });

    const normalizedMentors = mentors.map((mentor) => ({
      _id: mentor._id,
      name: mentor.name,
      email: mentor.email,
      avatar: mentor.avatar,
      skills: Array.isArray(mentor.profile?.skills) ? mentor.profile.skills : [],
      bio: typeof mentor.profile?.bio === "string" ? mentor.profile.bio : "",
      followersCount: Array.isArray(mentor.followers) ? mentor.followers.length : 0,
    }));

    res.json({ count: normalizedMentors.length, mentors: normalizedMentors });
  } catch (err) {
    console.error("[Get Mentors]", err.message);
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
});

router.get("/mentors/:id", async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: "mentor" })
      .select("name email avatar profile.skills profile.bio followers");

    if (!mentor) {
      return res.status(404).json({ error: "Mentor not found" });
    }

    const normalizedMentor = {
      _id: mentor._id,
      name: mentor.name,
      email: mentor.email,
      avatar: mentor.avatar,
      skills: Array.isArray(mentor.profile?.skills) ? mentor.profile.skills : [],
      bio: typeof mentor.profile?.bio === "string" ? mentor.profile.bio : "",
      followersCount: Array.isArray(mentor.followers) ? mentor.followers.length : 0,
    };

    return res.json({ mentor: normalizedMentor });
  } catch {
    return res.status(400).json({ error: "Invalid mentor id" });
  }
});

router.get("/learners/:id", async (req, res) => {
  try {
    const learner = await User.findOne({ _id: req.params.id, role: "learner" }).select("-__v");

    if (!learner) {
      return res.status(404).json({ error: "Learner not found" });
    }

    return res.json({ learner });
  } catch {
    return res.status(400).json({ error: "Invalid learner id" });
  }
});

router.get("/mentors/:id/follow-state", verifyToken, async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: "mentor" }).select("_id followers");
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    const isFollowing = Array.isArray(req.user.following)
      && req.user.following.some((followedId) => String(followedId) === String(mentor._id));

    return res.json({
      isFollowing,
      followersCount: Array.isArray(mentor.followers) ? mentor.followers.length : 0,
    });
  } catch {
    return res.status(400).json({ error: "Invalid mentor id" });
  }
});

router.post("/mentors/:id/follow", verifyToken, async (req, res) => {
  try {
    if (!["learner", "mentor"].includes(req.user.role || "")) {
      return res.status(403).json({ error: "Only learners or mentors can follow mentors" });
    }

    const mentor = await User.findOne({ _id: req.params.id, role: "mentor" }).select("_id followers");
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    if (String(req.user._id) === String(mentor._id)) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    await Promise.all([
      User.updateOne({ _id: req.user._id }, { $addToSet: { following: mentor._id } }),
      User.updateOne({ _id: mentor._id }, { $addToSet: { followers: req.user._id } }),
    ]);

    const updatedMentor = await User.findById(mentor._id).select("followers");

    return res.json({
      isFollowing: true,
      followersCount: Array.isArray(updatedMentor?.followers) ? updatedMentor.followers.length : 0,
    });
  } catch {
    return res.status(400).json({ error: "Invalid mentor id" });
  }
});

router.delete("/mentors/:id/follow", verifyToken, async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: "mentor" }).select("_id followers");
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    await Promise.all([
      User.updateOne({ _id: req.user._id }, { $pull: { following: mentor._id } }),
      User.updateOne({ _id: mentor._id }, { $pull: { followers: req.user._id } }),
    ]);

    const updatedMentor = await User.findById(mentor._id).select("followers");

    return res.json({
      isFollowing: false,
      followersCount: Array.isArray(updatedMentor?.followers) ? updatedMentor.followers.length : 0,
    });
  } catch {
    return res.status(400).json({ error: "Invalid mentor id" });
  }
});

router.put("/complete-profile", verifyToken, async (req, res) => {
  try {
    const { role, profile } = req.body;
    const payload = profile || {};

    const toTrimmedArray = (value) =>
      Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];

    const learnerProfile = {
      learningInterests: toTrimmedArray(payload.learningInterests),
      preferredLanguages: toTrimmedArray(payload.preferredLanguages),
      experienceLevel: typeof payload.experienceLevel === "string" ? payload.experienceLevel.trim() : "",
    };

    const mentorProfile = {
      skills: toTrimmedArray(payload.skills),
      yearsOfExperience:
        payload.yearsOfExperience === "" || payload.yearsOfExperience === null || payload.yearsOfExperience === undefined
          ? null
          : Number(payload.yearsOfExperience),
      bio: typeof payload.bio === "string" ? payload.bio.trim() : "",
      certifications: toTrimmedArray(payload.certifications),
      portfolioLinks: toTrimmedArray(payload.portfolioLinks),
    };

    if (!["learner", "mentor"].includes(role)) {
      return res.status(400).json({ error: "role must be learner or mentor" });
    }

    if (req.user.role && req.user.role !== role) {
      return res.status(400).json({ error: "Role is already set and cannot be changed" });
    }

    if (role === "learner" && (!learnerProfile.learningInterests.length || !learnerProfile.experienceLevel)) {
      return res.status(400).json({ error: "Learners must provide learningInterests and experienceLevel" });
    }

    if (role === "mentor" && (!mentorProfile.skills.length || !mentorProfile.bio)) {
      return res.status(400).json({ error: "Mentors must provide skills and bio" });
    }

    if (role === "mentor" && mentorProfile.yearsOfExperience !== null && Number.isNaN(mentorProfile.yearsOfExperience)) {
      return res.status(400).json({ error: "yearsOfExperience must be a valid number" });
    }

    req.user.role = role;
    req.user.profile = role === "learner" ? learnerProfile : mentorProfile;
    req.user.profileCompleted = true;
    await req.user.save();

    res.json({ user: req.user });
  } catch (err) {
    console.error("[Complete Profile]", err.message);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

router.get("/users", verifyToken, async (req, res) => {
  try {
    const filter = {};
    if (["learner", "mentor"].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.profileCompleted === "true") filter.profileCompleted = true;
    if (req.query.profileCompleted === "false") filter.profileCompleted = false;

    const users = await User.find(filter).select("-__v").sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    console.error("[Get Users]", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch {
    res.status(400).json({ error: "Invalid user id" });
  }
});

module.exports = { router };
