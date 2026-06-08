# 📈 Algorithmic Trading FastAPI

A comprehensive, free-to-use FastAPI application for algorithmic trading with backtesting, technical analysis, and live market data integration.

## 🚀 Features

### **Market Data**
- **Yahoo Finance** - Free historical stock data (2000+ daily calls)
- **Alpha Vantage** - Professional market data (500 free daily calls)
- **Cryptocurrency** - 100+ exchanges via CCXT library

### **Technical Analysis**
- **200+ Indicators** via TA-Lib (RSI, MACD, SMA, Bollinger Bands, etc.)
- **Real-time Trading Signals** - Buy/Sell/Hold recommendations
- **Market Screener** - Filter stocks by custom criteria

### **Backtesting**
- **Backtrader Integration** - Professional backtesting framework
- **Strategy Testing** - SMA crossover and custom strategies
- **Performance Metrics** - Sharpe ratio, drawdown, returns analysis

### **Portfolio Management**
- **Portfolio Optimization** - Risk/return calculations
- **Asset Allocation** - Equal-weight and custom portfolios
- **Risk Metrics** - Volatility, correlation analysis

## 🛠️ Installation

### Prerequisites
- Python 3.8+
- pip package manager

### Setup
```bash
# Clone or download the project files
# Navigate to project directory

# Install dependencies
pip install -r requirements.txt

# Run the API
python main.py
```

### Alternative Installation
```bash
# Install individual packages
pip install fastapi uvicorn pandas numpy yfinance TA-Lib ccxt backtrader aiohttp pydantic python-multipart
```

## 🔧 Usage

### Starting the Server
```bash
python main.py
```

The API will be available at:
- **Main API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints

#### **Market Data**
```bash
# Get stock data
GET /market-data/AAPL?period=1y

# Get crypto data
GET /crypto-data/binance/BTC/USDT?timeframe=1d&limit=100
```

#### **Technical Analysis**
```bash
POST /technical-analysis
Content-Type: application/json

{
    "symbol": "AAPL",
    "period": "6mo",
    "indicators": ["SMA", "RSI", "MACD", "BBANDS"]
}
```

#### **Backtesting**
```bash
POST /backtest
Content-Type: application/json

{
    "symbol": "AAPL",
    "start_date": "2023-01-01",
    "end_date": "2024-01-01",
    "initial_cash": 100000,
    "short_period": 10,
    "long_period": 30
}
```

#### **Trading Signals**
```bash
# Get buy/sell signals
GET /trading-signals/AAPL?period=3mo
```

#### **Portfolio Optimization**
```bash
POST /portfolio-optimization
Content-Type: application/json

{
    "symbols": ["AAPL", "GOOGL", "MSFT"],
    "period": "1y",
    "risk_free_rate": 0.02
}
```

#### **Market Screener**
```bash
# Screen stocks by criteria
GET /market-screener?min_volume=1000000&min_price=5.0&max_rsi=70.0
```

## 📊 Example Responses

### Market Data Response
```json
{
    "symbol": "AAPL",
    "period": "1y",
    "data": {
        "dates": ["2023-01-01", "2023-01-02", "..."],
        "open": [130.25, 131.50, "..."],
        "high": [132.00, 133.25, "..."],
        "low": [129.50, 130.75, "..."],
        "close": [131.75, 132.50, "..."],
        "volume": [75000000, 68000000, "..."]
    },
    "summary": {
        "current_price": 182.50,
        "change": 2.30,
        "change_percent": 1.28,
        "volume": 45000000,
        "high_52w": 198.23,
        "low_52w": 124.17
    }
}
```

### Trading Signals Response
```json
{
    "symbol": "AAPL",
    "current_price": 182.50,
    "overall_signal": "BUY",
    "signals": [
        {
            "type": "SMA_Crossover",
            "signal": "BUY",
            "strength": "Medium"
        },
        {
            "type": "RSI",
            "signal": "HOLD",
            "strength": "Neutral"
        }
    ],
    "technical_data": {
        "SMA_20": 180.25,
        "SMA_50": 175.60,
        "RSI": 58.4,
        "MACD": 1.23,
        "MACD_Signal": 0.89
    }
}
```

### Backtest Results
```json
{
    "initial_value": 100000.0,
    "final_value": 125430.50,
    "total_return": 25430.50,
    "total_return_pct": 25.43,
    "max_drawdown": -8.5,
    "sharpe_ratio": 1.45,
    "total_trades": 23
}
```

## 🔑 API Keys Setup (Optional)

### Alpha Vantage (Free 500 calls/day)
1. Sign up at [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Replace `"demo"` in the code with your actual API key
3. Uncomment Alpha Vantage endpoints if needed

### Cryptocurrency Exchanges
- Most endpoints work without API keys for public data
- For private trading, add your exchange API credentials

## 📚 Available Technical Indicators

- **Trend**: SMA, EMA, MACD, ADX
- **Momentum**: RSI, Stochastic, Williams %R
- **Volatility**: Bollinger Bands, ATR
- **Volume**: OBV, Volume indicators
- **Pattern**: Candlestick patterns

## 🏗️ Architecture

```
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
└── README.md           # This file

Dependencies:
├── FastAPI              # Web framework
├── yfinance            # Yahoo Finance data
├── TA-Lib              # Technical analysis
├── Backtrader          # Backtesting engine
├── CCXT                # Crypto exchange APIs
├── Pandas/NumPy        # Data processing
└── Pydantic            # Data validation
```

## 🚀 Deployment Options

### Local Development
```bash
python main.py
```

### Production (with Gunicorn)
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker (Optional)
```dockerfile
FROM python:3.9-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY main.py .
CMD ["python", "main.py"]
```

## ⚠️ Important Notes

### Rate Limits
- **Yahoo Finance**: ~2000 requests/day
- **Alpha Vantage**: 500 requests/day (free tier)
- **CCXT**: Varies by exchange

### Data Accuracy
- This is for educational/research purposes
- Always verify data before making trading decisions
- Past performance doesn't guarantee future results

### Risk Warning
- **Trading involves substantial risk**
- **Test strategies thoroughly before live trading**
- **Never invest more than you can afford to lose**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

### Common Issues

**TA-Lib Installation Error:**
```bash
# On Windows
pip install --find-links https://github.com/cgohlke/geotiff-wheels/releases TA-Lib

# On macOS
brew install ta-lib
pip install TA-Lib

# On Ubuntu/Debian
sudo apt-get install libta-lib-dev
pip install TA-Lib
```

**ImportError:**
- Ensure all dependencies are installed
- Check Python version compatibility
- Try installing packages individually

### Getting Help
- Check the interactive docs at `/docs`
- Review error messages in API responses
- Ensure proper JSON formatting for POST requests

## 🔮 Future Enhancements

- [ ] Machine Learning integration
- [ ] Real-time WebSocket feeds
- [ ] More backtesting strategies
- [ ] Advanced portfolio optimization
- [ ] Options trading support
- [ ] Risk management tools

---

**Made with ❤️ for the algorithmic trading community**

*Remember: This tool is for educational purposes. Always do your own research and consider consulting with financial advisors before making investment decisions.*