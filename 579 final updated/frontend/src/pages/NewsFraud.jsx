import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiSearch, FiAlertTriangle, FiCheckCircle, FiRefreshCw,
    FiAlertCircle, FiExternalLink, FiShield
} from "react-icons/fi";
import { BsShieldFill, BsShieldExclamation, BsShieldX } from "react-icons/bs";
import Header from "../components/Header";
import { stockNewsFraudAPI } from "../services/mlapi";

const POPULAR = ["AAPL", "TSLA", "NVDA", "AMZN", "GME", "AMC", "GOOGL", "MSFT"];

const VERDICT_CONFIG = {
    LEGITIMATE: {
        label: "Legitimate",
        emoji: "🟢",
        icon: <BsShieldFill />,
        bg: "#f0fdf4",
        border: "#86efac",
        text: "#166534",
        badgeBg: "#dcfce7",
    },
    SUSPICIOUS: {
        label: "Suspicious",
        emoji: "🟡",
        icon: <BsShieldExclamation />,
        bg: "#fffbeb",
        border: "#fde68a",
        text: "#92400e",
        badgeBg: "#fef3c7",
    },
    LIKELY_FRAUD: {
        label: "Likely Fraud",
        emoji: "🔴",
        icon: <BsShieldX />,
        bg: "#fff1f2",
        border: "#fecdd3",
        text: "#991b1b",
        badgeBg: "#fee2e2",
    },
};

const RISK_COLORS = {
    "LOW RISK": { color: "#166534", bg: "#dcfce7" },
    "MODERATE RISK": { color: "#92400e", bg: "#fef3c7" },
    "HIGH RISK": { color: "#991b1b", bg: "#fee2e2" },
};

