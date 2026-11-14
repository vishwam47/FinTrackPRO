import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiTrash2, FiTrendingUp, FiTrendingDown, FiMinus,
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiLoader,
} from "react-icons/fi";
import { GiMoneyStack } from "react-icons/gi";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Header from "../components/Header";
import { financeAPI } from "../services/api";
import { stockRecommenderAPI } from "../services/mlapi";

const DONUT_COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981"];

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const TrendIcon = ({ trend }) => {
  if (trend === "up")   return <FiTrendingUp  className="inline text-green-500 ml-1" />;
  if (trend === "down") return <FiTrendingDown className="inline text-red-500   ml-1" />;
  return <FiMinus className="inline text-gray-400 ml-1" />;
};

const SentimentBadge = ({ score }) => {
  if (score >  0.1) return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Positive</span>;
  if (score < -0.1) return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100   text-red-700">Negative</span>;
  return                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100  text-gray-600">Neutral</span>;
};

const RiskBadge = ({ band }) => {
  const map = {
    low_risk:    { label: "Low Risk",    cls: "bg-green-100 text-green-700" },
    medium_risk: { label: "Medium Risk", cls: "bg-yellow-100 text-yellow-700" },
    high_risk:   { label: "High Risk",   cls: "bg-red-100   text-red-700" },
  };
  const { label, cls } = map[band] || { label: band, cls: "bg-gray-100 text-gray-600" };
  return <span className={`px-2 py-0.5 text-xs rounded-full ${cls}`}>{label}</span>;
};

const cardBorder = (stock) => {
  if (!stock.can_afford)                                         return "border-gray-300";
  if (stock.gemini_verdict === "Yes")                            return "border-green-400";
  if (stock.gemini_verdict === "No")                             return "border-amber-400";
  if (stock.gemini_verdict === "Unavailable")                    return "border-blue-300";
  return "border-gray-300";
};

const VerdictBadge = ({ verdict }) => {
  if (verdict === "Yes")         return <span className="flex items-center gap-1 text-green-700 font-semibold"><FiCheckCircle /> Recommended</span>;
  if (verdict === "No")          return <span className="flex items-center gap-1 text-amber-700 font-semibold"><FiXCircle    /> Not Recommended</span>;
  if (verdict === "Unavailable") return <span className="flex items-center gap-1 text-blue-600  font-semibold"><FiAlertTriangle /> Unavailable</span>;
  return                                <span className="flex items-center gap-1 text-gray-500  font-semibold"><FiMinus /> Skipped</span>;
};

const safeReason = (text) => {
  if (!text) return "";
  if (text.startsWith("Error:") || text.startsWith("error") || text.includes("429") || text.includes("quota"))
    return "Analysis unavailable — please try again shortly.";
  return text;
};

