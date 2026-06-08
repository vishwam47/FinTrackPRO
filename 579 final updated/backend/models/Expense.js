const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    receiptImage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
