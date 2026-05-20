const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const router = express.Router();

const isValidObjectId = (v) => typeof v === "string" && mongoose.Types.ObjectId.isValid(v);

// GET /notifications/unread-count/:userId - unread notification count for a user
router.get("/unread-count/:userId", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.userId)) return res.status(400).json({ error: "Invalid userId" });

    const count = await Notification.countDocuments({
      recipientId: req.params.userId,
      isRead: false,
    });

    return res.json({ count });
  } catch (err) {
    console.error("[notifications/unread-count]", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// GET /notifications/:userId - return notifications for a user sorted newest first
router.get("/:userId", async (req, res) => {
  try {
    console.log("Fetching notifications for:", req.params.userId);

    if (!isValidObjectId(req.params.userId)) return res.status(400).json({ error: "Invalid userId" });

    const notifications = await Notification.find({
      recipientId: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log("Found:", notifications.length);

    return res.json(notifications);
  } catch (err) {
    console.error("[notifications/get]", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PUT /notifications/read/:userId - mark all notifications for a user as read
router.put("/read/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) return res.status(400).json({ error: "Invalid userId" });

    await Notification.updateMany(
      {
        recipientId: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    return res.json({ success: true, message: "Marked all as read" });
  } catch (err) {
    console.error("[notifications/read]", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

module.exports = router;
