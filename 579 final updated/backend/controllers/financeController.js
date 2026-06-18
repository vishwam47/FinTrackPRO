const FinanceProfile = require("../models/FinanceProfile");

const analyzeFinance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, income, expenses = [], bills = [], savingsPct = 20 } = req.body;

    if (!month || !income) {
      return res.status(400).json({ message: "month and income are required" });
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
      { upsert: true, new: true, setDefaultsOnInsert: true }
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

    if (!month) {
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
