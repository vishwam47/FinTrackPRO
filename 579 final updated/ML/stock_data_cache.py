"""
stock_data_cache.py — Shared SQLite-backed price history cache.

Strategy:
  - On first request for a symbol: download 3 months of OHLCV via yf.download()
  - On subsequent requests: only download the missing window (last_date → today)
  - All analysis reads from SQLite; Yahoo Finance is only hit for the delta
  - Database file: ML/stock_cache.db  (persists across restarts)
"""

import sqlite3
import logging
import os
from datetime import datetime, date, timedelta
from typing import List, Optional
from contextlib import contextmanager

import yfinance as yf
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "stock_cache.db")
HISTORY_MONTHS = 3          # how far back to fetch on first load
MIN_DELTA_DAYS = 1          # don't re-fetch unless at least 1 trading day has passed


# ── DB helpers ────────────────────────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    with _get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS stock_ohlcv (
                symbol      TEXT    NOT NULL,
                date        TEXT    NOT NULL,  -- ISO date YYYY-MM-DD
                open        REAL,
                high        REAL,
                low         REAL,
                close       REAL,
                volume      INTEGER,
                PRIMARY KEY (symbol, date)
            );

            CREATE TABLE IF NOT EXISTS cache_meta (
                symbol          TEXT PRIMARY KEY,
                last_updated    TEXT,           -- ISO datetime of last yf fetch
                last_market_date TEXT           -- last date row stored for symbol
            );
        """)
    logger.info(f"Stock cache DB ready: {DB_PATH}")


# ── Fetch helpers ──────────────────────────────────────────────────────────────

def _last_trading_day() -> date:
    """Return today, or Friday if today is weekend (markets closed)."""
    today = date.today()
    if today.weekday() == 5:   # Saturday → Friday
        return today - timedelta(days=1)
    if today.weekday() == 6:   # Sunday → Friday
        return today - timedelta(days=2)
    return today


def _get_last_market_date(symbol: str) -> Optional[date]:
    """Return the latest date stored in DB for this symbol, or None."""
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT last_market_date FROM cache_meta WHERE symbol = ?", (symbol,)
        ).fetchone()
    if row and row["last_market_date"]:
        return date.fromisoformat(row["last_market_date"])
    return None


def _store_dataframe(symbol: str, df: pd.DataFrame):
    """Upsert OHLCV rows into SQLite."""
    if df is None or df.empty:
        return
    rows = []
    for idx, row in df.iterrows():
        d = idx.date() if hasattr(idx, "date") else idx
        rows.append((
            symbol,
            str(d),
            float(row.get("Open", 0) or 0),
            float(row.get("High", 0) or 0),
            float(row.get("Low", 0) or 0),
            float(row.get("Close", 0) or 0),
            int(row.get("Volume", 0) or 0),
        ))
    with _get_conn() as conn:
        conn.executemany(
            """INSERT OR REPLACE INTO stock_ohlcv
               (symbol, date, open, high, low, close, volume)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            rows,
        )
        if rows:
            last_date = max(r[1] for r in rows)
            conn.execute(
                """INSERT OR REPLACE INTO cache_meta (symbol, last_updated, last_market_date)
                   VALUES (?, ?, ?)""",
                (symbol, datetime.now().isoformat(), last_date),
            )
    logger.info(f"[cache] Stored {len(rows)} rows for {symbol} (last: {last_date})")


def _fetch_and_store(symbol: str, start: date, end: date):
    """Download yfinance data for [start, end] and persist it."""
    logger.info(f"[cache] Fetching {symbol} from {start} to {end}")
    try:
        df = yf.download(
            tickers=symbol,
            start=str(start),
            end=str(end + timedelta(days=1)),   # end is exclusive in yfinance
            interval="1d",
            auto_adjust=True,
            progress=False,
            threads=False,
        )
        # Handle multi-level columns (single ticker still sometimes gives them)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        _store_dataframe(symbol, df)
    except Exception as e:
        logger.error(f"[cache] yf.download({symbol}) failed: {e}")


# ── Public API ─────────────────────────────────────────────────────────────────

def ensure_fresh(symbol: str):
    """
    Check cache for `symbol`.
    - If no data: download full HISTORY_MONTHS window.
    - If data exists but stale (newer trading days available): fetch only the delta.
    - If up-to-date: do nothing.
    """
    today = _last_trading_day()
    last = _get_last_market_date(symbol)

    if last is None:
        # First time — fetch full history
        start = today - timedelta(days=HISTORY_MONTHS * 31)
        _fetch_and_store(symbol, start, today)
    elif (today - last).days >= MIN_DELTA_DAYS:
        # Fetch only the missing window (delta update)
        _fetch_and_store(symbol, last + timedelta(days=1), today)
    else:
        logger.debug(f"[cache] {symbol} is up-to-date (last: {last})")


def ensure_fresh_batch(symbols: List[str]):
    """Warm cache for multiple symbols efficiently."""
    today = _last_trading_day()
    need_full: List[str] = []
    need_delta: List[tuple] = []   # (symbol, start_date)

    for sym in symbols:
        last = _get_last_market_date(sym)
        if last is None:
            need_full.append(sym)
        elif (today - last).days >= MIN_DELTA_DAYS:
            need_delta.append((sym, last + timedelta(days=1)))

    # Batch full-history download (single yf.download call)
    if need_full:
        start = today - timedelta(days=HISTORY_MONTHS * 31)
        logger.info(f"[cache] Full download for: {need_full}")
        try:
            df = yf.download(
                tickers=" ".join(need_full),
                start=str(start),
                end=str(today + timedelta(days=1)),
                interval="1d",
                group_by="ticker",
                auto_adjust=True,
                progress=False,
                threads=True,
            )
            for sym in need_full:
                sym_df = df[sym] if sym in df.columns.get_level_values(0) else pd.DataFrame()
                if isinstance(sym_df.columns, pd.MultiIndex):
                    sym_df.columns = sym_df.columns.droplevel(1)
                _store_dataframe(sym, sym_df.dropna())
        except Exception as e:
            logger.error(f"[cache] Batch full download failed: {e}")

    # Delta updates (individual small fetches — these cover only a few days)
    for sym, start in need_delta:
        _fetch_and_store(sym, start, today)


def get_closes(symbol: str, min_rows: int = 20) -> pd.Series:
    """
    Return Close prices as a pandas Series indexed by date.
    Calls ensure_fresh() first so data is always current.
    Use read_only_closes() if you don't want any network call.
    """
    ensure_fresh(symbol)
    return _read_closes_from_db(symbol)


def read_only_closes(symbol: str) -> pd.Series:
    """
    Return Close prices from SQLite with ZERO network calls.
    Use this in request handlers — let background tasks handle freshness.
    """
    return _read_closes_from_db(symbol)


def read_only_latest(symbol: str) -> dict:
    """Return the most recent OHLCV row from SQLite with no network call."""
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM stock_ohlcv WHERE symbol = ? ORDER BY date DESC LIMIT 1",
            (symbol,),
        ).fetchone()
    return dict(row) if row else {}


def _read_closes_from_db(symbol: str) -> pd.Series:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT date, close FROM stock_ohlcv WHERE symbol = ? ORDER BY date ASC",
            (symbol,),
        ).fetchall()
    if not rows:
        return pd.Series(dtype=float)
    dates = pd.to_datetime([r["date"] for r in rows])
    closes = [r["close"] for r in rows]
    return pd.Series(closes, index=dates, name="Close")
