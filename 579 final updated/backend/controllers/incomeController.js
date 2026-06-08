const Income = require("../models/Income");
const User = require("../models/User");

// Create Income and link to user
const createIncome = async (req, res) => {
  try {
    const { userId, amount, source, description, date } = req.body;

    const newIncome = new Income({ amount, source, description, date });
    await newIncome.save();

    await User.findByIdAndUpdate(userId, { $push: { income: newIncome._id } });

    res.status(201).json({ message: "Income added", income: newIncome });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all Income for a user
const getIncome = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("income");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ income: user.income });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Income
const updateIncome = async (req, res) => {
  try {
    const { incomeId, amount, source, description, date } = req.body;

    const updatedIncome = await Income.findByIdAndUpdate(
      incomeId,
      { amount, source, description, date },
      { new: true }
    );

    if (!updatedIncome) {
      return res.status(404).json({ message: "Income record not found" });
    }

    res.status(200).json({ message: "Income updated", income: updatedIncome });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Income and unlink from user
const deleteIncome = async (req, res) => {
  try {
    const { userId, incomeId } = req.body;

    const deletedIncome = await Income.findByIdAndDelete(incomeId);

    if (!deletedIncome) {
      return res.status(404).json({ message: "Income record not found" });
    }

    await User.findByIdAndUpdate(userId, { $pull: { income: incomeId } });

    res.status(200).json({ message: "Income deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createIncome,
  getIncome,
  updateIncome,
  deleteIncome,
};
