const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-__v");
    if (!user) return res.status(401).json({ error: "User not found" });

    if (user.role && !["learner", "mentor"].includes(user.role)) {
      user.role = "mentor";
      await user.save();
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: `Access restricted to ${role}s` });
  }
  next();
};

const requireProfile = (req, res, next) => {
  if (!req.user.profileCompleted) {
    return res.status(403).json({ error: "Profile not yet completed" });
  }
  next();
};

module.exports = { verifyToken, requireRole, requireProfile };
