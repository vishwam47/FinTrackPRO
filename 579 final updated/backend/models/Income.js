const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    source: { type: String, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Income", incomeSchema);