export default function FinanceAnalysis() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // ── Section A state ──────────────────────────────────────────────────────────
  const [income, setIncome]     = useState("");
  const [savingsPct, setSavingsPct] = useState(20);
  const [month, setMonth]       = useState(currentMonth);
  const [expenses, setExpenses] = useState([
    { amount: "", category: "rent" },
    { amount: "", category: "food" },
    { amount: "", category: "transport" },
  ]);
  const [bills, setBills] = useState([
    { amount: "", name: "electricity" },
    { amount: "", name: "internet" },
  ]);
  const [profile, setProfile]   = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  // ── Section B state ──────────────────────────────────────────────────────────
  const [amountToInvest, setAmountToInvest] = useState("");
  const [fetchingStocks, setFetchingStocks] = useState(false);
  const [stocks, setStocks]     = useState(null);
  const [stockError, setStockError] = useState("");

  // ── Expense / bill row helpers ────────────────────────────────────────────────
  const updateExpense = (i, field, val) =>
    setExpenses((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const addExpense    = () => setExpenses((p) => [...p, { amount: "", category: "" }]);
  const removeExpense = (i) => setExpenses((p) => p.filter((_, idx) => idx !== i));

  const updateBill    = (i, field, val) =>
    setBills((prev) => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));
  const addBill       = () => setBills((p) => [...p, { amount: "", name: "" }]);
  const removeBill    = (i) => setBills((p) => p.filter((_, idx) => idx !== i));

  // ── Section A submit ──────────────────────────────────────────────────────────
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzeError("");
    setProfile(null);
    setStocks(null);
    setAnalyzing(true);
    try {
      const { data } = await financeAPI.analyze({
        month,
        income: parseFloat(income),
        savingsPct: parseFloat(savingsPct),
        expenses: expenses
          .filter((e) => e.amount && e.category)
          .map((e) => ({ amount: parseFloat(e.amount), category: e.category })),
        bills: bills
          .filter((b) => b.amount && b.name)
          .map((b) => ({ amount: parseFloat(b.amount), name: b.name })),
      });
      setProfile(data);
    } catch (err) {
      setAnalyzeError(err.response?.data?.message || "Failed to analyze finances.");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Section B submit ──────────────────────────────────────────────────────────
  const handleFindStocks = async () => {
    setStockError("");
    setStocks(null);
    setFetchingStocks(true);
    try {
      const { data } = await stockRecommenderAPI.recommend({
        income:            profile.income,
        totalExpenses:     profile.totalExpenses,
        totalBills:        profile.totalBills,
        investableSurplus: profile.investableSurplus,
        riskScore:         profile.riskScore,
        riskLabel:         profile.riskLabel,
        amountToInvest:    parseFloat(amountToInvest),
      });
      setStocks(data);
    } catch (err) {
      setStockError(err.response?.data?.detail || "Failed to fetch stock recommendations.");
    } finally {
      setFetchingStocks(false);
    }
  };

  // ── Donut chart data ──────────────────────────────────────────────────────────
  const donutData = profile
    ? [
        { name: "Expenses",          value: profile.totalExpenses   },
        { name: "Bills",             value: profile.totalBills      },
        { name: "Savings Reserve",   value: profile.savingsReserve  },
        { name: "Investable Surplus",value: Math.max(0, profile.investableSurplus) },
      ].filter((d) => d.value > 0)
    : [];

  const invest = parseFloat(amountToInvest) || 0;
  const investWarning = profile && invest > profile.investableSurplus && invest <= profile.income;
  const investBlock   = profile && invest > profile.income;

  const riskColor = {
    Conservative: "bg-blue-100 text-blue-700",
    Moderate:     "bg-yellow-100 text-yellow-700",
    Aggressive:   "bg-red-100 text-red-700",
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* ── Page title ── */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <GiMoneyStack className="text-green-600" /> Smart Invest Hub
            </h1>
            <p className="text-gray-500 mt-1">Analyse your finances and get personalised stock picks powered by Gemini.</p>
          </div>

          {/* ═══════════════ SECTION A — Finance Input ═══════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 1 — Your Monthly Finances</h2>
            <form onSubmit={handleAnalyze} className="space-y-5">

              {/* Income + month + savings row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (₹)</label>
                  <input
                    type="number" min="1" required
                    value={income} onChange={(e) => setIncome(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:outline-none"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <input
                    type="month" required
                    value={month} onChange={(e) => setMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Savings %</label>
                  <input
                    type="number" min="0" max="80" required
                    value={savingsPct} onChange={(e) => setSavingsPct(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Expenses */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Expenses</label>
                  <button type="button" onClick={addExpense}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
                    <FiPlus /> Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {expenses.map((exp, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="number" min="0" placeholder="Amount"
                        value={exp.amount} onChange={(e) => updateExpense(i, "amount", e.target.value)}
                        className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-400 focus:outline-none"
                      />
                      <input
                        type="text" placeholder="Category (e.g. rent)"
                        value={exp.category} onChange={(e) => updateExpense(i, "category", e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-400 focus:outline-none"
                      />
                      {expenses.length > 1 && (
                        <button type="button" onClick={() => removeExpense(i)}
                          className="text-red-400 hover:text-red-600"><FiTrash2 /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bills */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Bills</label>
                  <button type="button" onClick={addBill}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
                    <FiPlus /> Add row
                  </button>
                </div>
                <div className="space-y-2">
                  {bills.map((bill, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="number" min="0" placeholder="Amount"
                        value={bill.amount} onChange={(e) => updateBill(i, "amount", e.target.value)}
                        className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-400 focus:outline-none"
                      />
                      <input
                        type="text" placeholder="Bill name (e.g. electricity)"
                        value={bill.name} onChange={(e) => updateBill(i, "name", e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-400 focus:outline-none"
                      />
                      {bills.length > 1 && (
                        <button type="button" onClick={() => removeBill(i)}
                          className="text-red-400 hover:text-red-600"><FiTrash2 /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {analyzeError && (
                <p className="text-red-600 text-sm">{analyzeError}</p>
              )}

              <button type="submit" disabled={analyzing}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 transition-colors">
                {analyzing ? <><FiLoader className="animate-spin" /> Analysing…</> : "Analyse My Finances"}
              </button>
            </form>
          </motion.div>

          {/* ═══════════════ SECTION A — Results ═══════════════ */}
          <AnimatePresence>
            {profile && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Income",       value: formatINR(profile.income),            border: "border-blue-400" },
                    { label: "Total Spent",         value: formatINR(profile.totalExpenses + profile.totalBills), border: "border-red-400" },
                    { label: "Investable Surplus",  value: formatINR(Math.max(0, profile.investableSurplus)),     border: "border-green-400" },
                    { label: "Risk Profile",
                      value: <span className={`px-2 py-0.5 rounded-full text-sm font-semibold ${riskColor[profile.riskLabel] || ""}`}>{profile.riskLabel}</span>,
                      border: "border-purple-400" },
                  ].map(({ label, value, border }) => (
                    <div key={label} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${border}`}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-lg font-bold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Safe invest hint */}
                <p className="text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  You can safely invest up to <strong>{formatINR(profile.safeInvestAmount)}</strong> this month.
                </p>

                {/* Donut chart */}
                {donutData.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-md p-6">
                    <h3 className="text-base font-semibold text-gray-700 mb-4">Income Breakdown</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                          dataKey="value" paddingAngle={3}>
                          {donutData.map((_, i) => (
                            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatINR(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* ═══════════════ SECTION B — Investment Input ═══════════════ */}
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 2 — How Much to Invest?</h2>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <input
                        type="number" min="1"
                        value={amountToInvest}
                        onChange={(e) => setAmountToInvest(e.target.value)}
                        placeholder="Enter amount in ₹"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:outline-none"
                      />
                      {investWarning && (
                        <p className="mt-1 text-amber-600 text-xs flex items-center gap-1">
                          <FiAlertTriangle /> Amount exceeds your investable surplus — this may strain your savings.
                        </p>
                      )}
                      {investBlock && (
                        <p className="mt-1 text-red-600 text-xs flex items-center gap-1">
                          <FiXCircle /> Amount exceeds your total income — not allowed.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleFindStocks}
                      disabled={fetchingStocks || !amountToInvest || invest <= 0 || investBlock}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                    >
                      {fetchingStocks
                        ? <><FiLoader className="animate-spin" /> Finding stocks…</>
                        : "Find My Stocks"}
                    </button>
                  </div>
                  {fetchingStocks && (
                    <p className="mt-3 text-sm text-gray-500">
                      Gemini is analysing each stock — this takes up to 90 seconds for all 15 stocks.
                    </p>
                  )}
                  {stockError && <p className="mt-2 text-red-600 text-sm">{stockError}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════════ SECTION C — Stock Cards ═══════════════ */}
          <AnimatePresence>
            {stocks && (
              <motion.div
                key="stocks"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 3 — Your Stock Recommendations</h2>

                {stocks.filter((s) => s.can_afford).length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">
                    No stocks fit your current budget. Try increasing your investment amount or reducing expenses.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stocks.map((stock, i) => (
                      <motion.div
                        key={stock.ticker}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={`bg-white rounded-xl shadow-sm border-2 p-4 ${cardBorder(stock)}`}
                      >
                        {/* Ticker + price */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-2xl font-bold text-gray-800">{stock.ticker}</p>
                            <p className="text-sm text-gray-500">
                              {formatINR(stock.price_inr)}
                              <span className="text-xs text-gray-400 ml-1">(${stock.price_usd?.toFixed(2)})</span>
                              <TrendIcon trend={stock.trend} />
                            </p>
                          </div>
                          <RiskBadge band={stock.risk_band} />
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <SentimentBadge score={stock.sentiment_score} />
                          {stock.can_afford
                            ? <span className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700">✓ Affordable</span>
                            : <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">✗ Out of range</span>
                          }
                        </div>

                        {/* Verdict */}
                        <div className="mb-2 text-sm">
                          <VerdictBadge verdict={stock.gemini_verdict} />
                        </div>

                        {/* Reason */}
                        {stock.gemini_reason && stock.gemini_verdict !== "Skipped" && (
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                            {safeReason(stock.gemini_reason)}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}
