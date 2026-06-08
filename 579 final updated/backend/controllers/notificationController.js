const Notification = require("../models/Notification");
const User = require("../models/User");

// Create Notification and link to user
const createNotification = async (req, res) => {
  try {
    const { userId, type, message, isRead, date } = req.body;

    const newNotification = new Notification({ type, message, isRead, date });
    await newNotification.save();

    await User.findByIdAndUpdate(userId, {
      $push: { notification: newNotification._id },
    });

    res
      .status(201)
      .json({ message: "Notification created", notification: newNotification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all Notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("notification");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ notifications: user.notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Notification (e.g., mark as read)
const updateNotification = async (req, res) => {
  try {
    const { notificationId, type, message, isRead, date } = req.body;

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { type, message, isRead, date },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res
      .status(200)
      .json({
        message: "Notification updated",
        notification: updatedNotification,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Notification and unlink from user
const deleteNotification = async (req, res) => {
  try {
    const { userId, notificationId } = req.body;

    const deletedNotification = await Notification.findByIdAndDelete(
      notificationId
    );

    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { notification: notificationId },
    });

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  updateNotification,
  deleteNotification,
};
