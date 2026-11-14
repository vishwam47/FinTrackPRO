const FinanceProfile = require("../models/FinanceProfile");

const analyzeFinance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, income, expenses = [], bills = [], savingsPct = 20 } = req.body;

    const validRows = (rows, needsCategory) => Array.isArray(rows) && rows.length <= 500 && rows.every((row) =>
      row && Number.isFinite(row.amount) && row.amount >= 0 &&
      (!needsCategory || (typeof row.category === "string" && row.category.length <= 64))
    );
    if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
        !Number.isFinite(income) || income <= 0 || !Number.isFinite(savingsPct) || savingsPct < 0 || savingsPct > 100 ||
        !validRows(expenses, true) || !validRows(bills, false)) {
      return res.status(400).json({ message: "Enter a valid month, positive income, savings percentage, and expense/bill rows" });
    }

    const savingsReserve = income * (savingsPct / 100);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalBills = bills.reduce((s, b) => s + (b.amount || 0), 0);
    const investableSurplus = income - totalExpenses - totalBills - savingsReserve;
    const surplusRatio = investableSurplus / income;

    const expenseBreakdown = {};
    expenses.forEach((e) => {
      expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    let riskScore, riskLabel, safeInvestMultiplier;
    if (surplusRatio < 0.2) {
      riskScore = Math.max(0, Math.round(surplusRatio * 15));
      riskLabel = "Conservative";
      safeInvestMultiplier = 0.5;
    } else if (surplusRatio <= 0.4) {
      riskScore = 4 + Math.round((surplusRatio - 0.2) * 10);
      riskLabel = "Moderate";
      safeInvestMultiplier = 0.7;
    } else {
      riskScore = Math.min(10, 7 + Math.round((surplusRatio - 0.4) * 10));
      riskLabel = "Aggressive";
      safeInvestMultiplier = 0.9;
    }

    const safeInvestAmount = Math.max(0, investableSurplus * safeInvestMultiplier);

    const profile = await FinanceProfile.findOneAndUpdate(
      { userId, month },
      {
        userId,
        month,
        income,
        totalExpenses,
        totalBills,
        expenseBreakdown,
        savingsReserve,
        investableSurplus,
        riskScore,
        riskLabel,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(200).json({ ...profile.toObject(), safeInvestAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getFinanceProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;

    if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ message: "month query param required" });
    }

    const profile = await FinanceProfile.findOne({ userId, month });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { analyzeFinance, getFinanceProfile };
