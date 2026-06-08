# Risk Management & Portfolio Optimization API

A comprehensive FastAPI microservice for advanced portfolio optimization, risk analysis, and performance analytics. Built with modern Python libraries and designed to work alongside your existing Personal Finance API.

## 🎯 Features

### **Portfolio Optimization**
- ✅ **Multiple Optimization Methods**: Max Sharpe, Min Volatility, Black-Litterman, Hierarchical Risk Parity
- ✅ **Efficient Frontier Calculation**: Generate optimal risk-return combinations
- ✅ **Custom Constraints**: Min/max weights, sector constraints, risk budgets
- ✅ **Real-time Market Data**: Yahoo Finance integration for live prices

### **Risk Management**
- ✅ **Comprehensive Risk Metrics**: VaR, CVaR, Sharpe, Sortino, Calmar ratios
- ✅ **Stress Testing**: Scenario analysis and Monte Carlo simulations
- ✅ **Factor Analysis**: PCA-based factor exposure and risk decomposition
- ✅ **Market Regime Detection**: ML-based regime identification

### **Performance Analytics** 
- ✅ **Benchmark Comparison**: Alpha, Beta, tracking error analysis
- ✅ **Rolling Performance**: Time-series performance metrics
- ✅ **Drawdown Analysis**: Maximum drawdown and recovery periods
- ✅ **Attribution Analysis**: Performance contribution by asset

### **Market Data & Economics**
- ✅ **Multi-Asset Support**: Stocks, ETFs, bonds, crypto via Yahoo Finance
- ✅ **Economic Indicators**: FRED API integration for risk-free rates
- ✅ **Volatility Data**: VIX and other volatility indices
- ✅ **Correlation Analysis**: Asset correlation matrices and clustering

## 🚀 Quick Start

### Installation

1. **Clone and setup**
```bash
cd portfolio-api
pip install -r requirements.txt
```

2. **Set environment variables**
```bash
export FRED_API_KEY="your-fred-api-key"  # Get free key from FRED
```

3. **Run the API**
```bash
python main.py
```

The API will be available at `http://localhost:8001`

### Quick Test

```bash
# Health check
curl http://localhost:8001/health

# Get market data
curl "http://localhost:8001/data/market/AAPL?period=1y"

# Optimize a simple portfolio
curl -X POST "http://localhost:8001/portfolio/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "assets": [
      {"symbol": "AAPL"},
      {"symbol": "MSFT"},
      {"symbol": "GOOGL"}
    ],
    "optimization_method": "max_sharpe"
  }'
```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### Core Endpoints

#### 1. Portfolio Optimization

**Optimize Portfolio:**
```http
POST /portfolio/optimize
{
  "user_id": "user123",
  "assets": [
    {"symbol": "AAPL", "weight": 0.3},
    {"symbol": "MSFT", "weight": 0.3},
    {"symbol": "GOOGL", "weight": 0.4}
  ],
  "optimization_method": "max_sharpe",
  "risk_aversion": 1.0,
  "min_weight": 0.05,
  "max_weight": 0.4,
  "lookback_period": 252
}
```

**Calculate Efficient Frontier:**
```http
POST /portfolio/efficient-frontier?user_id=user123&assets=AAPL&assets=MSFT&assets=GOOGL&num_portfolios=100
```

**Compare Portfolios:**
```http
POST /portfolio/compare?user_id=user123&portfolio_ids=port1&portfolio_ids=port2&benchmark=SPY
```

#### 2. Risk Analysis

**Comprehensive Risk Analysis:**
```http
POST /risk/analyze
{
  "user_id": "user123",
  "assets": [{"symbol": "AAPL"}, {"symbol": "MSFT"}],
  "weights": [0.6, 0.4],
  "benchmark": "SPY",
  "confidence_level": 0.95,
  "lookback_period": 252
}
```

**Stress Testing:**
```http
POST /risk/stress-test?user_id=user123&assets=AAPL&assets=MSFT&weights=0.5&weights=0.5&scenarios=[{"name":"Market Crash","AAPL":-0.2,"MSFT":-0.15}]
```

**Monte Carlo Simulation:**
```http
POST /risk/monte-carlo?user_id=user123&assets=AAPL&assets=MSFT&weights=0.5&weights=0.5&initial_value=100000&time_horizon=252&num_simulations=1000
```

#### 3. Market Data

