const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true, maxlength: 64 },
    description: { type: String, maxlength: 500 },
    date: { type: Date, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    receiptImage: { type: String, maxlength: 2048 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
