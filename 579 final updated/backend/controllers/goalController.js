const Goal = require("../models/Goal");
const User = require("../models/User");

// Create Goal and link to user
const createGoal = async (req, res) => {
  try {
    const { userId, title, targetAmount, currentAmount, targetDate } = req.body;

    const newGoal = new Goal({
      title,
      targetAmount,
      currentAmount,
      targetDate,
    });
    await newGoal.save();

    await User.findByIdAndUpdate(userId, { $push: { goal: newGoal._id } });

    res.status(201).json({ message: "Goal created", goal: newGoal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all Goals for a user
const getGoals = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("goal");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ goals: user.goal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Goal
const updateGoal = async (req, res) => {
  try {
    const { goalId, title, targetAmount, currentAmount, targetDate } = req.body;

    const updatedGoal = await Goal.findByIdAndUpdate(
      goalId,
      { title, targetAmount, currentAmount, targetDate },
      { new: true }
    );

    if (!updatedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({ message: "Goal updated", goal: updatedGoal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Goal and unlink from user
const deleteGoal = async (req, res) => {
  try {
    const { userId, goalId } = req.body;

    const deletedGoal = await Goal.findByIdAndDelete(goalId);

    if (!deletedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    await User.findByIdAndUpdate(userId, { $pull: { goal: goalId } });

    res.status(200).json({ message: "Goal deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
};
