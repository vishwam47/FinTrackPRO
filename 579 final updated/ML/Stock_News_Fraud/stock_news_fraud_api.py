"""
Stock News Fraud Detection Service
Uses yfinance for news, Gemini AI for fraud analysis,
SQLite cache for stock price context.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import yfinance as yf
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import json
import re
from dotenv import load_dotenv

from stock_data_cache import read_only_latest
import concurrent.futures

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    logger.info(f"Gemini fraud detector configured: {GEMINI_MODEL}")
else:
    model = None

app = FastAPI(
    title="Stock News Fraud Detection API",
    description="Detect fraudulent stock news using Gemini AI + yfinance",
    version="2.0.0",
)

FRAUD_PROMPT = """You are a financial fraud detection expert specializing in market manipulation.

## Stock Context
Symbol: {symbol}
Current Price: ${current_price}
Price Change Today: {price_change_pct}%

## Article to Analyze
Headline: {headline}
Summary: {summary}
Publisher: {publisher}

## Your Task
Analyze for: pump-and-dump schemes, market manipulation, misleading financial claims,
sensationalism designed to cause panic/FOMO, anonymous or unverifiable sources.

## Response Format (JSON only, no markdown fences, no extra text)
{{"verdict":"LEGITIMATE"|"SUSPICIOUS"|"LIKELY_FRAUD","fraud_score":<int 0-100>,"confidence":"LOW"|"MEDIUM"|"HIGH","red_flags":["..."],"positive_indicators":["..."],"reasoning":"...","risk_category":"CLEAN"|"MISLEADING"|"PUMP_AND_DUMP"|"PANIC_SELLING"|"UNVERIFIED_CLAIMS"}}"""


def get_stock_context(symbol: str) -> Dict[str, Any]:
    """Read latest price from SQLite cache — zero network calls."""
    try:
        row = read_only_latest(symbol)
        price = round(float(row.get("close", 0) or 0), 2)
        return {"symbol": symbol, "current_price": price, "price_change_pct": 0}
    except Exception:
        return {"symbol": symbol, "current_price": 0, "price_change_pct": 0}


def _fetch_news_with_timeout(symbol: str, limit: int = 6, timeout: int = 10) -> list:
    """Fetch yfinance news with a hard timeout — never hangs the request."""
    def _get():
        ticker = yf.Ticker(symbol)
        return getattr(ticker, "news", []) or []
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            return ex.submit(_get).result(timeout=timeout)[:limit]
    except Exception:
        return []


def analyze_article(symbol: str, headline: str, summary: str, publisher: str, ctx: Dict) -> Dict:
    if not model:
        return {
            "verdict": "SUSPICIOUS", "fraud_score": 50, "confidence": "LOW",
            "red_flags": ["Gemini not configured"], "positive_indicators": [],
            "reasoning": "Cannot analyze — GOOGLE_API_KEY missing.",
            "risk_category": "UNVERIFIED_CLAIMS",
        }
    prompt = FRAUD_PROMPT.format(
        symbol=symbol,
        current_price=ctx.get("current_price", "N/A"),
        price_change_pct=ctx.get("price_change_pct", "N/A"),
        headline=headline or "N/A",
        summary=summary or "No summary provided.",
        publisher=publisher or "Unknown",
    )
    try:
        resp = model.generate_content(prompt)
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", resp.text.strip(), flags=re.DOTALL).strip()
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "verdict": "SUSPICIOUS", "fraud_score": 50, "confidence": "LOW",
            "red_flags": ["Could not parse Gemini response"], "positive_indicators": [],
            "reasoning": "Analysis inconclusive.", "risk_category": "UNVERIFIED_CLAIMS",
        }
    except Exception as e:
        logger.error(f"Gemini fraud error: {e}")
        return {
            "verdict": "SUSPICIOUS", "fraud_score": 50, "confidence": "LOW",
            "red_flags": [str(e)], "positive_indicators": [],
            "reasoning": "Gemini error during analysis.", "risk_category": "UNVERIFIED_CLAIMS",
        }


class TextCheckRequest(BaseModel):
    symbol: str
    headline: str
    summary: Optional[str] = ""
    publisher: Optional[str] = "Unknown"


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/check/{symbol}")
async def check_symbol_news(
    symbol: str,
    max_articles: int = Query(default=6, ge=1, le=10),
):
    """Fetch recent news for a symbol and analyze each article for fraud."""
    sym = symbol.upper()

    # Price from cache — no network call
    ctx = get_stock_context(sym)

    # News with hard 10s timeout
    raw_news = _fetch_news_with_timeout(sym, limit=max_articles)
    if not raw_news:
        return {
            "symbol": sym,
            "company_name": sym,
            "results": [],
            "summary": {"legitimate": 0, "suspicious": 0, "likely_fraud": 0,
                        "average_fraud_score": 0, "overall_credibility": "LOW RISK"},
            "timestamp": datetime.now().isoformat(),
        }

    results = []
    for article in raw_news:
        # yfinance news format varies by version
        content = article.get("content", {})
        headline = (content.get("title") or article.get("title", "")).strip()
        summary_text = (content.get("summary") or article.get("summary", "")).strip()
        publisher = (
            content.get("provider", {}).get("displayName")
            or article.get("publisher", "")
            or article.get("source", "Unknown")
        )
        url = (
            content.get("canonicalUrl", {}).get("url")
            or article.get("link", "")
            or article.get("url", "")
        )

        if not headline:
            continue

        analysis = analyze_article(sym, headline, summary_text, publisher, ctx)
        results.append({
            "headline": headline,
            "publisher": publisher,
            "url": url,
            "verdict": analysis.get("verdict", "SUSPICIOUS"),
            "fraud_score": analysis.get("fraud_score", 50),
            "confidence": analysis.get("confidence", "LOW"),
            "red_flags": analysis.get("red_flags", []),
            "positive_indicators": analysis.get("positive_indicators", []),
            "reasoning": analysis.get("reasoning", ""),
            "risk_category": analysis.get("risk_category", "UNVERIFIED_CLAIMS"),
        })

    legitimate = sum(1 for r in results if r["verdict"] == "LEGITIMATE")
    suspicious = sum(1 for r in results if r["verdict"] == "SUSPICIOUS")
    likely_fraud = sum(1 for r in results if r["verdict"] == "LIKELY_FRAUD")
    avg_score = round(sum(r["fraud_score"] for r in results) / len(results), 1) if results else 0

    credibility = (
        "HIGH RISK" if likely_fraud > 0 or avg_score > 60 else
        "MODERATE RISK" if suspicious > legitimate or avg_score > 35 else
        "LOW RISK"
    )

    return {
        "symbol": sym,
        "company_name": sym,
        "results": results,
        "summary": {
            "legitimate": legitimate,
            "suspicious": suspicious,
            "likely_fraud": likely_fraud,
            "average_fraud_score": avg_score,
            "overall_credibility": credibility,
        },
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/check-text")
async def check_custom_text(request: TextCheckRequest):
    """Analyze a custom news snippet for fraud."""
    sym = request.symbol.upper()
    ctx = get_stock_context(sym)
    analysis = analyze_article(sym, request.headline, request.summary or "", request.publisher or "Unknown", ctx)
    return {"symbol": sym, **analysis, "timestamp": datetime.now().isoformat()}
