const express = require("express");
const router = express.Router();
const {
  createNotification,
  getNotifications,
  updateNotification,
  deleteNotification,
} = require("../controllers/notificationController");

// Only POST requests
router.post("/create", createNotification);
router.post("/get", getNotifications);
router.post("/update", updateNotification);
router.post("/delete", deleteNotification);

module.exports = router;
