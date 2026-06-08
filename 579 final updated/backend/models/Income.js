const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    source: { type: String },
    description: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Income", incomeSchema);
