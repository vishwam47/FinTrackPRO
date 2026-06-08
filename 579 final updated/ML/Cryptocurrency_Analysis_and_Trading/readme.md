# Cryptocurrency Analysis & Trading API

A comprehensive FastAPI microservice for real-time cryptocurrency data, technical analysis, portfolio tracking, and price alerts. Built with free APIs and designed to complement your existing financial services.

## 🎯 Features

- ✅ **Real-time Crypto Prices** - Live data for 17,000+ cryptocurrencies
- ✅ **Portfolio Tracking** - Track holdings with real-time P&L
- ✅ **Technical Analysis** - RSI, MACD, SMA, Bollinger Bands + trading signals
- ✅ **Price Alerts** - Automated notifications for price targets
- ✅ **Market Overview** - Top gainers/losers, trending coins, market stats
- ✅ **Smart Caching** - 60-second cache + rate limiting (30 calls/min)
- ✅ **Zero Cost** - Uses free CoinGecko API with Binance fallback

## 🚀 Quick Start

### Installation

```bash
# Clone and setup
cd crypto-api
pip install -r requirements.txt

# Run the API
python main.py
```

The API will be available at `http://localhost:8002`

### API Documentation
- **Swagger UI**: http://localhost:8002/docs
- **Health Check**: http://localhost:8002/health

## 📚 API Endpoints & Examples

### 🔸 Market Data

#### Get Multiple Crypto Prices
```bash
curl "http://localhost:8002/crypto/prices?symbols=bitcoin&symbols=ethereum&symbols=solana"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bitcoin": {
      "symbol": "bitcoin",
      "name": "Bitcoin",
      "current_price": 43250.50,
      "market_cap": 850000000000,
      "volume_24h": 25000000000,
      "price_change_percentage_24h": -2.5,
      "last_updated": "2024-01-15T10:30:00Z"
    },
    "ethereum": {
      "symbol": "ethereum", 
      "name": "Ethereum",
      "current_price": 2650.75,
      "market_cap": 320000000000,
      "volume_24h": 12000000000,
      "price_change_percentage_24h": 1.8,
      "last_updated": "2024-01-15T10:30:00Z"
    }
  },
  "count": 2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Single Crypto Price
```bash
curl "http://localhost:8002/crypto/price/bitcoin"
```

#### Get Price Chart with Technical Indicators
```bash
curl "http://localhost:8002/crypto/chart/bitcoin?days=30&indicators=sma&indicators=rsi&indicators=macd"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "bitcoin",
    "price_data": [
      [1705075200000, 42000, 43000, 41500, 42500, 1500000000],
      [1705161600000, 42500, 43500, 42000, 43000, 1800000000]
    ],
    "indicators": {
      "sma_20": [41800, 42100, 42400],
      "sma_50": [41000, 41200, 41500],
      "rsi": [45.2, 48.1, 52.3],
      "macd": [150, 120, 80],
      "macd_signal": [140, 125, 85]
    },
    "signals": {
      "rsi": "hold",
      "macd": "sell",
      "sma_cross": "buy"
    },
    "period_days": 30
  }
}
```

#### Get Trending Cryptocurrencies
```bash
curl "http://localhost:8002/crypto/trending"
```

#### Get Market Overview
```bash
curl "http://localhost:8002/crypto/market-overview"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "market_stats": {
      "total_market_cap": 1750000000000,
      "total_volume_24h": 85000000000,
      "cryptocurrencies_tracked": 10
    },
    "top_cryptocurrencies": [...],
    "top_gainers": [
      {
        "symbol": "solana",
        "name": "Solana", 
        "current_price": 98.45,
        "price_change_percentage_24h": 15.2
      }
    ],
    "top_losers": [...],
    "trending": [...]
  }
}
```

### 🔸 Portfolio Management

#### Get User Portfolio
```bash
curl "http://localhost:8002/crypto/portfolio/user123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user123",
    "holdings": {
      "bitcoin": 0.5,
      "ethereum": 2.0,
      "solana": 25.0
    },
    "total_value_usd": 26892.50,
    "total_change_24h": -450.25,
    "total_change_percentage_24h": -1.65,
    "created_at": "2024-01-10T08:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Add Crypto to Portfolio
