const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true, maxlength: 64 },
    amount: { type: Number, required: true, min: 0.01 },
    period: { type: String, enum: ["monthly", "weekly"], required: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);
