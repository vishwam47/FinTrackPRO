const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: { type: String }, 
  message: { type: String },
  isRead: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