```bash
curl -X POST "http://localhost:8002/crypto/portfolio/user123/add" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "bitcoin",
    "quantity": 0.25,
    "purchase_price": 42000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user123",
    "holdings": {
      "bitcoin": 0.75,
      "ethereum": 2.0,
      "solana": 25.0
    },
    "total_value_usd": 37705.00,
    "total_change_24h": -320.15,
    "total_change_percentage_24h": -0.84
  },
  "message": "Added 0.25 bitcoin to portfolio"
}
```

#### Remove Crypto from Portfolio
```bash
curl -X DELETE "http://localhost:8002/crypto/portfolio/user123/bitcoin?quantity=0.1"
```

### 🔸 Technical Analysis

#### Get Technical Analysis
```bash
curl "http://localhost:8002/crypto/analysis/bitcoin?timeframe=1d&indicators=rsi&indicators=macd&indicators=sma"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "symbol": "bitcoin",
      "timeframe": "1d",
      "indicators": {
        "rsi": [45.2, 48.1, 52.3, 49.8],
        "macd": [150, 120, 80, 95],
        "macd_signal": [140, 125, 85, 88],
        "sma_20": [42000, 42200, 42400, 42600],
        "sma_50": [41000, 41100, 41300, 41500]
      },
      "signals": {
        "rsi": "hold",
        "macd": "buy", 
        "sma_cross": "buy"
      },
      "analysis_time": "2024-01-15T10:30:00Z"
    },
    "overall_signal": "buy",
    "signal_strength": 0.67,
    "summary": {
      "buy_signals": 2,
      "sell_signals": 0,
      "hold_signals": 1
    }
  }
}
```

#### Screen Cryptocurrencies
```bash
curl "http://localhost:8002/crypto/screener?min_market_cap=1000000000&min_change=5&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "solana",
      "name": "Solana",
      "current_price": 98.45,
      "market_cap": 43000000000,
      "price_change_percentage_24h": 15.2
    },
    {
      "symbol": "avalanche-2", 
      "name": "Avalanche",
      "current_price": 35.80,
      "market_cap": 14000000000,
      "price_change_percentage_24h": 8.7
    }
  ],
  "count": 2,
  "filters_applied": {
    "min_market_cap": 1000000000,
    "min_change": 5,
    "limit": 10
  }
}
```

### 🔸 Price Alerts

#### Create Price Alert
```bash
curl -X POST "http://localhost:8002/crypto/alerts?user_id=user123&symbol=bitcoin&alert_type=price_above&target_value=45000"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alert_id": "alert_abc123",
    "user_id": "user123",
    "symbol": "bitcoin",
    "alert_type": "price_above",
    "target_value": 45000,
    "current_value": 43250.50,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Alert created for bitcoin"
}
```

#### Get User Alerts
```bash
curl "http://localhost:8002/crypto/alerts/user123"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "alert_id": "alert_abc123",
      "user_id": "user123", 
      "symbol": "bitcoin",
      "alert_type": "price_above",
      "target_value": 45000,
      "current_value": 43250.50,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "alert_id": "alert_def456",
      "user_id": "user123",
      "symbol": "ethereum", 
      "alert_type": "price_below",
      "target_value": 2500,
      "current_value": 2650.75,
      "is_active": true,
      "created_at": "2024-01-14T15:20:00Z"
    }
  ],
  "count": 2,
  "active_count": 2
}
```

#### Check Alerts (Manual Trigger)
```bash
curl -X POST "http://localhost:8002/crypto/alerts/check/user123"
```

#### Delete Alert
```bash
curl -X DELETE "http://localhost:8002/crypto/alerts/alert_abc123?user_id=user123"
```

