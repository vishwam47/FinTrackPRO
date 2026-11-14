const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: { type: String, maxlength: 64 },
  message: { type: String, maxlength: 500 },
  isRead: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
