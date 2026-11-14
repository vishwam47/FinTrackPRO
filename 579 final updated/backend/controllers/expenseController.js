const Expense = require("../models/Expense");
const User = require("../models/User");

// Create Expense and link to user
const createExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, category, description, date, isRecurring, receiptImage } =
      req.body;

    const newExpense = new Expense({
      amount,
      category,
      description,
      date,
      isRecurring,
      receiptImage,
    });
    await newExpense.save();

    await User.findByIdAndUpdate(userId, {
      $push: { expenses: newExpense._id },
    });

    res.status(201).json({ message: "Expense created", expense: newExpense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all Expenses for a user
const getExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate("expenses");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ expenses: user.expenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Expense
const updateExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      expenseId,
      amount,
      category,
      description,
      date,
      isRecurring,
      receiptImage,
    } = req.body;

    if (!(await User.exists({ _id: userId, expenses: expenseId }))) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      { amount, category, description, date, isRecurring, receiptImage },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res
      .status(200)
      .json({ message: "Expense updated", expense: updatedExpense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Expense and unlink from user
const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.body;

    if (!(await User.exists({ _id: userId, expenses: expenseId }))) {
      return res.status(404).json({ message: "Expense not found" });
    }
    const deletedExpense = await Expense.findByIdAndDelete(expenseId);

    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await User.findByIdAndUpdate(userId, { $pull: { expenses: expenseId } });

    res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