### 🔸 Search & Utility

#### Search Cryptocurrencies
```bash
curl "http://localhost:8002/crypto/search/bit"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "bitcoin",
      "name": "Bitcoin",
      "symbol": "BTC"
    },
    {
      "id": "bitcoin-cash",
      "name": "Bitcoin Cash", 
      "symbol": "BCH"
    }
  ],
  "count": 2,
  "query": "bit"
}
```

## 📊 Supported Cryptocurrencies

**Major Cryptocurrencies:**
- Bitcoin (bitcoin)
- Ethereum (ethereum) 
- BNB (binancecoin)
- Cardano (cardano)
- Solana (solana)
- Polkadot (polkadot)
- Dogecoin (dogecoin)
- Avalanche (avalanche-2)
- Polygon (matic-network)
- Chainlink (chainlink)
- Litecoin (litecoin)
- Bitcoin Cash (bitcoin-cash)
- Stellar (stellar)
- VeChain (vechain)
- Filecoin (filecoin)

*Plus 17,000+ more through CoinGecko API*

## 🔧 Technical Indicators

**Available Indicators:**
- **SMA** - Simple Moving Average (20, 50 periods)
- **EMA** - Exponential Moving Average (12, 26 periods)
- **RSI** - Relative Strength Index (14 period)
- **MACD** - Moving Average Convergence Divergence
- **Bollinger Bands** - Upper, Middle, Lower bands
- **Stochastic** - Stochastic oscillator

**Trading Signals:**
- **Buy** - Multiple indicators suggest upward momentum
- **Sell** - Multiple indicators suggest downward momentum  
- **Hold** - Mixed or neutral signals

## 🎯 Alert Types

**Price Alerts:**
- `price_above` - Trigger when price goes above target
- `price_below` - Trigger when price goes below target
- `percent_change` - Trigger on 24h percentage change
- `technical_signal` - Trigger on indicator signals

**Example Alert Creation:**
```json
{
  "user_id": "user123",
  "symbol": "bitcoin", 
  "alert_type": "price_above",
  "target_value": 45000
}
```

## 💰 Rate Limits & Costs

**Free Tier (CoinGecko):**
- ✅ **30 calls/minute**
- ✅ **10,000 calls/month**  
- ✅ **All features included**
- ✅ **No API key required**
- ✅ **Zero cost**

**Usage Monitoring:**
The API automatically handles rate limiting and caching to maximize your free quota.

## 🔗 Integration Examples

### JavaScript/Frontend
```javascript
// Get crypto prices
async function getCryptoPrices() {
  const response = await fetch('/crypto/prices?symbols=bitcoin&symbols=ethereum');
  const data = await response.json();
  return data;
}

// Add to portfolio
async function addToPortfolio(userId, symbol, quantity) {
  const response = await fetch(`/crypto/portfolio/${userId}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, quantity })
  });
  return await response.json();
}

// Create price alert
async function createAlert(userId, symbol, alertType, targetValue) {
  const params = new URLSearchParams({
    user_id: userId,
    symbol: symbol,
    alert_type: alertType,
    target_value: targetValue
  });
  
  const response = await fetch(`/crypto/alerts?${params}`, {
    method: 'POST'
  });
  return await response.json();
}
```

### Python Client
```python
import httpx
import asyncio

