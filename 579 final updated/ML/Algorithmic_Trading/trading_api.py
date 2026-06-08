from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import yfinance as yf
import pandas as pd
import numpy as np

try:
    import talib
    TALIB_AVAILABLE = True
except ImportError:
    TALIB_AVAILABLE = False
    print("Warning: TA-Lib not available. Using fallback calculations.")
    
    class talib:
        @staticmethod
        def RSI(close, timeperiod=14):
            delta = pd.Series(close).diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=timeperiod).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=timeperiod).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            return rsi.values
        
        @staticmethod
        def SMA(close, timeperiod):
            return pd.Series(close).rolling(window=timeperiod).mean().values
        
        @staticmethod
        def EMA(close, timeperiod):
            return pd.Series(close).ewm(span=timeperiod, adjust=False).mean().values
        
        @staticmethod
        def BBANDS(close, timeperiod=20, nbdevup=2, nbdevdn=2, matype=0):
            sma = pd.Series(close).rolling(window=timeperiod).mean()
            std = pd.Series(close).rolling(window=timeperiod).std()
            upper = sma + (std * nbdevup)
            lower = sma - (std * nbdevdn)
            return upper.values, sma.values, lower.values
        
        @staticmethod
        def MACD(close, fastperiod=12, slowperiod=26, signalperiod=9):
            ema_fast = pd.Series(close).ewm(span=fastperiod, adjust=False).mean()
            ema_slow = pd.Series(close).ewm(span=slowperiod, adjust=False).mean()
            macd = ema_fast - ema_slow
            signal = macd.ewm(span=signalperiod, adjust=False).mean()
            histogram = macd - signal
            return macd.values, signal.values, histogram.values
        
        @staticmethod
        def STOCH(high, low, close, fastk_period=14, slowk_period=3, slowd_period=3, slowk_matype=0, slowd_matype=0):
            lowest_low = pd.Series(low).rolling(window=fastk_period).min()
            highest_high = pd.Series(high).rolling(window=fastk_period).max()
            fastk = 100 * ((pd.Series(close) - lowest_low) / (highest_high - lowest_low))
            slowk = fastk.rolling(window=slowk_period).mean()
            slowd = slowk.rolling(window=slowd_period).mean()
            return slowk.values, slowd.values

import ccxt
import backtrader as bt
from datetime import datetime, timedelta
import asyncio
import aiohttp
import json
from io import StringIO
import warnings
warnings.filterwarnings('ignore')

app = FastAPI(
    title="Algorithmic Trading API",
    description="A comprehensive API for algorithmic trading with backtesting, technical analysis, and live data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    initial_cash: float = 100000
    strategy_type: str = "sma_crossover"
    short_period: int = 10
    long_period: int = 30

class BacktestResult(BaseModel):
    initial_value: float
    final_value: float
    total_return: float
    total_return_pct: float
    max_drawdown: float
    sharpe_ratio: float
    total_trades: int

class TechnicalAnalysisRequest(BaseModel):
    symbol: str
    period: str = "1y"
    indicators: List[str] = ["SMA", "RSI", "MACD"]

class PortfolioOptimizationRequest(BaseModel):
    symbols: List[str]
    period: str = "1y"
    risk_free_rate: float = 0.02

class SMAStrategy(bt.Strategy):
    params = (
        ('short_period', 10),
        ('long_period', 30),
    )
    
    def __init__(self):
        self.short_ma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.short_period)
        self.long_ma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.long_period)
        self.crossover = bt.indicators.CrossOver(self.short_ma, self.long_ma)
        
    def next(self):
        if not self.position:
            if self.crossover > 0:
                self.buy()
        elif self.crossover < 0:
            self.sell()

