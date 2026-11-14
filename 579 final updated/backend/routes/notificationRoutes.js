const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createNotification,
  getNotifications,
  updateNotification,
  deleteNotification,
} = require("../controllers/notificationController");

router.use(auth);

router.post("/create", createNotification);
router.post("/get", getNotifications);
router.post("/update", updateNotification);
router.post("/delete", deleteNotification);

module.exports = router;