class CryptoAPIClient:
    def __init__(self, base_url="http://localhost:8002"):
        self.base_url = base_url
    
    async def get_prices(self, symbols):
        params = {"symbols": symbols}
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/crypto/prices", params=params)
            return response.json()
    
    async def get_portfolio(self, user_id):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/crypto/portfolio/{user_id}")
            return response.json()
    
    async def create_alert(self, user_id, symbol, alert_type, target_value):
        params = {
            "user_id": user_id,
            "symbol": symbol, 
            "alert_type": alert_type,
            "target_value": target_value
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/crypto/alerts", params=params)
            return response.json()

# Usage
client = CryptoAPIClient()
prices = asyncio.run(client.get_prices(["bitcoin", "ethereum"]))
print(f"Bitcoin: ${prices['data']['bitcoin']['current_price']}")
```

### cURL Examples
```bash
# Get portfolio with current values
curl "http://localhost:8002/crypto/portfolio/user123"

# Set price alert for Bitcoin above $50,000
curl -X POST "http://localhost:8002/crypto/alerts?user_id=user123&symbol=bitcoin&alert_type=price_above&target_value=50000"

# Get technical analysis for Ethereum
curl "http://localhost:8002/crypto/analysis/ethereum?indicators=rsi&indicators=macd"

# Screen for high-growth cryptocurrencies
curl "http://localhost:8002/crypto/screener?min_change=10&min_volume=100000000"
```

## 🏗️ Architecture

### Microservice Design
```
Your Financial Platform:
├── Personal Finance API (Port 8000)    # Budgets, expenses, goals
├── Portfolio Risk API   (Port 8001)    # Stocks, portfolio optimization
└── Crypto Trading API   (Port 8002)    # Cryptocurrency analysis
```

### Data Flow
```
User Request → Rate Limiter → Cache Check → API Call → Technical Analysis → Response
                     ↓
               CoinGecko API (Primary)
                     ↓
               Binance API (Fallback)
```

### File Storage Structure
```
data/crypto/
├── user123/
│   ├── portfolio.json          # User's crypto holdings
│   └── alerts.json            # Price alerts
├── user456/
│   ├── portfolio.json
│   └── alerts.json
```

## 🔧 Configuration

### Environment Variables
```bash
# Optional - API runs without any environment variables
# All configuration is handled internally
```

### Rate Limiting
```python
# Automatically configured for CoinGecko free tier
RATE_LIMIT_PER_MINUTE = 30      # Calls per minute
CACHE_DURATION_SECONDS = 60     # Cache duration
```

## 🚀 Deployment

### Local Development
```bash
python main.py
# API available at http://localhost:8002
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p data/crypto

EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
```

### Production Considerations
- **Reverse Proxy**: Use Nginx for SSL and load balancing
- **Database**: Migrate from JSON files to PostgreSQL for scale
- **Monitoring**: Add logging and metrics collection
- **Caching**: Consider Redis for distributed caching
- **Alerts**: Integrate with email/SMS services for notifications

## 🛡️ Error Handling

**Standard Error Response:**
```json
{
  "success": false,
  "error": "Detailed error message",
  "status_code": 404,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `404` - Resource not found (crypto/user/alert)
- `429` - Rate limit exceeded 
- `500` - Internal server error

## 📈 Scaling Considerations

**Current Limits:**
- ✅ **Free tier**: Good for 0-1000 users
- ✅ **File storage**: Handles up to 10k users efficiently  
- ✅ **Rate limiting**: Automatic protection against API bans

**Upgrade Path:**
1. **More users**: Upgrade to CoinGecko Pro ($129/month)
2. **Database**: Migrate to PostgreSQL for better performance
3. **Caching**: Add Redis for distributed caching
4. **Horizontal scaling**: Multiple API instances behind load balancer

## 🤝 Contributing

### Development Setup
```bash
git clone <repo-url>
cd crypto-api
pip install -r requirements.txt

# Run tests (optional)
pytest

# Start development server
python main.py
```

### Code Style
- Use **type hints** for all functions
- Follow **FastAPI conventions**
- Add **comprehensive error handling**
- Include **detailed docstrings**

## 📄 License

MIT License - Use freely in personal and commercial projects.

## 🙏 Acknowledgments

- **CoinGecko** - Free cryptocurrency data API
- **Binance** - Fallback price data API  
- **pandas-ta** - Technical analysis indicators
- **FastAPI** - Modern Python web framework

---

**Built for the modern crypto trader. Trade smart, trade free! 🚀**