async def get_alpha_vantage_data(symbol: str, function: str = "TIME_SERIES_DAILY"):
    api_key = "demo"
    url = f"https://www.alphavantage.co/query"
    params = {
        "function": function,
        "symbol": symbol,
        "apikey": api_key,
        "outputsize": "full"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as response:
            return await response.json()

def get_yfinance_data(symbol: str, period: str = "1y"):
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching data: {str(e)}")

def calculate_technical_indicators(data: pd.DataFrame, indicators: List[str]):
    results = {}
    
    if "SMA" in indicators:
        results["SMA_20"] = talib.SMA(data['Close'].values, timeperiod=20).tolist()
        results["SMA_50"] = talib.SMA(data['Close'].values, timeperiod=50).tolist()
    
    if "RSI" in indicators:
        results["RSI"] = talib.RSI(data['Close'].values, timeperiod=14).tolist()
    
    if "MACD" in indicators:
        macd, macdsignal, macdhist = talib.MACD(data['Close'].values)
        results["MACD"] = macd.tolist()
        results["MACD_Signal"] = macdsignal.tolist()
        results["MACD_Histogram"] = macdhist.tolist()
    
    if "BBANDS" in indicators:
        upper, middle, lower = talib.BBANDS(data['Close'].values)
        results["BB_Upper"] = upper.tolist()
        results["BB_Middle"] = middle.tolist()
        results["BB_Lower"] = lower.tolist()
    
    if "STOCH" in indicators:
        slowk, slowd = talib.STOCH(data['High'].values, data['Low'].values, data['Close'].values)
        results["STOCH_K"] = slowk.tolist()
        results["STOCH_D"] = slowd.tolist()
    
    return results

def run_backtest(data: pd.DataFrame, strategy_params: dict):
    cerebro = bt.Cerebro()
    
    cerebro.addstrategy(SMAStrategy, 
                       short_period=strategy_params.get('short_period', 10),
                       long_period=strategy_params.get('long_period', 30))
    
    data_bt = bt.feeds.PandasData(dataname=data)
    cerebro.adddata(data_bt)
    
    initial_cash = strategy_params.get('initial_cash', 100000)
    cerebro.broker.setcash(initial_cash)
    
    cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name="trades")
    cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name="sharpe")
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")
    cerebro.addanalyzer(bt.analyzers.Returns, _name="returns")
    
    results = cerebro.run()
    final_value = cerebro.broker.getvalue()
    
    strat = results[0]
    trades = strat.analyzers.trades.get_analysis()
    sharpe = strat.analyzers.sharpe.get_analysis()
    drawdown = strat.analyzers.drawdown.get_analysis()
    returns = strat.analyzers.returns.get_analysis()
    
    return {
        "initial_value": initial_cash,
        "final_value": final_value,
        "total_return": final_value - initial_cash,
        "total_return_pct": ((final_value - initial_cash) / initial_cash) * 100,
        "max_drawdown": drawdown.get('max', {}).get('drawdown', 0),
        "sharpe_ratio": sharpe.get('sharperatio', 0) or 0,
        "total_trades": trades.get('total', {}).get('total', 0)
    }

def calculate_portfolio_metrics(returns_data: pd.DataFrame, risk_free_rate: float = 0.02):
    returns = returns_data.pct_change().dropna()
    
    expected_returns = returns.mean() * 252
    cov_matrix = returns.cov() * 252
    
    num_assets = len(returns.columns)
    weights = np.array([1/num_assets] * num_assets)
    
    portfolio_return = np.sum(expected_returns * weights)
    portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility
    
    return {
        "expected_returns": expected_returns.to_dict(),
        "portfolio_return": portfolio_return,
        "portfolio_volatility": portfolio_volatility,
        "sharpe_ratio": sharpe_ratio,
        "weights": dict(zip(returns.columns, weights))
    }

@app.get("/")
async def root():
    return {"message": "Algorithmic Trading API", "version": "1.0.0"}