**Asset Market Data:**
```http
GET /data/market/AAPL?period=1y&interval=1d
```

**Risk-Free Rate:**
```http
GET /data/risk-free-rate
```

**VIX Volatility Data:**
```http
GET /data/vix?period=1y
```

#### 4. Analytics

**Performance Analysis:**
```http
POST /analytics/performance?user_id=user123&assets=AAPL&assets=MSFT&weights=0.5&weights=0.5&benchmark=SPY&start_date=2023-01-01&end_date=2024-01-01
```

**Correlation Matrix:**
```http
GET /analytics/correlation-matrix?assets=AAPL&assets=MSFT&assets=GOOGL&period=1y&method=pearson
```

**Factor Analysis:**
```http
GET /analytics/factor-analysis?assets=AAPL&assets=MSFT&assets=GOOGL&period=2y&n_factors=3
```

**Market Regime Detection:**
```http
POST /analytics/regime-detection?assets=AAPL&assets=MSFT&period=5y&n_regimes=3
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FRED_API_KEY` | Your FRED API key for economic data | `your-fred-api-key` | Recommended |
| `DATA_DIR` | Directory for storing portfolio data | `data/portfolio` | No |
| `RISK_FREE_RATE` | Default risk-free rate if FRED unavailable | `0.02` | No |

