# 📈 YFinance PyFin-Sentiment Trading API

A powerful FastAPI application that provides **BUY/SELL/HOLD** trading recommendations based on real-time news sentiment analysis using the `pyfin-sentiment` library and `yfinance` data.

## 🚀 Features

- **Real-time Stock Analysis**: Get latest stock prices and news from Yahoo Finance
- **Financial Sentiment Analysis**: Uses `pyfin-sentiment` model specifically trained for financial text
- **Trading Recommendations**: Clear BUY/SELL/HOLD decisions with confidence levels
- **Batch Processing**: Analyze multiple stocks at once
- **RESTful API**: Easy integration with any application
- **Detailed Analysis**: Individual news article sentiment scoring
- **Free to Use**: No API keys required for basic functionality

## 🎯 How It Works

```
YFinance → Stock Data + News → PyFin-Sentiment → Trading Decision
    ↓            ↓                    ↓              ↓
Stock Info   Headlines           Bullish(1)      BUY/SELL/HOLD
+ Prices     + Content           Neutral(2)      + Confidence
+ News       + Publisher         Bearish(3)      + Reasoning
```

## 📦 Installation

### Prerequisites
- Python 3.8+
- pip

### Setup

1. **Clone or download the API file**
```bash
# Save the API code as 'trading_api.py'
```

2. **Install required packages**
```bash
pip install fastapi uvicorn yfinance pyfin-sentiment pandas numpy pydantic
```

3. **Run the API**
```bash
python trading_api.py
```

The API will start on `http://localhost:8000`

## 🔧 API Endpoints

### 📊 Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Welcome message with API info |
| `/analyze/{symbol}` | GET | Complete trading analysis |
| `/sentiment/{symbol}` | GET | Sentiment analysis only |
| `/news/{symbol}` | GET | Detailed news analysis |
| `/analyze-multiple` | POST | Batch analysis |
| `/health` | GET | Health check |
| `/docs` | GET | Interactive API documentation |

### 📈 Usage Examples

#### 1. Analyze Single Stock
```bash
curl http://localhost:8000/analyze/AAPL
```

**Response:**
```json
{
  "symbol": "AAPL",
  "company_name": "Apple Inc.",
  "current_price": 185.42,
  "price_change": 2.15,
  "price_change_percent": 1.17,
  "recommendation": {
    "decision": "BUY",
    "confidence_level": "High",
    "reason": "Strong bullish sentiment in 8 news articles",
    "sentiment_score": 0.375
  },
  "sentiment_analysis": {
    "sentiment_label": "bullish",
    "bullish_count": 6,
    "bearish_count": 1,
    "neutral_count": 1,
    "confidence": 0.75,
    "news_count": 8
  }
}
```

#### 2. Get Sentiment Only
```bash
curl http://localhost:8000/sentiment/TSLA
```

#### 3. Analyze Multiple Stocks
```bash
curl -X POST http://localhost:8000/analyze-multiple \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "TSLA", "GOOGL", "MSFT"]}'
```

#### 4. Get Detailed News Analysis
```bash
curl http://localhost:8000/news/NVDA
```

## 🐍 Python Usage

### Quick Start
```python
import requests

# Analyze a stock
response = requests.get("http://localhost:8000/analyze/AAPL")
data = response.json()

print(f"Recommendation: {data['recommendation']['decision']}")
print(f"Reason: {data['recommendation']['reason']}")
print(f"Confidence: {data['recommendation']['confidence_level']}")
```

### Batch Analysis
```python
import requests

stocks = ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN"]
response = requests.post(
    "http://localhost:8000/analyze-multiple",
    json={"symbols": stocks}
)

results = response.json()
for stock in results['results']:
    print(f"{stock['symbol']}: {stock['recommendation']['decision']}")
```

