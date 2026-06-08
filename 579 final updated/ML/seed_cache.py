"""
seed_cache.py — One-time script to pre-download stock data into SQLite cache.
Run this before starting the ML server to avoid any cold-start delays.

Usage:
    python seed_cache.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from stock_data_cache import init_db, ensure_fresh_batch, get_closes
from datetime import datetime

SYMBOLS = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "META", "GOOGL", "NFLX", "JPM", "V"]

if __name__ == "__main__":
    print("=" * 55)
    print("  Stock Cache Seeder")
    print(f"  DB path : {os.path.join(os.path.dirname(__file__), 'stock_cache.db')}")
    print(f"  Symbols : {', '.join(SYMBOLS)}")
    print(f"  Time    : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)

    print("\n[1/2] Initialising database...")
    init_db()
    print("      Done.")

    print(f"\n[2/2] Downloading data for {len(SYMBOLS)} symbols...")
    print("      (Only fetches missing windows — existing data is preserved)\n")
    ensure_fresh_batch(SYMBOLS)

    # Print summary
    print("\n── Summary ──────────────────────────────────────────────")
    for sym in SYMBOLS:
        closes = get_closes(sym)
        if closes.empty:
            print(f"  {sym:<6}  ❌  No data")
        else:
            first = str(closes.index[0].date())
            last  = str(closes.index[-1].date())
            price = round(float(closes.iloc[-1]), 2)
            print(f"  {sym:<6}  ✅  {len(closes):>3} rows  [{first} → {last}]  latest close: ${price}")

    print("\nCache seeding complete. You can now start the ML server.")
    print("=" * 55)
