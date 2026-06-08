"""
Gemini Stock Analysis Service
Price/history from SQLite cache (fast), company meta from yf.fast_info,
news from ticker.news (with timeout guard), analysis from Gemini.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import yfinance as yf
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import logging
from dotenv import load_dotenv
import concurrent.futures

from stock_data_cache import init_db, ensure_fresh_batch, read_only_closes, read_only_latest

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    logger.info(f"Gemini configured: {GEMINI_MODEL}")
else:
    model = None
    logger.warning("GOOGLE_API_KEY not found")

ANALYST_WATCHLIST = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "META", "GOOGL", "NFLX", "JPM", "V"]

app = FastAPI(
    title="Gemini Stock Analysis API",
    description="AI stock analysis — cache for price data, Gemini for insight",
    version="3.0.0",
)


def _fetch_fast_info(symbol: str) -> dict:
    """Use fast_info (lightweight, 1 request) instead of ticker.info (heavy, many requests)."""
    try:
        ticker = yf.Ticker(symbol)
        fi = ticker.fast_info   # Much faster than .info
        return {
            "company_name": getattr(fi, "description", symbol) or symbol,
            "market_cap": getattr(fi, "market_cap", None),
            "beta": None,
            "pe_ratio": None,
            "sector": "N/A",
        }
    except Exception:
        return {"company_name": symbol, "market_cap": None, "beta": None, "pe_ratio": None, "sector": "N/A"}


def _fetch_news_safe(symbol: str, limit: int = 5, timeout: int = 8) -> List[str]:
    """Fetch ticker news with a hard timeout so it never hangs."""
    def _get_news():
        ticker = yf.Ticker(symbol)
        news = getattr(ticker, "news", []) or []
        headlines = []
        for n in news[:limit]:
            h = n.get("content", {}).get("title") or n.get("title", "")
            if h:
                headlines.append(h)
        return headlines

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            future = ex.submit(_get_news)
            return future.result(timeout=timeout)
    except Exception:
        return []   # silently skip news if it times out


def fetch_stock_context(symbol: str) -> Dict[str, Any]:
    """
    Build Gemini context:
    - Prices / 52W range → SQLite cache (zero network)
    - Company meta      → fast_info (1 lightweight request)
    - News headlines    → ticker.news with 8s hard timeout
    """
    closes = read_only_closes(symbol)
    latest = read_only_latest(symbol)

    # Trigger async delta if cache is missing this symbol entirely
    if closes.empty:
        logger.info(f"[gemini] {symbol} not in cache, fetching now...")
        from stock_data_cache import ensure_fresh
        ensure_fresh(symbol)
        closes = read_only_closes(symbol)
        latest = read_only_latest(symbol)

    current_price = round(float(closes.iloc[-1]), 2) if not closes.empty else 0.0
    prev_close    = round(float(closes.iloc[-2]), 2) if len(closes) >= 2 else current_price
    change_pct    = round(((current_price - prev_close) / prev_close * 100) if prev_close else 0, 2)
    high_52w      = round(float(closes.max()), 2) if not closes.empty else None
    low_52w       = round(float(closes.min()), 2) if not closes.empty else None

    meta = _fetch_fast_info(symbol)
    news = _fetch_news_safe(symbol)

    return {
        "symbol": symbol,
        "company_name": meta["company_name"],
        "sector":       meta["sector"],
        "market_cap":   meta["market_cap"],
        "pe_ratio":     meta["pe_ratio"],
        "beta":         meta["beta"],
        "current_price":     current_price,
        "prev_close":        prev_close,
        "price_change_pct":  change_pct,
        "52w_high": high_52w,
        "52w_low":  low_52w,
        "recent_news":      news,
        "last_data_date":   latest.get("date", "unknown"),
        "business_summary": "",
    }


def build_prompt(ctx: Dict[str, Any], question: str) -> str:
    news_str = "\n".join(f"- {h}" for h in ctx.get("recent_news", [])) or "No recent news available."
    return f"""You are an expert financial analyst.

## {ctx.get('company_name', ctx['symbol'])} ({ctx['symbol']})

| Metric | Value |
|--------|-------|
| Price | ${ctx.get('current_price', 'N/A')} |
| Change Today | {ctx.get('price_change_pct', 'N/A')}% |
| 52W High | ${ctx.get('52w_high', 'N/A')} |
| 52W Low | ${ctx.get('52w_low', 'N/A')} |
| Market Cap | {ctx.get('market_cap', 'N/A')} |
| Last Data | {ctx.get('last_data_date', 'N/A')} |

## Recent News
{news_str}

## Question
{question}

Provide a detailed, data-driven analysis. Use clear sections.
Give a Buy/Hold/Sell recommendation with a confidence level.
"""


# ── Models ─────────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    symbol: str
    question: str = "Give me a comprehensive analysis of this stock."


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    symbol: str
    messages: List[ChatMessage] = []
    new_message: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/stock/{symbol}")
async def get_stock_data(symbol: str):
    """Return cached stock data for a symbol."""
    ctx = fetch_stock_context(symbol.upper())
    return ctx


@app.post("/analyze")
async def analyze_stock(request: AnalysisRequest):
    """Analyze a stock with Gemini using cached price data."""
    if not model:
        raise HTTPException(status_code=503, detail="Gemini not configured — add GOOGLE_API_KEY to ML/.env")
    sym = request.symbol.strip().upper()
    ctx = fetch_stock_context(sym)
    prompt = build_prompt(ctx, request.question)
    try:
        response = model.generate_content(prompt)
        return {
            "symbol": sym,
            "company_name": ctx.get("company_name", sym),
            "analysis": response.text,
            "stock_data": ctx,
            "model_used": GEMINI_MODEL,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")


@app.post("/chat")
async def chat_analyze(request: ChatRequest):
    """Multi-turn chat analysis with Gemini."""
    if not model:
        raise HTTPException(status_code=503, detail="Gemini not configured")
    sym = request.symbol.strip().upper()
    ctx = fetch_stock_context(sym)
    history = [{"role": m.role, "parts": [m.content]} for m in request.messages]
    system_ctx = f"You are a financial analyst reviewing {ctx.get('company_name', sym)} ({sym}) at ${ctx.get('current_price')}."
    chat = model.start_chat(history=history)
    try:
        response = chat.send_message(f"{system_ctx}\n\n{request.new_message}")
        return {
            "symbol": sym,
            "response": response.text,
            "stock_data": ctx,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {e}")
