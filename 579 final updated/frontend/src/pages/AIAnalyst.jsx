import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCpu, FiBarChart2, FiRefreshCw, FiAlertCircle, FiZap } from "react-icons/fi";
import { BsStars } from "react-icons/bs";
import Header from "../components/Header";
import { geminiStockAPI } from "../services/mlapi";
import ReactMarkdown from "react-markdown";

const QUICK_ACTIONS = [
    { label: "Full Analysis", q: "Give me a comprehensive analysis including buy/sell recommendation, price targets, key risks, and market outlook." },
    { label: "Risk Assessment", q: "What are the main risk factors for this stock? Include volatility, sector risks, and downside scenarios." },
    { label: "Price Prediction", q: "What is the short-term (1-3 month) and long-term (1 year) price outlook?" },
    { label: "Buy or Sell?", q: "Should I buy, hold, or sell this stock right now? Give a clear recommendation." },
];

const POPULAR = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "AMZN", "META", "NFLX"];

const fmtCap = (v) => {
    if (!v) return "N/A";
    if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    return `$${v}`;
};

export default function AIAnalyst() {
    const [ticker, setTicker] = useState("");
    const [question, setQuestion] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyze = async (sym, q) => {
        const s = (sym || ticker).trim().toUpperCase();
        const query = q || question || QUICK_ACTIONS[0].q;
        if (!s) return;
        setLoading(true); setError(null); setResult(null);
        try {
            const res = await geminiStockAPI.analyze(s, query);
            setResult(res.data);
        } catch (e) {
            setError(e.response?.data?.detail || "Failed to get AI analysis.");
        } finally { setLoading(false); }
    };

    const sd = result?.stock_data;
    const statCards = sd ? [
        { label: "Price", value: `$${sd.current_price}` },
        { label: "Today", value: `${sd.price_change_pct >= 0 ? "+" : ""}${sd.price_change_pct?.toFixed(2)}%`, color: sd.price_change_pct >= 0 ? "#34d399" : "#f87171" },
        { label: "Mkt Cap", value: fmtCap(sd.market_cap) },
        { label: "P/E", value: sd.pe_ratio || "N/A" },
        { label: "Beta", value: sd.beta || "N/A" },
        { label: "52W Hi", value: `$${sd["52w_high"] || "N/A"}` },
        { label: "52W Lo", value: `$${sd["52w_low"] || "N/A"}` },
        { label: "Sector", value: sd.sector || "N/A" },
    ] : [];

    return (
        <>
            <Header />
            <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e1b4b,#0f172a)", color: "#fff", fontFamily: "Inter,sans-serif" }}>
                <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 16px" }}>

                    {/* Hero */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 36 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", borderRadius: 999, padding: "5px 16px", fontSize: 12, color: "#a5b4fc", marginBottom: 14 }}>
                            <BsStars /> Powered by Google Gemini
                        </span>
                        <h1 style={{ fontSize: "clamp(1.8rem,5vw,3rem)", fontWeight: 800, margin: "0 0 10px", background: "linear-gradient(135deg,#e0e7ff,#a5b4fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            AI Stock Analyst
                        </h1>
                        <p style={{ color: "#94a3b8", fontSize: 15, margin: 0 }}>Ask Gemini anything — powered by live market data</p>
                    </motion.div>

                    {/* Input Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
                        style={{ background: "rgba(255,255,255,.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: 28, marginBottom: 20 }}>
                        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && analyze()} placeholder="Ticker (e.g. AAPL)" maxLength={10}
                                style={{ width: 140, padding: "12px 14px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, outline: "none", letterSpacing: 2 }} />
                            <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()} placeholder="Your question (optional)"
                                style={{ flex: 1, minWidth: 200, padding: "12px 14px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, color: "#fff", fontSize: 13, outline: "none" }} />
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }} onClick={() => analyze()} disabled={loading || !ticker}
                                style={{ padding: "12px 22px", background: loading ? "#374151" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, cursor: !ticker ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                                {loading ? <FiRefreshCw style={{ animation: "spin 1s linear infinite" }} /> : <FiZap />}
                                {loading ? "Analyzing…" : "Analyze"}
                            </motion.button>
                        </div>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                            <span style={{ fontSize: 11, color: "#64748b", alignSelf: "center" }}>Popular:</span>
                            {POPULAR.map(t => (
                                <button key={t} onClick={() => { setTicker(t); analyze(t, question || QUICK_ACTIONS[0].q); }}
                                    style={{ padding: "3px 11px", background: ticker === t ? "rgba(99,102,241,.3)" : "rgba(255,255,255,.06)", border: `1px solid ${ticker === t ? "rgba(99,102,241,.5)" : "rgba(255,255,255,.1)"}`, borderRadius: 999, color: ticker === t ? "#a5b4fc" : "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, color: "#64748b", alignSelf: "center" }}>Quick:</span>
                            {QUICK_ACTIONS.map(a => (
                                <button key={a.label} onClick={() => { setQuestion(a.q); analyze(ticker, a.q); }} disabled={!ticker}
                                    style={{ padding: "5px 13px", background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)", borderRadius: 8, color: "#c7d2fe", fontSize: 12, cursor: !ticker ? "not-allowed" : "pointer", opacity: !ticker ? .5 : 1 }}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Error */}
                    {error && (
                        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 12, padding: "14px 18px", color: "#fca5a5", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                            <FiAlertCircle /> {error}
                        </div>
                    )}

                    {/* Results */}
                    <AnimatePresence>
                        {result && (
                            <motion.div key="res" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {statCards.length > 0 && (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
                                        {statCards.map(c => (
                                            <div key={c.label} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                                                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: c.color || "#fff" }}>{c.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 20, overflow: "hidden" }}>
                                    <div style={{ padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10, background: "rgba(99,102,241,.08)" }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FiCpu size={15} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e0e7ff" }}>Gemini Analysis — {result.symbol}</h3>
                                            <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{result.company_name} · {result.model_used}</p>
                                        </div>
                                    </div>
                                    <div style={{ padding: 24, lineHeight: 1.8, color: "#cbd5e1", fontSize: 14 }}>
                                        <ReactMarkdown
                                            components={{
                                                h2: ({ children }) => <h2 style={{ color: "#a5b4fc", fontSize: 15, fontWeight: 700, margin: "18px 0 8px", borderBottom: "1px solid rgba(99,102,241,.2)", paddingBottom: 5 }}>{children}</h2>,
                                                h3: ({ children }) => <h3 style={{ color: "#c7d2fe", fontSize: 13, fontWeight: 700, margin: "12px 0 5px" }}>{children}</h3>,
                                                strong: ({ children }) => <strong style={{ color: "#e2e8f0" }}>{children}</strong>,
                                                p: ({ children }) => <p style={{ margin: "7px 0", color: "#cbd5e1" }}>{children}</p>,
                                                ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: "7px 0" }}>{children}</ul>,
                                                li: ({ children }) => <li style={{ marginBottom: 3, color: "#cbd5e1" }}>{children}</li>,
                                                table: ({ children }) => <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 10 }}>{children}</table>,
                                                th: ({ children }) => <th style={{ padding: "7px 11px", background: "rgba(99,102,241,.15)", color: "#a5b4fc", textAlign: "left", fontSize: 11 }}>{children}</th>,
                                                td: ({ children }) => <td style={{ padding: "7px 11px", borderBottom: "1px solid rgba(255,255,255,.06)", fontSize: 12 }}>{children}</td>,
                                            }}
                                        >{result.analysis}</ReactMarkdown>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!result && !loading && (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                            <FiBarChart2 size={44} style={{ marginBottom: 14, opacity: .4 }} />
                            <p style={{ margin: 0 }}>Enter a stock ticker above to get a Gemini-powered analysis</p>
                        </div>
                    )}
                </div>
                <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} input::placeholder{color:#475569} input:focus{border-color:rgba(99,102,241,.5)!important}`}</style>
            </div>
        </>
    );
}