const NewsArticleCard = ({ article, idx }) => {
    const cfg = VERDICT_CONFIG[article.verdict] || VERDICT_CONFIG.SUSPICIOUS;
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            style={{ background: "white", border: `1px solid ${cfg.border}`, borderRadius: 14, padding: 18, marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ background: cfg.badgeBg, color: cfg.text, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                            {cfg.icon} {cfg.label}
                        </span>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>Score: {article.fraud_score}/100</span>
                        {article.risk_category !== "CLEAN" && (
                            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>{article.risk_category?.replace(/_/g, " ")}</span>
                        )}
                    </div>
                    <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14, color: "#0f172a", lineHeight: 1.5 }}>
                        {article.headline}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                        {article.publisher}
                        {article.url && (
                            <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "#3b82f6", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                <FiExternalLink size={11} /> View
                            </a>
                        )}
                    </p>
                </div>
                <button onClick={() => setExpanded(!expanded)}
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {expanded ? "Less ▲" : "Details ▼"}
                </button>
            </div>

            {expanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                    <p style={{ fontSize: 13, color: "#374151", margin: "0 0 10px", lineHeight: 1.6 }}>
                        <strong>Gemini Reasoning:</strong> {article.reasoning}
                    </p>
                    {article.red_flags?.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <strong style={{ fontSize: 12, color: "#ef4444" }}>⚠️ Red Flags:</strong>
                            <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                                {article.red_flags.map((f, i) => <li key={i} style={{ fontSize: 12, color: "#374151" }}>{f}</li>)}
                            </ul>
                        </div>
                    )}
                    {article.positive_indicators?.length > 0 && (
                        <div>
                            <strong style={{ fontSize: 12, color: "#16a34a" }}>✅ Positive Indicators:</strong>
                            <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                                {article.positive_indicators.map((p, i) => <li key={i} style={{ fontSize: 12, color: "#374151" }}>{p}</li>)}
                            </ul>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};

export default function NewsFraud() {
    const [ticker, setTicker] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customText, setCustomText] = useState({ headline: "", summary: "", publisher: "" });
    const [customResult, setCustomResult] = useState(null);
    const [customLoading, setCustomLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("symbol");

    const handleSymbolCheck = async (sym) => {
        const s = (sym || ticker).trim().toUpperCase();
        if (!s) return;
        setLoading(true); setError(null); setResults(null);
        try {
            const res = await stockNewsFraudAPI.checkSymbol(s);
            setResults(res.data);
        } catch (e) {
            setError(e.response?.data?.detail || "Failed to analyze news. Make sure the ML server is running.");
        } finally { setLoading(false); }
    };

    const handleCustomCheck = async () => {
        if (!customText.headline || !ticker) return;
        setCustomLoading(true); setCustomResult(null);
        try {
            const res = await stockNewsFraudAPI.checkText({ symbol: ticker, ...customText });
            setCustomResult(res.data);
        } catch (e) {
            setError(e.response?.data?.detail || "Failed to analyze text.");
        } finally { setCustomLoading(false); }
    };

    const summary = results?.summary;
    const credColor = RISK_COLORS[summary?.overall_credibility] || RISK_COLORS["LOW RISK"];

    return (
        <>
            <Header />
            <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter,sans-serif" }}>
                <div style={{ maxWidth: 1020, margin: "0 auto", padding: "32px 16px" }}>

                    {/* Hero */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 36 }}>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            background: "linear-gradient(135deg,#fef2f2,#fff1f2)", border: "1px solid #fecdd3",
                            borderRadius: 999, padding: "5px 18px", marginBottom: 14, fontSize: 13, color: "#991b1b"
                        }}>
                            <FiShield /> AI-Powered Stock News Fraud Detector
                        </div>
                        <h1 style={{ fontSize: "clamp(1.8rem,5vw,2.8rem)", fontWeight: 800, margin: "0 0 10px", color: "#0f172a" }}>
                            News Fraud Detection
                        </h1>
                        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
                            Detect pump-and-dump schemes, misinformation, and market manipulation in stock news
                        </p>
                    </motion.div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 12, padding: 4, width: "fit-content" }}>
                        {[{ id: "symbol", label: "Scan by Symbol" }, { id: "custom", label: "Check Custom Text" }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: "8px 18px", borderRadius: 9, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .2s",
                                    background: activeTab === tab.id ? "white" : "transparent",
                                    color: activeTab === tab.id ? "#0f172a" : "#64748b",
                                    boxShadow: activeTab === tab.id ? "0 1px 4px rgba(0,0,0,.1)" : "none"
                                }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Input Card */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 1px 12px rgba(0,0,0,.07)", border: "1px solid #e2e8f0" }}>

                        {activeTab === "symbol" ? (
                            <>
                                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                                    <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && handleSymbolCheck()}
                                        placeholder="Stock ticker (e.g. TSLA)"
                                        style={{ flex: 1, minWidth: 180, padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 15, fontWeight: 600, outline: "none", letterSpacing: 1 }} />
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }} onClick={() => handleSymbolCheck()} disabled={loading || !ticker}
                                        style={{ padding: "12px 24px", background: !ticker ? "#94a3b8" : "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14, cursor: !ticker ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                                        {loading ? <FiRefreshCw style={{ animation: "spin 1s linear infinite" }} /> : <FiSearch />}
                                        {loading ? "Scanning…" : "Scan News"}
                                    </motion.button>
                                </div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>Try:</span>
                                    {POPULAR.map(t => (
                                        <button key={t} onClick={() => { setTicker(t); handleSymbolCheck(t); }}
                                            style={{ padding: "3px 11px", background: ticker === t ? "#fee2e2" : "#f1f5f9", border: `1px solid ${ticker === t ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: "pointer", color: ticker === t ? "#991b1b" : "#475569" }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Stock ticker (e.g. AAPL)"
                                    style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontWeight: 600, outline: "none", letterSpacing: 1, maxWidth: 200 }} />
                                <input value={customText.headline} onChange={e => setCustomText(p => ({ ...p, headline: e.target.value }))} placeholder="News Headline *"
                                    style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }} />
                                <textarea value={customText.summary} onChange={e => setCustomText(p => ({ ...p, summary: e.target.value }))} placeholder="Article summary (optional)" rows={3}
                                    style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical" }} />
                                <input value={customText.publisher} onChange={e => setCustomText(p => ({ ...p, publisher: e.target.value }))} placeholder="Publisher name (optional)"
                                    style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", maxWidth: 280 }} />
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }} onClick={handleCustomCheck} disabled={customLoading || !customText.headline || !ticker}
                                    style={{ padding: "12px 24px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "fit-content" }}>
                                    {customLoading ? <FiRefreshCw style={{ animation: "spin 1s linear infinite" }} /> : <FiShield />}
                                    {customLoading ? "Analyzing…" : "Check for Fraud"}
                                </motion.button>

                                {/* Custom result */}
                                {customResult && (() => {
                                    const cfg = VERDICT_CONFIG[customResult.verdict] || VERDICT_CONFIG.SUSPICIOUS;
                                    return (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: 18 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                                <span style={{ fontWeight: 700, color: cfg.text, fontSize: 15 }}>{cfg.emoji} {cfg.label}</span>
                                                <span style={{ fontSize: 12, background: cfg.badgeBg, color: cfg.text, padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>
                                                    Fraud Score: {customResult.fraud_score}/100
                                                </span>
                                            </div>
                                            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#374151" }}>{customResult.reasoning}</p>
                                            {customResult.red_flags?.length > 0 && (
                                                <div>
                                                    <strong style={{ fontSize: 12, color: "#ef4444" }}>⚠️ Red Flags:</strong>
                                                    <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                                                        {customResult.red_flags.map((f, i) => <li key={i} style={{ fontSize: 12, color: "#374151" }}>{f}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })()}
                            </div>
                        )}
                    </motion.div>

                    {/* Error */}
                    {error && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "12px 16px", color: "#991b1b", display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                            <FiAlertCircle /> {error}
                        </div>
                    )}

                    {/* Summary bar */}
                    {summary && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 24px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
                            <div>
                                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Overall Credibility</div>
                                <span style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 700, fontSize: 13, background: credColor.bg, color: credColor.color }}>
                                    {summary.overall_credibility}
                                </span>
                            </div>
                            {[
                                { label: "🟢 Legitimate", val: summary.legitimate },
                                { label: "🟡 Suspicious", val: summary.suspicious },
                                { label: "🔴 Likely Fraud", val: summary.likely_fraud },
                                { label: "Avg Fraud Score", val: `${summary.average_fraud_score}/100` },
                            ].map(item => (
                                <div key={item.label}>
                                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>{item.label}</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{item.val}</div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Results */}
                    <AnimatePresence>
                        {results?.results?.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 14px" }}>
                                    {results.results.length} Articles Analyzed for {results.symbol}
                                    {results.company_name !== results.symbol && ` — ${results.company_name}`}
                                </h3>
                                {results.results.map((article, idx) => (
                                    <NewsArticleCard key={idx} article={article} idx={idx} />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                    {!results && !loading && activeTab === "symbol" && (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                            <FiShield size={44} style={{ marginBottom: 14, opacity: .4 }} />
                            <p style={{ margin: 0 }}>Enter a stock ticker above to scan its news for fraud</p>
                        </div>
                    )}
                </div>
                <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} input::placeholder,textarea::placeholder{color:#94a3b8}`}</style>
            </div>
        </>
    );
}
