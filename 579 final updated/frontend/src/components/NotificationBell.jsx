import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiX, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";
import { stockSuggestionsAPI } from "../services/mlapi";

// Dedicated instance with 90s timeout — yfinance batch downloads are slow

const POLL_INTERVAL = 120000; // poll every 2 minutes (reduce pressure on Yahoo Finance)

const riskColors = {
    LOW: { badge: "#10b981", bg: "#ecfdf5", text: "#065f46" },
    MEDIUM: { badge: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
    HIGH: { badge: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
    UNKNOWN: { badge: "#6b7280", bg: "#f9fafb", text: "#374151" },
};

const signalConfig = {
    RISE: { icon: <FiTrendingUp />, color: "#10b981", label: "Rising" },
    FALL: { icon: <FiTrendingDown />, color: "#ef4444", label: "Falling" },
    NEUTRAL: { icon: <FiMinus />, color: "#6b7280", label: "Neutral" },
};

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const panelRef = useRef(null);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await stockSuggestionsAPI.getSuggestions();
            const data = res.data;
            setNotifications(data.notifications || []);
            setSummary(data.summary || null);
            setLastUpdated(new Date());
            // Count alerts: RISE, FALL, or HIGH risk
            const alertCount = (data.notifications || []).filter(
                (n) => n.signal !== "NEUTRAL" || n.risk_level === "HIGH"
            ).length;
            setUnreadCount(alertCount);
        } catch (err) {
            console.error("Failed to fetch stock suggestions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
        const interval = setInterval(fetchSuggestions, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setUnreadCount(0);
    };

    return (
        <div style={{ position: "relative" }} ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                title="Stock Signals & Risk Alerts"
                style={{
                    position: "relative",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    color: isOpen ? "#16a34a" : "#4b5563",
                    transition: "color 0.2s",
                }}
            >
                <FiBell size={22} />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            minWidth: "16px",
                            height: "16px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            borderRadius: "9999px",
                            fontSize: "10px",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 3px",
                        }}
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                        width: "400px",
                        maxHeight: "520px",
                        overflowY: "auto",
                        background: "white",
                        borderRadius: "16px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        border: "1px solid #e5e7eb",
                    }}
                >
                    {/* Panel Header */}
                    <div
                        style={{
                            padding: "16px 20px",
                            borderBottom: "1px solid #f0f0f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
                            borderRadius: "16px 16px 0 0",
                        }}
                    >
                        <div>
                            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#111827" }}>
                                📊 Stock Signals & Risk Alerts
                            </h3>
                            {lastUpdated && (
                                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6b7280" }}>
                                    Updated: {lastUpdated.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={fetchSuggestions}
                                disabled={loading}
                                title="Refresh"
                                style={{
                                    background: "white",
                                    border: "1px solid #d1fae5",
                                    borderRadius: "8px",
                                    padding: "6px",
                                    cursor: "pointer",
                                    color: "#16a34a",
                                    display: "flex",
                                }}
                            >
                                <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    padding: "6px",
                                    cursor: "pointer",
                                    color: "#6b7280",
                                    display: "flex",
                                }}
                            >
                                <FiX size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Summary Bar */}
                    {summary && (
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                padding: "10px 20px",
                                borderBottom: "1px solid #f0f0f0",
                                fontSize: "12px",
                                fontWeight: "600",
                            }}
                        >
                            <span style={{ color: "#10b981" }}>📈 {summary.rise_signals} Rise</span>
                            <span style={{ color: "#ef4444" }}>📉 {summary.fall_signals} Fall</span>
                            <span style={{ color: "#6b7280" }}>➡️ {summary.neutral_signals} Neutral</span>
                            {summary.high_risk_count > 0 && (
                                <span style={{ color: "#ef4444" }}>🔴 {summary.high_risk_count} High Risk</span>
                            )}
                        </div>
                    )}

                    {/* Notifications List */}
                    {loading && !notifications.length ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                            <div className="animate-spin" style={{ display: "inline-block", marginBottom: "8px" }}>
                                <FiRefreshCw size={24} />
                            </div>
                            <p style={{ margin: 0, fontSize: "13px" }}>Scanning markets...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                            <FiBell size={32} style={{ marginBottom: "8px", opacity: 0.4 }} />
                            <p style={{ margin: 0, fontSize: "13px" }}>No signals available.<br />Check back soon.</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notif, idx) => {
                                const sig = signalConfig[notif.signal] || signalConfig.NEUTRAL;
                                const risk = riskColors[notif.risk_level] || riskColors.UNKNOWN;
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: "12px 20px",
                                            borderBottom: idx < notifications.length - 1 ? "1px solid #f9fafb" : "none",
                                            display: "flex",
                                            gap: "12px",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        {/* Signal indicator */}
                                        <div
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                borderRadius: "10px",
                                                background: `${sig.color}15`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: sig.color,
                                                flexShrink: 0,
                                                fontSize: "16px",
                                            }}
                                        >
                                            {sig.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>
                                                    {notif.symbol}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "10px",
                                                        fontWeight: "700",
                                                        padding: "2px 8px",
                                                        borderRadius: "9999px",
                                                        background: risk.bg,
                                                        color: risk.text,
                                                        border: `1px solid ${risk.badge}30`,
                                                    }}
                                                >
                                                    {notif.risk_level} RISK
                                                </span>
                                            </div>
                                            <p style={{ margin: "2px 0", fontSize: "12px", color: "#374151", fontWeight: "500" }}>
                                                ${notif.current_price}{" "}
                                                <span style={{ color: notif.price_change_pct >= 0 ? "#10b981" : "#ef4444" }}>
                                                    {notif.price_change_pct >= 0 ? "+" : ""}{notif.price_change_pct?.toFixed(2)}%
                                                </span>
                                            </p>
                                            <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#6b7280", lineHeight: 1.4 }}>
                                                RSI: {notif.rsi} · Momentum: {notif.momentum_5d > 0 ? "+" : ""}{notif.momentum_5d?.toFixed(1)}% · Vol: {notif.volatility_annualised?.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {/* Footer - View All */}
                    {!loading && notifications.length > 0 && (
                        <div
                            style={{
                                padding: "12px 20px",
                                borderTop: "1px solid #f0f0f0",
                                background: "#f9fafb",
                                textAlign: "center",
                                borderRadius: "0 0 16px 16px",
                            }}
                        >
                            <Link
                                to="/stock-signals"
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: "#16a34a",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    width: "100%",
                                    display: "block",
                                    textDecoration: "none",
                                    transition: "background 0.2s",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = "#15803d")}
                                onMouseOut={(e) => (e.currentTarget.style.background = "#16a34a")}
                            >
                                View Full Signal Report
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