### Portfolio Monitoring
```python
import requests
import time

def monitor_portfolio(symbols, interval=300):  # 5 minutes
    while True:
        for symbol in symbols:
            try:
                response = requests.get(f"http://localhost:8000/analyze/{symbol}")
                data = response.json()
                
                decision = data['recommendation']['decision']
                price = data['current_price']
                sentiment = data['sentiment_analysis']['sentiment_label']
                
                print(f"🔍 {symbol}: {decision} | ${price:.2f} | {sentiment}")
                
                # Alert on strong signals
                if decision in ['STRONG BUY', 'STRONG SELL']:
                    print(f"🚨 ALERT: {symbol} - {decision}!")
                    
            except Exception as e:
                print(f"❌ Error analyzing {symbol}: {e}")
        
        print(f"⏰ Waiting {interval} seconds...")
        time.sleep(interval)

# Monitor your portfolio
portfolio = ["AAPL", "TSLA", "GOOGL", "MSFT"]
monitor_portfolio(portfolio)
```

## 🎯 Trading Decision Logic

### PyFin-Sentiment Classifications
- **Class 1**: Positive, Bullish 🟢
- **Class 2**: Neutral, Uncertain 🟡  
- **Class 3**: Negative, Bearish 🔴

### Recommendation System

| Decision | Conditions | Confidence |
|----------|------------|------------|
| **STRONG BUY** | Strong bullish sentiment + positive momentum | Very High |
| **BUY** | Strong bullish sentiment | High |
| **WEAK BUY** | Moderate bullish sentiment | Medium/Low |
| **HOLD** | Neutral or conflicting signals | Medium |
| **WEAK SELL** | Moderate bearish sentiment | Medium/Low |
| **SELL** | Strong bearish sentiment | High |
| **STRONG SELL** | Strong bearish sentiment + negative momentum | Very High |

### Factors Considered
- **Sentiment Score**: Overall bullish vs bearish ratio
- **News Volume**: Number of articles analyzed
- **Confidence**: Consensus among news articles
- **Price Momentum**: Recent price movement (5-day trend)
- **Market Context**: Current price vs previous close

## 📊 Response Format

### Complete Analysis Response
```json
{
  "symbol": "AAPL",
  "company_name": "Apple Inc.",
  "current_price": 185.42,
  "price_change": 2.15,
  "price_change_percent": 1.17,
  "sector": "Technology",
  "market_cap": 2890000000000,
  "sentiment_analysis": {
    "sentiment_label": "bullish",
    "overall_sentiment": 0.375,
    "bullish_count": 6,
    "bearish_count": 1,
    "neutral_count": 1,
    "confidence": 0.75,
    "news_count": 8
  },
  "recommendation": {
    "decision": "BUY",
    "confidence_level": "High",
    "reason": "Strong bullish sentiment in 8 news articles",
    "sentiment_score": 0.375,
    "price_momentum": 0.023,
    "factors": {
      "strong_bullish": true,
      "positive_momentum": true,
      "sufficient_news": true,
      "news_sentiment_ratio": "6B/1B/1N"
    }
  },
  "analyst_recommendation": "buy",
  "timestamp": "2025-01-17T10:30:00"
}
```

## 🔧 Configuration

### Model Selection
The API uses the "small" model by default. You can modify this in the code:

```python
# In trading_api.py
analyzer = TradingAnalyzer(model_size="small")  # or "large"
```

### Custom Thresholds
Modify decision thresholds in the `_make_trading_decision` method:

```python
# Example: Make decisions more conservative
strong_bullish = sentiment_score > 0.5 and confidence > 0.8  # More strict
```

## 🚀 Deployment

### Local Development
```bash
python trading_api.py
```

### Production Deployment
```bash
# Using Gunicorn
pip install gunicorn
gunicorn trading_api:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Using Docker
docker build -t trading-api .
docker run -p 8000:8000 trading-api
```

### Environment Variables
```bash
export HOST=0.0.0.0
export PORT=8000
export LOG_LEVEL=info
```

## 📝 Logging

The API includes comprehensive logging:

```bash
# View logs in real-time
tail -f trading_api.log

# Log levels: INFO, WARNING, ERROR
```

## ⚠️ Disclaimers

### Rate Limits
- **YFinance**: No official rate limits, but don't abuse
- **Batch Analysis**: Limited to 10 stocks per request
- **Model Loading**: First request may be slower due to model download

### Financial Disclaimer
```
⚠️  IMPORTANT DISCLAIMER ⚠️

This API is for educational and informational purposes only.
- NOT financial advice
- NOT investment recommendations  
- Past performance doesn't guarantee future results
- Always do your own research
- Consider consulting a financial advisor
- The creators are not responsible for trading losses
```