@app.get("/market-data/{symbol}")
async def get_market_data(
    symbol: str,
    period: str = Query("1y", description="Period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max")
):
    try:
        data = get_yfinance_data(symbol, period)
        
        result = {
            "symbol": symbol,
            "period": period,
            "data": {
                "dates": data.index.strftime('%Y-%m-%d').tolist(),
                "open": data['Open'].tolist(),
                "high": data['High'].tolist(),
                "low": data['Low'].tolist(),
                "close": data['Close'].tolist(),
                "volume": data['Volume'].tolist()
            },
            "summary": {
                "current_price": float(data['Close'][-1]),
                "change": float(data['Close'][-1] - data['Close'][-2]),
                "change_percent": float(((data['Close'][-1] - data['Close'][-2]) / data['Close'][-2]) * 100),
                "volume": int(data['Volume'][-1]),
                "high_52w": float(data['High'].max()),
                "low_52w": float(data['Low'].min())
            }
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/technical-analysis")
async def technical_analysis(request: TechnicalAnalysisRequest):
    try:
        data = get_yfinance_data(request.symbol, request.period)
        indicators = calculate_technical_indicators(data, request.indicators)
        
        return {
            "symbol": request.symbol,
            "period": request.period,
            "indicators": indicators,
            "dates": data.index.strftime('%Y-%m-%d').tolist(),
            "prices": data['Close'].tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/backtest")
async def backtest_strategy(request: BacktestRequest):
    try:
        start = datetime.strptime(request.start_date, "%Y-%m-%d")
        end = datetime.strptime(request.end_date, "%Y-%m-%d")
        
        ticker = yf.Ticker(request.symbol)
        data = ticker.history(start=start, end=end)
        
        if data.empty:
            raise HTTPException(status_code=400, detail="No data found for the specified period")
        
        strategy_params = {
            'initial_cash': request.initial_cash,
            'short_period': request.short_period,
            'long_period': request.long_period
        }
        
        results = run_backtest(data, strategy_params)
        
        return BacktestResult(**results)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/portfolio-optimization")
async def optimize_portfolio(request: PortfolioOptimizationRequest):
    try:
        data = pd.DataFrame()
        for symbol in request.symbols:
            ticker_data = get_yfinance_data(symbol, request.period)
            data[symbol] = ticker_data['Close']
        
        data = data.dropna()
        
        if data.empty:
            raise HTTPException(status_code=400, detail="No data found for the specified symbols")
        
        metrics = calculate_portfolio_metrics(data, request.risk_free_rate)
        
        return {
            "symbols": request.symbols,
            "period": request.period,
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/crypto-exchanges")
async def get_crypto_exchanges():
    try:
        exchanges = ccxt.exchanges
        return {
            "total_exchanges": len(exchanges),
            "exchanges": exchanges[:20]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/crypto-data/{exchange}/{symbol}")
async def get_crypto_data(
    exchange: str,
    symbol: str,
    timeframe: str = Query("1d", description="Timeframe: 1m, 5m, 15m, 1h, 4h, 1d"),
    limit: int = Query(100, description="Number of candles to fetch")
):
    try:
        if exchange not in ccxt.exchanges:
            raise HTTPException(status_code=400, detail=f"Exchange {exchange} not supported")
        
        exchange_class = getattr(ccxt, exchange)
        exchange_instance = exchange_class()
        
        ohlcv = exchange_instance.fetch_ohlcv(symbol, timeframe, limit=limit)
        
        data = []
        for candle in ohlcv:
            data.append({
                "timestamp": candle[0],
                "datetime": datetime.fromtimestamp(candle[0]/1000).isoformat(),
                "open": candle[1],
                "high": candle[2],
                "low": candle[3],
                "close": candle[4],
                "volume": candle[5]
            })
        
        return {
            "exchange": exchange,
            "symbol": symbol,
            "timeframe": timeframe,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/trading-signals/{symbol}")
async def get_trading_signals(symbol: str, period: str = "3mo"):
    try:
        data = get_yfinance_data(symbol, period)
        
        sma_20 = talib.SMA(data['Close'].values, timeperiod=20)
        sma_50 = talib.SMA(data['Close'].values, timeperiod=50)
        rsi = talib.RSI(data['Close'].values, timeperiod=14)
        macd, macd_signal, _ = talib.MACD(data['Close'].values)
        
        current_price = float(data['Close'][-1])
        current_sma_20 = float(sma_20[-1]) if not np.isnan(sma_20[-1]) else None
        current_sma_50 = float(sma_50[-1]) if not np.isnan(sma_50[-1]) else None
        current_rsi = float(rsi[-1]) if not np.isnan(rsi[-1]) else None
        current_macd = float(macd[-1]) if not np.isnan(macd[-1]) else None
        current_macd_signal = float(macd_signal[-1]) if not np.isnan(macd_signal[-1]) else None
        
        signals = []
        
        if current_sma_20 and current_sma_50:
            if current_sma_20 > current_sma_50:
                signals.append({"type": "SMA_Crossover", "signal": "BUY", "strength": "Medium"})
            else:
                signals.append({"type": "SMA_Crossover", "signal": "SELL", "strength": "Medium"})
        
        if current_rsi:
            if current_rsi < 30:
                signals.append({"type": "RSI", "signal": "BUY", "strength": "Strong"})
            elif current_rsi > 70:
                signals.append({"type": "RSI", "signal": "SELL", "strength": "Strong"})
            else:
                signals.append({"type": "RSI", "signal": "HOLD", "strength": "Neutral"})
        
        if current_macd and current_macd_signal:
            if current_macd > current_macd_signal:
                signals.append({"type": "MACD", "signal": "BUY", "strength": "Medium"})
            else:
                signals.append({"type": "MACD", "signal": "SELL", "strength": "Medium"})
        
        buy_signals = len([s for s in signals if s["signal"] == "BUY"])
        sell_signals = len([s for s in signals if s["signal"] == "SELL"])
        
        if buy_signals > sell_signals:
            overall = "BUY"
        elif sell_signals > buy_signals:
            overall = "SELL"
        else:
            overall = "HOLD"
        
        return {
            "symbol": symbol,
            "current_price": current_price,
            "overall_signal": overall,
            "signals": signals,
            "technical_data": {
                "SMA_20": current_sma_20,
                "SMA_50": current_sma_50,
                "RSI": current_rsi,
                "MACD": current_macd,
                "MACD_Signal": current_macd_signal
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/market-screener")
async def market_screener(
    min_volume: int = Query(1000000, description="Minimum daily volume"),
    min_price: float = Query(5.0, description="Minimum stock price"),
    max_rsi: float = Query(70.0, description="Maximum RSI value")
):
    try:
        symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD", "CRM"]
        screened_stocks = []
        
        for symbol in symbols:
            try:
                data = get_yfinance_data(symbol, "1mo")
                current_price = float(data['Close'][-1])
                current_volume = int(data['Volume'][-1])
                
                rsi = talib.RSI(data['Close'].values, timeperiod=14)
                current_rsi = float(rsi[-1]) if not np.isnan(rsi[-1]) else 0
                
                if (current_volume >= min_volume and 
                    current_price >= min_price and 
                    current_rsi <= max_rsi):
                    
                    screened_stocks.append({
                        "symbol": symbol,
                        "price": current_price,
                        "volume": current_volume,
                        "rsi": current_rsi,
                        "change_percent": float(((data['Close'][-1] - data['Close'][-2]) / data['Close'][-2]) * 100)
                    })
            except:
                continue
        
        return {
            "criteria": {
                "min_volume": min_volume,
                "min_price": min_price,
                "max_rsi": max_rsi
            },
            "screened_stocks": screened_stocks,
            "total_found": len(screened_stocks)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))