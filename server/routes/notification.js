const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const router = express.Router();

const isValidObjectId = (v) => typeof v === "string" && mongoose.Types.ObjectId.isValid(v);

// GET /notifications/:userId - return notifications for a user sorted newest first
router.get("/:userId", async (req, res) => {
  try {
    console.log("Fetching notifications for:", req.params.userId);

    if (!isValidObjectId(req.params.userId)) return res.status(400).json({ error: "Invalid userId" });

    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .lean();

    console.log("Found:", notifications.length);

    return res.json({ count: notifications.length, notifications });
  } catch (err) {
    console.error("[notifications/get]", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /notifications/read/:id - set isRead = true for a notification
router.patch("/read/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid notification id" });

    const updated = await Notification.findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: "Notification not found" });

    return res.json({ message: "Marked read", notification: updated });
  } catch (err) {
    console.error("[notifications/read]", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// PATCH /notifications/read-all/:userId - mark all notifications for user as read
router.patch("/read-all/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) return res.status(400).json({ error: "Invalid userId" });

    const result = await Notification.updateMany({ recipientId: userId, isRead: { $ne: true } }, { $set: { isRead: true } });
    return res.json({ message: "Marked all as read", modifiedCount: result.nModified ?? result.modifiedCount ?? 0 });
  } catch (err) {
    console.error("[notifications/read-all]", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

module.exports = router;
