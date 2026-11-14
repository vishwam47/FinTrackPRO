const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema(
  {
    lender: { type: String, required: true, trim: true, maxlength: 120 },
    totalAmount: { type: Number, required: true, min: 0.01 },
    paidAmount: { type: Number, default: 0, min: 0 },
    emiAmount: { type: Number, min: 0 },
    dueDate: { type: Date },
    paymentHistory: [
      {
        amount: Number,
        date: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", debtSchema);
