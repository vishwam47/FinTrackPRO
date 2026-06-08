"""
Stock Suggestion & Risk Notification Service

Request flow (always fast — reads from SQLite only):
  GET /suggestions → analyze_symbol() → read_only_closes() → SQLite

Cache refresh flow (background, never blocks requests):
  startup  → ensure_fresh_batch() once (delta only if already seeded)
  every 1h → background task calls ensure_fresh_batch() again for delta
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import asyncio
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from contextlib import asynccontextmanager
import logging

from stock_data_cache import (
    init_db, ensure_fresh_batch,
    read_only_closes, read_only_latest,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_WATCHLIST = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "META"]
REFRESH_INTERVAL_SECONDS = 3600   # refresh cache every hour in background


async def _background_refresh():
    """Periodically fetch only the delta window for each symbol."""
    while True:
        await asyncio.sleep(REFRESH_INTERVAL_SECONDS)
        logger.info("[bg-refresh] Running hourly cache delta-update...")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, ensure_fresh_batch, DEFAULT_WATCHLIST)
        logger.info("[bg-refresh] Done.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Init DB schema
    init_db()
    # 2. On startup: fetch only missing window (fast if already seeded)
    logger.info("[startup] Running delta cache update for watchlist...")
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, ensure_fresh_batch, DEFAULT_WATCHLIST)
    logger.info("[startup] Cache ready.")
    # 3. Launch hourly background refresh
    task = asyncio.create_task(_background_refresh())
    yield
    task.cancel()


app = FastAPI(
    title="Stock Suggestions & Risk API",
    description="Signals from SQLite cache — requests never hit the network",
    version="3.1.0",
    lifespan=lifespan,
)


# ── Technical indicators ───────────────────────────────────────────────────────

def calculate_rsi(prices: pd.Series, period: int = 14) -> float:
    if len(prices) < period + 1:
        return 50.0
    delta = prices.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    val = rsi.iloc[-1]
    return round(float(val) if not np.isnan(val) else 50.0, 2)


def get_signal(rsi: float, momentum: float) -> str:
    if rsi < 35 and momentum > 0:  return "RISE"
    if rsi > 65 and momentum < 0:  return "FALL"
    if rsi < 30:                    return "RISE"
    if rsi > 70:                    return "FALL"
    return "NEUTRAL"


def get_risk_level(volatility: float, rsi: float) -> str:
    if volatility > 45 or rsi > 75 or rsi < 25:  return "HIGH"
    if volatility > 25 or rsi > 65 or rsi < 35:  return "MEDIUM"
    return "LOW"


def analyze_symbol(symbol: str) -> Dict[str, Any]:
    """Pure SQLite read — zero network calls."""
    try:
        closes = read_only_closes(symbol)
        latest = read_only_latest(symbol)

        if closes.empty or len(closes) < 5:
            return {"symbol": symbol, "error": "No cached data — run seed_cache.py first"}

        current_price    = round(float(closes.iloc[-1]), 2)
        prev_close       = round(float(closes.iloc[-2]), 2)
        price_change     = round(current_price - prev_close, 2)
        price_change_pct = round((price_change / prev_close) * 100 if prev_close else 0, 2)

        rsi = calculate_rsi(closes)

        momentum_5d = 0.0
        if len(closes) >= 6:
            momentum_5d = round(
                ((float(closes.iloc[-1]) - float(closes.iloc[-6])) / float(closes.iloc[-6])) * 100, 2
            )

        volatility = 0.0
        if len(closes) >= 20:
            ret = closes.pct_change().dropna()
            volatility = round(float(ret.std() * np.sqrt(252) * 100), 2)

        return {
            "symbol": symbol,
            "signal": get_signal(rsi, momentum_5d),
            "risk_level": get_risk_level(volatility, rsi),
            "current_price": current_price,
            "prev_close": prev_close,
            "price_change": price_change,
            "price_change_pct": price_change_pct,
            "rsi": rsi,
            "momentum_5d": momentum_5d,
            "volatility_annualised": volatility,
            "last_data_date": latest.get("date", "unknown"),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.warning(f"analyze_symbol({symbol}): {e}")
        return {"symbol": symbol, "error": str(e)}


# ── Models ─────────────────────────────────────────────────────────────────────

class WatchlistRequest(BaseModel):
    symbols: Optional[List[str]] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/suggestions")
async def get_suggestions():
    """
    Return signals for the default watchlist.
    Reads purely from SQLite — responds in milliseconds.
    """
    results       = [analyze_symbol(s) for s in DEFAULT_WATCHLIST]
    notifications = [r for r in results if "error" not in r]
    errors        = [r for r in results if "error" in r]

    rise      = sum(1 for n in notifications if n["signal"] == "RISE")
    fall      = sum(1 for n in notifications if n["signal"] == "FALL")
    high_risk = sum(1 for n in notifications if n["risk_level"] == "HIGH")

    return {
        "notifications": notifications,
        "summary": {
            "total_analyzed": len(notifications),
            "rise_signals": rise,
            "fall_signals": fall,
            "neutral_signals": len(notifications) - rise - fall,
            "high_risk_count": high_risk,
        },
        "errors": errors,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/suggestions")
async def get_custom_suggestions(request: WatchlistRequest):
    """Analyze a custom symbol list from cache (max 10). New symbols get seeded on-demand in background."""
    symbols = [s.upper() for s in (request.symbols or DEFAULT_WATCHLIST)][:10]
    # Seed any new symbols in background so this response is immediate
    asyncio.create_task(
        asyncio.get_event_loop().run_in_executor(None, ensure_fresh_batch, symbols)
    )
    results       = [analyze_symbol(s) for s in symbols]
    notifications = [r for r in results if "error" not in r]
    return {
        "notifications": notifications,
        "errors": [r for r in results if "error" in r],
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/risk/{symbol}")
async def get_risk(symbol: str):
    """Detailed risk for a single symbol from cache."""
    result = analyze_symbol(symbol.upper())
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