### Get FRED API Key
1. Visit [FRED API](https://fred.stlouisfed.org/docs/api/fred/)
2. Create free account
3. Generate API key
4. Set `FRED_API_KEY` environment variable

## 📊 Portfolio Optimization Methods

### 1. **Maximum Sharpe Ratio**
- **Use Case**: Best risk-adjusted returns
- **Method**: `max_sharpe`
- **Output**: Portfolio with highest Sharpe ratio

### 2. **Minimum Volatility**
- **Use Case**: Conservative risk management
- **Method**: `min_volatility`
- **Output**: Lowest risk portfolio

### 3. **Black-Litterman**
- **Use Case**: Incorporating market views
- **Method**: `black_litterman`
- **Output**: Bayesian optimized portfolio

### 4. **Hierarchical Risk Parity (HRP)**
- **Use Case**: Diversification without correlation assumptions
- **Method**: `hrp`
- **Output**: Risk-balanced portfolio using clustering

### 5. **Risk Parity**
- **Use Case**: Equal risk contribution
- **Method**: `risk_parity`  
- **Output**: Equal risk-weighted portfolio

### 6. **Efficient Risk/Return**
- **Use Case**: Target specific risk or return
- **Method**: `efficient_risk` / `efficient_return`
- **Output**: Portfolio meeting target constraints

## 💡 Usage Examples

### Python Client Integration

```python
import httpx
import asyncio

class PortfolioAPIClient:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
    
    async def optimize_portfolio(self, user_id, assets, method="max_sharpe"):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/portfolio/optimize",
                json={
                    "user_id": user_id,
                    "assets": [{"symbol": symbol} for symbol in assets],
                    "optimization_method": method
                }
            )
            return response.json()
    
    async def get_risk_analysis(self, user_id, assets, weights):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/risk/analyze",
                json={
                    "user_id": user_id,
                    "assets": [{"symbol": symbol} for symbol in assets],
                    "weights": weights
                }
            )
            return response.json()

# Usage
client = PortfolioAPIClient()

# Optimize portfolio
result = asyncio.run(client.optimize_portfolio(
    "user123", 
    ["AAPL", "MSFT", "GOOGL", "AMZN"]
))

print(f"Optimized weights: {result['optimized_weights']}")
print(f"Expected return: {result['expected_return']:.2%}")
print(f"Sharpe ratio: {result['sharpe_ratio']:.2f}")
```

### JavaScript/Frontend Integration

```javascript
// Portfolio optimization
async function optimizePortfolio(userId, assets) {
  const response = await fetch('/portfolio/optimize', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      user_id: userId,
      assets: assets.map(symbol => ({symbol})),
      optimization_method: 'max_sharpe'
    })
  });
  
  return await response.json();
}

// Get efficient frontier
async function getEfficientFrontier(userId, assets) {
  const params = new URLSearchParams({
    user_id: userId,
    num_portfolios: 100,
    ...assets.reduce((acc, asset, i) => {
      acc[`assets`] = asset;
      return acc;
    }, {})
  });
  
  const response = await fetch(`/portfolio/efficient-frontier?${params}`, {
    method: 'POST'
  });
  
  return await response.json();
}

// Usage
const portfolio = await optimizePortfolio('user123', ['AAPL', 'MSFT', 'GOOGL']);
const frontier = await getEfficientFrontier('user123', ['AAPL', 'MSFT', 'GOOGL']);
```

## 🔍 Risk Metrics Explained

### **Value at Risk (VaR)**
- **95% VaR**: Expected maximum loss over 1 day with 95% confidence
- **99% VaR**: Expected maximum loss over 1 day with 99% confidence
- **Historical VaR**: Based on historical return distribution
- **Gaussian VaR**: Assumes normal distribution of returns

### **Conditional Value at Risk (CVaR)**
- **Expected Shortfall**: Average loss when VaR threshold is exceeded
- **More conservative**: Accounts for tail risk beyond VaR
- **Coherent Risk Measure**: Satisfies mathematical consistency properties

### **Risk-Adjusted Returns**
- **Sharpe Ratio**: (Return - Risk-free) / Volatility
- **Sortino Ratio**: (Return - Risk-free) / Downside Deviation
- **Calmar Ratio**: Annual Return / Maximum Drawdown
- **Omega Ratio**: Probability-weighted gains vs losses

### **Benchmark Metrics**
- **Alpha**: Risk-adjusted excess return vs benchmark
- **Beta**: Systematic risk relative to benchmark
- **Tracking Error**: Standard deviation of excess returns
- **Information Ratio**: Alpha / Tracking Error

## 🏗️ Architecture & Integration

### **Microservice Design**
```
Personal Finance API (Port 8000)
    ├── Transaction Processing
    ├── Budget Analysis  
    ├── Savings Goals
    └── Financial Insights

Portfolio Risk API (Port 8001)  
    ├── Portfolio Optimization
    ├── Risk Management
    ├── Performance Analytics
    └── Market Data
```

### **Data Flow**
1. **User requests portfolio optimization** via main Finance API
2. **Finance API calls Portfolio API** with user assets
3. **Portfolio API fetches market data** from Yahoo Finance/FRED
4. **Optimization engine processes** using PyPortfolioOpt/QuantLib
5. **Results stored** in user portfolio files
6. **Response returned** with optimized weights and metrics

### **Integration Patterns**

#### **Service-to-Service Communication:**
```python
# In main Finance API
import httpx

async def optimize_user_portfolio(user_id, assets):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8001/portfolio/optimize",
            json={
                "user_id": user_id,
                "assets": [{"symbol": asset} for asset in assets],
                "optimization_method": "max_sharpe"
            }
        )
        return response.json()
```

#### **Shared Data Storage:**
```
data/
├── users/           # Finance API user data
│   ├── user_123/
│   │   ├── transactions.json
│   │   ├── goals.json
│   │   └── insights.json
└── portfolio/       # Portfolio API data
    ├── user_123/
    │   ├── portfolio_abc123.json
    │   ├── risk_analysis_xyz456.json
    │   └── backtest_def789.json
```

## 📈 Performance & Scalability

### **Optimization Performance**
- **Small portfolios** (2-10 assets): ~100ms
- **Medium portfolios** (10-50 assets): ~500ms  
- **Large portfolios** (50+ assets): ~2-5s
- **Efficient frontier** (100 points): ~3-10s

### **Data Caching Strategy**
```python
# Market data caching (implement as needed)
import redis
from datetime import timedelta

redis_client = redis.Redis(host='localhost', port=6379, db=0)

async def get_cached_market_data(symbols, period):
    cache_key = f"market_data:{':'.join(symbols)}:{period}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # Fetch fresh data
    data = await fetch_market_data(symbols, period)
    
    # Cache for 1 hour
    redis_client.setex(cache_key, timedelta(hours=1), json.dumps(data))
    return data
```

### **Scaling Considerations**
- **Horizontal scaling**: Multiple API instances behind load balancer
- **Database upgrade**: Move from JSON files to PostgreSQL/MongoDB
- **Async processing**: Background tasks for expensive computations
- **Rate limiting**: Prevent abuse of Yahoo Finance API

## 🔒 Security & Production

### **API Security**
```python
# Add API key authentication (example)
from fastapi.security import HTTPBearer
from fastapi import Depends, HTTPException

security = HTTPBearer()

async def verify_api_key(token: str = Depends(security)):
    if token.credentials != "your-secret-api-key":
        raise HTTPException(status_code=401, detail="Invalid API key")
    return token.credentials

# Protect endpoints
@app.post("/portfolio/optimize")
async def optimize_portfolio(
    request: PortfolioOptimizationRequest,
    _: str = Depends(verify_api_key)
):
    # ... implementation
```

### **Input Validation**
- ✅ **Pydantic models** for request validation
- ✅ **Weight constraints** (sum to 1.0, non-negative)
- ✅ **Asset validation** (valid tickers)
- ✅ **Date range validation**
- ✅ **Parameter bounds** (confidence levels, etc.)

### **Error Handling**
- ✅ **Graceful market data failures**
- ✅ **Optimization convergence issues**
- ✅ **Invalid user inputs**
- ✅ **External API timeouts**

### **Production Deployment**

#### **Docker Configuration:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create data directory
RUN mkdir -p data/portfolio

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### **Docker Compose with Main API:**
```yaml
version: '3.8'

services:
  finance-api:
    build: ./finance-api
    ports:
      - "8000:8000"
    environment:
      - FINA_API_KEY=${FINA_API_KEY}
    volumes:
      - ./data:/app/data
    depends_on:
      - portfolio-api

  portfolio-api:
    build: ./portfolio-api
    ports:
      - "8001:8001"
    environment:
      - FRED_API_KEY=${FRED_API_KEY}
    volumes:
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## 🧪 Testing

### **Unit Tests**
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_portfolio_optimization():
    request_data = {
        "user_id": "test_user",
        "assets": [
            {"symbol": "AAPL"},
            {"symbol": "MSFT"}
        ],
        "optimization_method": "max_sharpe"
    }
    
    response = client.post("/portfolio/optimize", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "optimized_weights" in data
    assert "sharpe_ratio" in data
    assert len(data["optimized_weights"]) == 2

def test_market_data():
    response = client.get("/data/market/AAPL?period=1mo")
    assert response.status_code == 200
    
    data = response.json()
    assert data["symbol"] == "AAPL"
    assert "price_data" in data
    assert "metrics" in data

def test_risk_analysis():
    request_data = {
        "user_id": "test_user", 
        "assets": [{"symbol": "AAPL"}, {"symbol": "MSFT"}],
        "weights": [0.6, 0.4],
        "benchmark": "SPY"
    }
    
    response = client.post("/risk/analyze", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "risk_metrics" in data
    assert "portfolio_metrics" in data
```

### **Integration Tests**
```python
@pytest.mark.asyncio
async def test_optimization_pipeline():
    """Test complete optimization pipeline"""
    
    # 1. Test data fetching
    symbols = ["AAPL", "MSFT", "GOOGL"]
    optimizer = PortfolioOptimizer()
    
    prices = await optimizer.get_market_data(symbols, 100)
    assert len(prices) > 50
    assert len(prices.columns) == 3
    
    # 2. Test optimization
    request = PortfolioOptimizationRequest(
        user_id="test_user",
        assets=[AssetInput(symbol=s) for s in symbols],
        optimization_method=OptimizationMethod.MAX_SHARPE
    )
    
    result = await optimizer.optimize_portfolio(request)
    assert abs(sum(result.optimized_weights.values()) - 1.0) < 0.01
    assert result.sharpe_ratio > 0

@pytest.mark.asyncio 
async def test_risk_analysis_pipeline():
    """Test complete risk analysis pipeline"""
    
    analyzer = RiskAnalyzer()
    request = RiskAnalysisRequest(
        user_id="test_user",
        assets=[AssetInput(symbol="AAPL"), AssetInput(symbol="MSFT")],
        weights=[0.6, 0.4]
    )
    
    result = await analyzer.analyze_portfolio_risk(request)
    assert "sharpe_ratio" in result.risk_metrics
    assert "max_drawdown" in result.risk_metrics
    assert len(result.recommendations) > 0
```

### **Performance Tests**
```python
import time
import asyncio

async def test_optimization_performance():
    """Test optimization performance"""
    
    symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
    request = PortfolioOptimizationRequest(
        user_id="perf_test",
        assets=[AssetInput(symbol=s) for s in symbols],
        optimization_method=OptimizationMethod.MAX_SHARPE
    )
    
    start_time = time.time()
    result = await portfolio_optimizer.optimize_portfolio(request)
    end_time = time.time()
    
    assert end_time - start_time < 5.0  # Should complete in under 5 seconds
    assert result.sharpe_ratio > 0

async def test_concurrent_requests():
    """Test handling concurrent requests"""
    
    async def single_request():
        return await portfolio_optimizer.optimize_portfolio(request)
    
    # Run 10 concurrent optimizations
    tasks = [single_request() for _ in range(10)]
    results = await asyncio.gather(*tasks)
    
    assert len(results) == 10
    assert all(r.sharpe_ratio > 0 for r in results)
```

## 🔍 Monitoring & Observability

### **Health Checks**
```python
@app.get("/health/detailed")
async def detailed_health_check():
    """Comprehensive health check"""
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {},
        "performance": {}
    }
    
    # Test Yahoo Finance
    try:
        test_data = yf.download("AAPL", period="5d", progress=False)
        health_status["services"]["yahoo_finance"] = {
            "status": "available",
            "data_points": len(test_data)
        }
    except Exception as e:
        health_status["services"]["yahoo_finance"] = {
            "status": "unavailable",
            "error": str(e)
        }
    
    # Test FRED API
    if FRED_AVAILABLE:
        try:
            rate = fred.get_series('TB3MS', limit=1)
            health_status["services"]["fred_api"] = {
                "status": "available",
                "latest_rate": float(rate.iloc[-1]) if not rate.empty else None
            }
        except Exception as e:
            health_status["services"]["fred_api"] = {
                "status": "available_with_errors",
                "error": str(e)
            }
    else:
        health_status["services"]["fred_api"] = {
            "status": "not_configured"
        }
    
    # Test optimization performance
    try:
        start_time = time.time()
        # Quick optimization test
        symbols = ["AAPL", "MSFT"]
        prices = await portfolio_optimizer.get_market_data(symbols, 30)
        mu = portfolio_optimizer.calculate_expected_returns(prices)
        S = portfolio_optimizer.calculate_risk_model(prices)
        ef = EfficientFrontier(mu, S)
        weights = ef.max_sharpe()
        
        health_status["performance"]["optimization_time_ms"] = int((time.time() - start_time) * 1000)
        health_status["performance"]["optimization_status"] = "healthy"
    except Exception as e:
        health_status["performance"]["optimization_status"] = "error"
        health_status["performance"]["error"] = str(e)
    
    return health_status
```

### **Metrics Collection**
```python
from prometheus_client import Counter, Histogram, generate_latest
import time

# Metrics
optimization_requests = Counter('optimization_requests_total', 'Total optimization requests', ['method', 'status'])
optimization_duration = Histogram('optimization_duration_seconds', 'Time spent on optimization', ['method'])
market_data_requests = Counter('market_data_requests_total', 'Total market data requests', ['symbol'])

@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    # Record metrics
    duration = time.time() - start_time
    
    if request.url.path.startswith("/portfolio/optimize"):
        optimization_duration.observe(duration)
        optimization_requests.labels(method="unknown", status=response.status_code).inc()
    
    return response

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type="text/plain")
```

## 📊 Example Outputs

### **Portfolio Optimization Result**
```json
{
  "user_id": "user123",
  "portfolio_id": "portfolio_abc123",
  "assets": [
    {"symbol": "AAPL", "weight": null},
    {"symbol": "MSFT", "weight": null},
    {"symbol": "GOOGL", "weight": null}
  ],
  "optimized_weights": {
    "AAPL": 0.35,
    "MSFT": 0.40,
    "GOOGL": 0.25
  },
  "optimization_method": "max_sharpe",
  "expected_return": 0.12,
  "expected_volatility": 0.18,
  "sharpe_ratio": 0.67,
  "risk_metrics": {
    "sharpe_ratio": 0.67,
    "sortino_ratio": 0.89,
    "max_drawdown": 0.15,
    "volatility": 0.18,
    "value_at_risk_95": 0.028,
    "conditional_var_95": 0.042
  },
  "performance_stats": {
    "total_return": 0.85,
    "annual_return": 0.12,
    "best_month": 0.08,
    "worst_month": -0.12,
    "positive_months": 18,
    "negative_months": 6
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **Risk Analysis Result**
```json
{
  "user_id": "user123",
  "analysis_id": "risk_xyz456",
  "portfolio_metrics": {
    "expected_annual_return": 0.11,
    "annual_volatility": 0.19,
    "effective_number_of_assets": 2.8,
    "concentration_ratio": 0.40,
    "weight_entropy": 1.58
  },
  "risk_metrics": {
    "max_drawdown": 0.18,
    "sharpe_ratio": 0.58,
    "sortino_ratio": 0.76,
    "var_95": 0.031,
    "cvar_95": 0.048,
    "downside_risk": 0.14,
    "skewness": -0.25,
    "kurtosis": 3.2
  },
  "var_analysis": {
    "var_90": 0.021,
    "var_95": 0.031,
    "var_99": 0.052,
    "cvar_90": 0.035,
    "cvar_95": 0.048,
    "cvar_99": 0.067
  },
  "benchmark_comparison": {
    "alpha": 0.02,
    "beta": 0.95,
    "correlation": 0.87,
    "tracking_error": 0.08,
    "information_ratio": 0.25
  },
  "recommendations": [
    "✅ Good risk-adjusted returns with Sharpe ratio above 0.5",
    "📊 Consider reducing concentration in top holding",
    "💪 Strong downside protection with good Sortino ratio",
    "🎯 Low tracking error suggests good benchmark alignment"
  ]
}
```

### **Efficient Frontier Data**
```json
{
  "user_id": "user123",
  "assets": ["AAPL", "MSFT", "GOOGL"],
  "efficient_frontier": [
    {
      "expected_return": 0.08,
      "volatility": 0.12,
      "sharpe_ratio": 0.50,
      "weights": {"AAPL": 0.2, "MSFT": 0.6, "GOOGL": 0.2}
    },
    {
      "expected_return": 0.10,
      "volatility": 0.15,
      "sharpe_ratio": 0.53,
      "weights": {"AAPL": 0.3, "MSFT": 0.5, "GOOGL": 0.2}
    }
  ],
  "special_portfolios": {
    "max_sharpe": {
      "expected_return": 0.12,
      "volatility": 0.18,
      "sharpe_ratio": 0.67,
      "weights": {"AAPL": 0.35, "MSFT": 0.40, "GOOGL": 0.25}
    },
    "min_volatility": {
      "expected_return": 0.07,
      "volatility": 0.11,
      "sharpe_ratio": 0.45,
      "weights": {"AAPL": 0.15, "MSFT": 0.70, "GOOGL": 0.15}
    }
  },
  "risk_free_rate": 0.02
}
```

## 🚀 Future Enhancements

### **Planned Features**
- [ ] **Real-time Portfolio Monitoring** - Live P&L tracking
- [ ] **Options Integration** - Options strategies and Greeks
- [ ] **ESG Scoring** - Environmental, Social, Governance factors
- [ ] **Alternative Assets** - REITs, commodities, crypto DeFi
- [ ] **Tax Optimization** - Tax-loss harvesting strategies
- [ ] **Robo-advisor Logic** - Automated rebalancing
- [ ] **Machine Learning Models** - Return prediction, regime detection
- [ ] **Multi-factor Models** - Fama-French, custom factors

### **Technical Improvements**
- [ ] **GraphQL API** - More flexible data querying
- [ ] **WebSocket Streaming** - Real-time price updates
- [ ] **Distributed Computing** - Celery/Redis for heavy computations
- [ ] **Advanced Caching** - Multi-level caching strategy
- [ ] **Database Migration** - PostgreSQL for production
- [ ] **Kubernetes Deployment** - Container orchestration
- [ ] **API Rate Limiting** - Prevent abuse and manage costs

### **Integration Opportunities**
- [ ] **Broker APIs** - Live trading integration (Alpaca, Interactive Brokers)
- [ ] **News Sentiment** - News impact on portfolio decisions
- [ ] **Economic Calendar** - Event-driven rebalancing
- [ ] **Social Trading** - Copy successful strategies
- [ ] **Portfolio Insurance** - Downside protection strategies

## 🤝 Contributing

### **Development Setup**
```bash
# Clone repo
git clone <your-repo>
cd portfolio-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install pytest pytest-asyncio black flake8 mypy

# Run tests
pytest

# Format code
black .

# Type checking
mypy main.py
```

### **Code Style**
- **Black** for code formatting
- **Type hints** for all functions
- **Docstrings** for all public methods
- **Pydantic models** for data validation
- **Async/await** for I/O operations

### **Testing Guidelines**
- **Unit tests** for individual functions
- **Integration tests** for API endpoints
- **Performance tests** for optimization algorithms
- **Mock external APIs** for reliable testing
