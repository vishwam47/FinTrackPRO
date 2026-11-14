import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FiTrendingUp, 
    FiTrendingDown, 
    FiMinus, 
    FiRefreshCw, 
    FiAlertTriangle, 
    FiInfo, 
    FiArrowLeft,
    FiActivity,
    FiShield,
    FiZap
} from "react-icons/fi";
import { stockSuggestionsAPI } from "../services/mlapi";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";


const riskColors = {
    LOW: { badge: "#10b981", bg: "#ecfdf5", text: "#065f46", shadow: "rgba(16, 185, 129, 0.2)" },
    MEDIUM: { badge: "#f59e0b", bg: "#fffbeb", text: "#92400e", shadow: "rgba(245, 158, 11, 0.2)" },
    HIGH: { badge: "#ef4444", bg: "#fef2f2", text: "#991b1b", shadow: "rgba(239, 68, 68, 0.2)" },
    UNKNOWN: { badge: "#6b7280", bg: "#f9fafb", text: "#374151", shadow: "rgba(107, 114, 128, 0.2)" },
};

const signalConfig = {
    RISE: { icon: <FiTrendingUp />, color: "#10b981", label: "Bullish", bg: "#d1fae5" },
    FALL: { icon: <FiTrendingDown />, color: "#ef4444", label: "Bearish", bg: "#fee2e2" },
    NEUTRAL: { icon: <FiMinus />, color: "#6b7280", label: "Neutral", bg: "#f3f4f6" },
};

const StockSignals = () => {
    const [notifications, setNotifications] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const navigate = useNavigate();

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await stockSuggestionsAPI.getSuggestions();
            const data = res.data;
            setNotifications(data.notifications || []);
            setSummary(data.summary || null);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to fetch stock suggestions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Header />
            
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Back Button & Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button 
                            onClick={() => navigate("/")}
                            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-2 text-sm font-medium"
                        >
                            <FiArrowLeft className="mr-1" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Stock Signals & <span className="text-emerald-600">Risk Analysis</span>
                        </h1>
                        <p className="text-slate-500 mt-1">Real-time technical indicators and volatility assessments</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-slate-400 uppercase font-semibold">Last Update</p>
                            <p className="text-sm font-medium text-slate-600">
                                {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={fetchSuggestions}
                            disabled={loading}
                            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                        >
                            <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </motion.button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                    >
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Total Analyzed</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total_analyzed}</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 text-xl">
                                    <FiActivity />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Bullish Signals</p>
                                    <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.rise_signals}</p>
                                </div>
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 text-xl">
                                    <FiTrendingUp />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Bearish Signals</p>
                                    <p className="text-2xl font-bold text-rose-600 mt-1">{summary.fall_signals}</p>
                                </div>
                                <div className="p-2 bg-rose-50 rounded-lg text-rose-600 text-xl">
                                    <FiTrendingDown />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">High Risk Alerts</p>
                                    <p className="text-2xl font-bold text-amber-600 mt-1">{summary.high_risk_count}</p>
                                </div>
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600 text-xl">
                                    <FiShield />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Main Content Grid */}
                {loading && !notifications.length ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                                <FiZap className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-slate-500 mt-6 font-medium animate-pulse">Analyzing market trends and calculating signals...</p>
                    </div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {notifications.map((notif, idx) => {
                                const sig = signalConfig[notif.signal] || signalConfig.NEUTRAL;
                                const risk = riskColors[notif.risk_level] || riskColors.UNKNOWN;
                                
                                return (
                                    <motion.div
                                        key={notif.symbol + idx}
                                        variants={itemVariants}
                                        layout
                                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-emerald-100 transition-all duration-300"
                                    >
                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold`} style={{ background: `${sig.color}15`, color: sig.color }}>
                                                        {notif.symbol.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900">{notif.symbol}</h3>
                                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Stock Asset</p>
                                                    </div>
                                                </div>
                                                <div 
                                                    className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border"
                                                    style={{ background: risk.bg, color: risk.text, borderColor: `${risk.badge}30`, boxShadow: `0 2px 8px ${risk.shadow}` }}
                                                >
                                                    {notif.risk_level} Risk
                                                </div>
                                            </div>

                                            {/* Price Section */}
                                            <div className="mb-6">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-black text-slate-900">${notif.current_price.toLocaleString()}</span>
                                                    <span className={`text-sm font-bold flex items-center ${notif.price_change_pct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                        {notif.price_change_pct >= 0 ? "+" : ""}{notif.price_change_pct?.toFixed(2)}%
                                                        {notif.price_change_pct >= 0 ? <FiTrendingUp className="ml-1" /> : <FiTrendingDown className="ml-1" />}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-xs mt-1">Previous Close: ${notif.prev_close?.toFixed(2)}</p>
                                            </div>

                                            {/* Indicators Grid */}
                                            <div className="grid grid-cols-3 gap-2 mb-6">
                                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">RSI</p>
                                                    <p className={`text-sm font-bold ${notif.rsi > 70 ? "text-rose-500" : notif.rsi < 30 ? "text-emerald-500" : "text-slate-700"}`}>
                                                        {notif.rsi}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Momentum</p>
                                                    <p className={`text-sm font-bold ${notif.momentum_5d > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                        {notif.momentum_5d > 0 ? "+" : ""}{notif.momentum_5d?.toFixed(1)}%
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Volatility</p>
                                                    <p className="text-sm font-bold text-slate-700">
                                                        {notif.volatility_annualised?.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Signal Footer */}
                                            <div 
                                                className="flex items-center justify-between p-4 rounded-2xl transition-colors"
                                                style={{ background: `${sig.color}08`, border: `1px solid ${sig.color}15` }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: sig.color, color: "#fff" }}>
                                                        {sig.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight">Signal</p>
                                                        <p className="text-sm font-bold" style={{ color: sig.color }}>{sig.label} Outlook</p>
                                                    </div>
                                                </div>
                                                <FiInfo className="text-slate-300" title="Based on RSI and Momentum alignment" />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && notifications.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                        <FiAlertTriangle className="mx-auto text-slate-300 text-5xl mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No signals detected</h3>
                        <p className="text-slate-500 mt-2">Market conditions might be stable or data is still being processed.</p>
                        <button 
                            onClick={fetchSuggestions}
                            className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
            
            <style sx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default StockSignals;
