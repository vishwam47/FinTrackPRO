const Budget = require("../models/Budget");
const User = require("../models/User");

// Create Budget and link to user
const createBudget = async (req, res) => {
  try {
    const { userId, category, amount, period, startDate, endDate } = req.body;

    const newBudget = new Budget({
      category,
      amount,
      period,
      startDate,
      endDate,
    });
    await newBudget.save();

    await User.findByIdAndUpdate(userId, { $push: { budget: newBudget._id } });

    res.status(201).json({ message: "Budget created", budget: newBudget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all Budgets for a user
const getBudgets = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate("budget");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ budgets: user.budget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Budget and reflect in user
const updateBudget = async (req, res) => {
  try {
    const { budgetId, category, amount, period, startDate, endDate } = req.body;

    const updatedBudget = await Budget.findByIdAndUpdate(
      budgetId,
      { category, amount, period, startDate, endDate },
      { new: true }
    );

    if (!updatedBudget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json({ message: "Budget updated", budget: updatedBudget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Budget and remove from user
const deleteBudget = async (req, res) => {
  try {
    const { userId, budgetId } = req.body;

    const deletedBudget = await Budget.findByIdAndDelete(budgetId);

    if (!deletedBudget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    await User.findByIdAndUpdate(userId, { $pull: { budget: budgetId } });

    res.status(200).json({ message: "Budget deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
