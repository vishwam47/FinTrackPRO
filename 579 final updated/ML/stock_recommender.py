"""
Stock Recommender — personalized stock picks via finance profile + Gemini.

Trend: 30-day price momentum from SQLite cache (reuses stock_data_cache).
Sentiment score: RSI-derived, normalized to [-1, 1].
Prices: USD converted to INR via live yfinance rate (fallback 84.0).
Recommendation: Gemini verdict per stock, skipped if price_inr > 40% of budget.

Note: The original spec referenced forecast_prices() and analyze_news_sentiment()
which do not exist in importable form. The above proxies match the intended behaviour
using infrastructure already in the codebase.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import time
import numpy as np
import yfinance as yf
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
import logging
from dotenv import load_dotenv

from stock_data_cache import ensure_fresh, read_only_closes

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    _gemini = genai.GenerativeModel(GEMINI_MODEL)
    logger.info(f"[stock_recommender] Gemini configured: {GEMINI_MODEL}")
else:
    _gemini = None
    logger.warning("[stock_recommender] GOOGLE_API_KEY not found")

CANDIDATE_STOCKS = {
    "low_risk":    ["VTI", "SCHD", "BRK-B", "JNJ", "PG"],
    "medium_risk": ["AAPL", "MSFT", "GOOGL", "AMZN", "V"],
    "high_risk":   ["TSLA", "NVDA", "META", "AMD", "PLTR"],
}

app = FastAPI(
    title="Stock Recommender API",
    description="Personalized stock recommendations using finance profile + Gemini",
    version="1.1.0",
)


# ── helpers ────────────────────────────────────────────────────────────────────

def get_usd_inr() -> float:
    """Fetch live USD/INR rate; fall back to 84.0 if unavailable."""
    try:
        rate = yf.Ticker("INR=X").fast_info.last_price
        if rate and rate > 0:
            return round(float(rate), 4)
    except Exception as e:
        logger.warning(f"USD/INR fetch failed: {e}")
    return 84.0


def _rsi(prices, period: int = 14) -> float:
    if len(prices) < period + 1:
        return 50.0
    delta = prices.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, np.nan)
    rsi   = 100 - (100 / (1 + rs))
    val   = rsi.iloc[-1]
    return round(float(val) if not np.isnan(val) else 50.0, 2)


def get_stock_snapshot(ticker: str, risk_band: str, usd_inr: float) -> Dict[str, Any]:
    closes = read_only_closes(ticker)
    if closes.empty or len(closes) < 5:
        ensure_fresh(ticker)
        closes = read_only_closes(ticker)

    if closes.empty:
        return {"ticker": ticker, "price_usd": 0.0, "price_inr": 0.0,
                "trend": "flat", "sentiment_score": 0.0,
                "risk_band": risk_band, "error": "no data"}

    price_usd = round(float(closes.iloc[-1]), 2)
    price_inr = round(price_usd * usd_inr, 2)

    # 30-day momentum as trend proxy
    trend = "flat"
    if len(closes) >= 30:
        ref = float(closes.iloc[-30])
        pct = (price_usd - ref) / ref * 100 if ref else 0
        trend = "up" if pct > 1.0 else ("down" if pct < -1.0 else "flat")
    elif len(closes) >= 2:
        ref = float(closes.iloc[-2])
        pct = (price_usd - ref) / ref * 100 if ref else 0
        trend = "up" if pct > 1.0 else ("down" if pct < -1.0 else "flat")

    # RSI normalised to [-1, 1] as sentiment proxy
    sentiment_score = round((_rsi(closes) - 50) / 50, 3)

    return {"ticker": ticker, "price_usd": price_usd, "price_inr": price_inr,
            "trend": trend, "sentiment_score": sentiment_score, "risk_band": risk_band}


def build_gemini_prompt(snapshot: Dict[str, Any], profile, usd_inr: float) -> str:
    return (
        f"All monetary values are in Indian Rupees (INR). "
        f"User monthly income: ₹{profile.income}. Total expenses: ₹{profile.totalExpenses}. "
        f"Bills: ₹{profile.totalBills}. Investable surplus: ₹{profile.investableSurplus}. "
        f"Risk profile: {profile.riskLabel}. Amount user wants to invest: ₹{profile.amountToInvest}. "
        f"Stock: {snapshot['ticker']}, current price: ₹{snapshot['price_inr']} (${snapshot['price_usd']} at rate 1 USD = ₹{usd_inr}), "
        f"30-day trend: {snapshot['trend']}, "
        f"sentiment score: {snapshot['sentiment_score']} (range -1 to 1). "
        f"Should this user invest in this stock? Consider whether it fits their budget, "
        f"risk profile, and financial commitments. "
        f"Start your response with a clear 'Yes' or 'No' on the first line, then give a short reason (2-3 sentences max). "
        f"Flag if investing would strain their essential expenses."
    )


_GEMINI_ERROR = "__GEMINI_ERROR__"


def call_gemini(prompt: str) -> str:
    if not _gemini:
        return _GEMINI_ERROR
    try:
        return _gemini.generate_content(prompt).text
    except Exception as e:
        logger.warning(f"Gemini call failed: {e}")
        return _GEMINI_ERROR


def _parse_verdict(text: str) -> str:
    """Check only the first word of the first line — Gemini is instructed to lead with Yes/No."""
    first_line = text.strip().split("\n")[0].lower().strip(" .,!?:;")
    first_word = first_line.split()[0] if first_line.split() else ""
    if first_word == "yes":
        return "Yes"
    if first_word == "no":
        return "No"
    # Fallback scan of full text
    low = text.lower()
    if "not recommend" in low or "would not invest" in low or "should not invest" in low:
        return "No"
    if "recommend" in low:
        return "Yes"
    return "No"


# ── models ─────────────────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    income: float
    totalExpenses: float
    totalBills: float
    investableSurplus: float
    riskScore: int
    riskLabel: str
    amountToInvest: float


# ── endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/recommend-stocks")
async def recommend_stocks(profile: RecommendRequest):
    if not _gemini:
        raise HTTPException(
            status_code=503,
            detail="Gemini not configured — add GOOGLE_API_KEY to ML/.env",
        )

    usd_inr = get_usd_inr()
    logger.info(f"[stock_recommender] USD/INR rate: {usd_inr}")

    results = []
    gemini_call_count = 0  # track actual Gemini calls for delay spacing

    for risk_band, tickers in CANDIDATE_STOCKS.items():
        for ticker in tickers:
            snapshot = get_stock_snapshot(ticker, risk_band, usd_inr)
            can_afford = (
                "error" not in snapshot
                and snapshot["price_inr"] <= profile.amountToInvest * 0.4
            )

            if not can_afford:
                reason = snapshot.get("error", "Price exceeds 40% of your investment budget.")
                results.append({**snapshot, "can_afford": False,
                                 "gemini_verdict": "Skipped", "gemini_reason": reason,
                                 "exchange_rate": usd_inr})
                continue

            # Rate-limit guard: 6s between actual Gemini calls only
            if gemini_call_count > 0:
                time.sleep(6)

            gemini_text = call_gemini(build_gemini_prompt(snapshot, profile, usd_inr))
            gemini_call_count += 1

            if gemini_text == _GEMINI_ERROR:
                results.append({
                    **snapshot,
                    "can_afford": True,
                    "gemini_verdict": "Unavailable",
                    "gemini_reason": "Analysis unavailable — please try again shortly.",
                    "exchange_rate": usd_inr,
                })
            else:
                results.append({
                    **snapshot,
                    "can_afford": True,
                    "gemini_verdict": _parse_verdict(gemini_text),
                    "gemini_reason": gemini_text[:500],
                    "exchange_rate": usd_inr,
                })

    # sort: affordable+Yes → affordable+No/Unavailable → unaffordable/skipped
    order = {"Yes": 0, "No": 1, "Unavailable": 1, "Skipped": 2}
    results.sort(key=lambda r: (0 if r["can_afford"] else 1, order.get(r["gemini_verdict"], 2)))
    return results
