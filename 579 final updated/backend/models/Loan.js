const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema(
  {
    lender: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    emiAmount: { type: Number },
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
