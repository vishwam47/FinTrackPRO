const Loan = require("../models/Loan");
const User = require("../models/User");

// Create Loan and link to user
const createLoan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { lender, totalAmount, paidAmount, emiAmount, dueDate } = req.body;

    const newLoan = new Loan({
      lender,
      totalAmount,
      paidAmount,
      emiAmount,
      dueDate,
    });
    await newLoan.save();

    await User.findByIdAndUpdate(userId, { $push: { loan: newLoan._id } });

    res.status(201).json({ message: "Loan added", loan: newLoan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all Loans for a user
const getLoans = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate("loan");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ loans: user.loan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Loan
const updateLoan = async (req, res) => {
  try {
    const {
      loanId,
      lender,
      totalAmount,
      paidAmount,
      emiAmount,
      dueDate,
      paymentHistory,
    } = req.body;

    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      { lender, totalAmount, paidAmount, emiAmount, dueDate, paymentHistory },
      { new: true }
    );

    if (!updatedLoan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.status(200).json({ message: "Loan updated", loan: updatedLoan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Loan and unlink from user
const deleteLoan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { loanId } = req.body;

    const deletedLoan = await Loan.findByIdAndDelete(loanId);

    if (!deletedLoan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    await User.findByIdAndUpdate(userId, { $pull: { loan: loanId } });

    res.status(200).json({ message: "Loan deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createLoan,
  getLoans,
  updateLoan,
  deleteLoan,
};
