const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    period: { type: String, enum: ["monthly", "weekly"], required: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
