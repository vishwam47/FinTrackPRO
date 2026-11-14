const mongoose = require("mongoose");

const financeProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: String, required: true },
  income: { type: Number, required: true },
  totalExpenses: { type: Number, default: 0 },
  totalBills: { type: Number, default: 0 },
  expenseBreakdown: { type: Object, default: {} },
  savingsReserve: { type: Number, default: 0 },
  investableSurplus: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  riskLabel: {
    type: String,
    enum: ["Conservative", "Moderate", "Aggressive"],
    default: "Conservative",
  },
  updatedAt: { type: Date, default: Date.now },
});

financeProfileSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("FinanceProfile", financeProfileSchema);
