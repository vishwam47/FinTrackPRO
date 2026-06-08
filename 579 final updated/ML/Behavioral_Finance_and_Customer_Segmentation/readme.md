# Behavioral Finance & Customer Segmentation API

## 🚀 Quick Start

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd behavioral-finance-api

# Install dependencies
pip install -r requirements.txt

# Download TextBlob corpora (one-time setup)
python -m textblob.download_corpora

# Run the application
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Access the API
- **API URL**: http://localhost:8001
- **Interactive Docs**: http://localhost:8001/docs
- **OpenAPI Schema**: http://localhost:8001/openapi.json

## 📋 API Endpoints with Sample Inputs

### 1. Check API Status
**GET** `/`

```bash
curl -X GET "http://localhost:8001/"
```

**Response:**
```json
{
  "message": "Behavioral Finance & Customer Segmentation API",
  "status": "cold_start_mode",
  "description": "Using APIs and rule-based logic until sufficient customer data is collected"
}
```

---

### 2. Create Customer Profile
**POST** `/customer/profile`

**Sample Input:**
```bash
curl -X POST "http://localhost:8001/customer/profile" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "user_001",
  "age": 28,
  "income_range": "50k-75k",
  "location": "New York",
  "risk_tolerance": "medium",
  "financial_goals": ["retirement", "house_purchase", "emergency_fund"]
}'
```

**Sample Response:**
```json
{
  "user_id": "user_001",
  "segment": "balanced_investor",
  "characteristics": ["Moderate risk", "Diversified portfolio", "Growth-oriented"],
  "recommendations": ["Index funds", "Balanced ETFs", "Target-date funds"],
  "status": "profile_created"
}
```

**More Sample Profiles:**

**Conservative Saver:**
```json
{
  "user_id": "user_002",
  "age": 55,
  "income_range": "75k-100k",
  "location": "California",
  "risk_tolerance": "low",
  "financial_goals": ["retirement", "capital_preservation"]
}
```

**Aggressive Trader:**
```json
{
  "user_id": "user_003",
  "age": 25,
  "income_range": "100k+",
  "location": "Texas",
  "risk_tolerance": "high",
  "financial_goals": ["wealth_building", "trading"]
}
```

**Beginner:**
```json
{
  "user_id": "user_004",
  "age": 22,
  "income_range": "25k-50k",
  "location": "Florida",
  "financial_goals": []
}
```

---

### 3. Analyze Sentiment
**POST** `/analyze/sentiment`

**Sample Inputs:**

**Positive Feedback:**
```bash
curl -X POST "http://localhost:8001/analyze/sentiment" \
-H "Content-Type: application/json" \
-d '{
  "text": "I absolutely love the new investment dashboard! The interface is so intuitive and easy to use.",
  "source": "app_review"
}'
```

**Negative Feedback:**
```bash
curl -X POST "http://localhost:8001/analyze/sentiment" \
-H "Content-Type: application/json" \
-d '{
  "text": "The app keeps crashing when I try to make trades. Very frustrating experience.",
  "source": "support_ticket"
}'
```

**Neutral Feedback:**
```bash
curl -X POST "http://localhost:8001/analyze/sentiment" \
-H "Content-Type: application/json" \
-d '{
  "text": "The app has basic features for portfolio tracking. Could use more advanced analytics.",
  "source": "user_feedback"
}'
```

**Sample Response:**
```json
{
  "sentiment_score": 0.625,
  "sentiment_label": "positive",
  "subjectivity": 0.6,
  "confidence": 0.625,
  "source": "app_review",
  "analyzed_at": "2024-01-15T10:30:45.123456"
}
```

---

### 4. Get Market Sentiment
**GET** `/market/sentiment/{symbol}`

**Sample Requests:**
```bash
# Apple Stock
curl -X GET "http://localhost:8001/market/sentiment/AAPL"

# Tesla Stock
curl -X GET "http://localhost:8001/market/sentiment/TSLA"

# S&P 500 ETF
curl -X GET "http://localhost:8001/market/sentiment/SPY"

# Bitcoin (if available)
curl -X GET "http://localhost:8001/market/sentiment/BTC-USD"
```

**Sample Response:**
```json
{
  "symbol": "AAPL",
  "sentiment_score": 0.4,
  "sentiment_label": "positive",
  "volume": 89234567,
  "price_change": 1.25,
  "current_price": 182.45
}
```

---

### 5. Add Customer Transaction
**POST** `/customer/transaction`

**Sample Transactions:**

**Investment Purchase:**
```bash
curl -X POST "http://localhost:8001/customer/transaction" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "user_001",
  "amount": 1500.00,
  "category": "investment",
  "date": "2024-01-15",
  "description": "Purchase of VTSAX index fund"
}'
```

**Regular Spending:**
```bash
curl -X POST "http://localhost:8001/customer/transaction" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "user_001",
  "amount": 85.50,
  "category": "groceries",
  "date": "2024-01-14",
  "description": "Weekly grocery shopping"
}'
```

**Subscription Payment:**
```bash
curl -X POST "http://localhost:8001/customer/transaction" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "user_001",
  "amount": 9.99,
  "category": "subscription",
  "date": "2024-01-10",
  "description": "Netflix monthly subscription"
}'
```

**Large Purchase:**
```bash
curl -X POST "http://localhost:8001/customer/transaction" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "user_001",
  "amount": 25000.00,
  "category": "auto",
  "date": "2024-01-05",
  "description": "Car purchase down payment"
}'
```

**Sample Response:**
```json
{
  "status": "transaction_added",
  "user_id": "user_001",
  "total_transactions": 4
}
```

---

### 6. Get Customer Behavioral Insights
**GET** `/customer/{user_id}/insights`

```bash
curl -X GET "http://localhost:8001/customer/user_001/insights"
```

**Sample Response:**
```json
{
  "user_id": "user_001",
  "risk_profile": "medium",
  "spending_pattern": "high_spender",
  "investment_preference": "balanced",
  "behavioral_score": 0.7
}
```

---

### 7. Get Customer Segment
**GET** `/customer/{user_id}/segment`

```bash
curl -X GET "http://localhost:8001/customer/user_001/segment"
```

**Sample Response:**
```json
{
  "user_id": "user_001",
  "segment": "balanced_investor",
  "characteristics": {
    "segment_type": "balanced_investor",
    "traits": ["Moderate risk", "Diversified portfolio", "Growth-oriented"],
    "profile_completeness": 0.83
  },
  "recommendations": ["Index funds", "Balanced ETFs", "Target-date funds"]
}
```

---

### 8. Get Bulk Market Sentiment
**POST** `/market/bulk-sentiment`

```bash
curl -X POST "http://localhost:8001/market/bulk-sentiment" \
-H "Content-Type: application/json" \
-d '["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]'
```

**Sample Response:**
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "sentiment_score": 0.4,
      "sentiment_label": "positive",
      "volume": 89234567,
      "price_change": 1.25,
      "current_price": 182.45
    },
    {
      "symbol": "GOOGL",
      "sentiment_score": -0.2,
      "sentiment_label": "negative",
      "volume": 45123890,
      "price_change": -0.85,
      "current_price": 141.20
    }
  ],
  "analyzed_symbols": 5
}
```

---

### 9. Get Analytics Overview
**GET** `/analytics/overview`

```bash
curl -X GET "http://localhost:8001/analytics/overview"
```

**Sample Response:**
```json
{
  "total_customers": 4,
  "total_transactions": 12,
  "segment_distribution": {
    "balanced_investor": 2,
    "conservative_saver": 1,
    "aggressive_trader": 1
  },
  "ml_model_readiness": {
    "status": "insufficient_data",
    "required_customers": 100
  },
  "data_collection_progress": {
    "customers_needed_for_ml": 100,
    "current_customers": 4,
    "progress_percentage": 4.0
  }
}
```

---

### 10. Get Available Segments
**GET** `/segments/available`

```bash
curl -X GET "http://localhost:8001/segments/available"
```

**Sample Response:**
```json
{
  "segments": {
    "conservative_saver": {
      "characteristics": ["Risk-averse", "Prefers savings", "Long-term focused"],
      "recommendations": ["High-yield savings", "CDs", "Government bonds"]
    },
    "balanced_investor": {
      "characteristics": ["Moderate risk", "Diversified portfolio", "Growth-oriented"],
      "recommendations": ["Index funds", "Balanced ETFs", "Target-date funds"]
    },
    "aggressive_trader": {
      "characteristics": ["High risk tolerance", "Active trading", "Growth seeking"],
      "recommendations": ["Growth stocks", "Options", "Crypto"]
    },
    "beginner": {
      "characteristics": ["New to investing", "Learning focused", "Small amounts"],
      "recommendations": ["Educational content", "Robo-advisor", "Starter portfolios"]
    }
  },
  "total_segments": 4,
  "segmentation_method": "rule_based"
}
```

---

### 11. Check ML Model Training Readiness
**POST** `/ml/train-models`

```bash
curl -X POST "http://localhost:8001/ml/train-models"
```

**Sample Response (Not Ready):**
```json
{
  "status": "training_not_ready",
  "message": "Need at least 100 customers to train models",
  "current_customers": 4
}
```

**Sample Response (Ready):**
```json
{
  "status": "training_scheduled",
  "message": "Custom ML model training will be implemented when sufficient data is available",
  "estimated_training_time": "2-4 hours",
  "models_to_train": ["customer_segmentation", "churn_prediction", "risk_profiling"]
}
```

---

## 🧪 Complete Test Sequence

Here's a complete sequence to test all features:

```bash
# 1. Check API status
curl -X GET "http://localhost:8001/"

# 2. Create multiple customer profiles
curl -X POST "http://localhost:8001/customer/profile" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "alice_001",
  "age": 32,
  "income_range": "75k-100k",
  "risk_tolerance": "medium",
  "financial_goals": ["retirement", "house_purchase"]
}'

curl -X POST "http://localhost:8001/customer/profile" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "bob_002",
  "age": 45,
  "income_range": "100k+",
  "risk_tolerance": "low",
  "financial_goals": ["retirement", "kids_education"]
}'

# 3. Add transactions for Alice
curl -X POST "http://localhost:8001/customer/transaction" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "alice_001",
  "amount": 2000.00,
  "category": "investment",
  "date": "2024-01-15",
  "description": "Monthly investment contribution"
}'

curl -X POST "http://localhost:8001/customer/transaction" \
-H "Content-Type: application/json" \
-d '{
  "user_id": "alice_001",
  "amount": 1200.00,
  "category": "rent",
  "date": "2024-01-01",
  "description": "Monthly rent payment"
}'

# 4. Get Alice's insights
curl -X GET "http://localhost:8001/customer/alice_001/insights"

# 5. Get Alice's segment
curl -X GET "http://localhost:8001/customer/alice_001/segment"

# 6. Analyze some sentiment
curl -X POST "http://localhost:8001/analyze/sentiment" \
-H "Content-Type: application/json" \
-d '{
  "text": "The investment tracking feature is amazing! I can see all my portfolio performance in one place.",
  "source": "app_review"
}'

# 7. Get market sentiment
curl -X GET "http://localhost:8001/market/sentiment/AAPL"

# 8. Get analytics overview
curl -X GET "http://localhost:8001/analytics/overview"

# 9. Check available segments
curl -X GET "http://localhost:8001/segments/available"

# 10. Check ML readiness
curl -X POST "http://localhost:8001/ml/train-models"
```

## 🚨 Error Handling Examples

### Customer Not Found
```bash
curl -X GET "http://localhost:8001/customer/nonexistent_user/insights"
```
**Response:**
```json
{
  "detail": "Customer not found"
}
```

### Invalid Stock Symbol
```bash
curl -X GET "http://localhost:8001/market/sentiment/INVALID"
```
**Response:**
```json
{
  "detail": "Error fetching market data: No data found, symbol may be delisted"
}
```

## 📊 Testing with Different User Types

### Test Conservative User
```json
{
  "user_id": "conservative_user",
  "age": 58,
  "income_range": "50k-75k",
  "risk_tolerance": "low",
  "financial_goals": ["retirement", "capital_preservation"]
}
```

### Test Aggressive User
```json
{
  "user_id": "aggressive_user",
  "age": 26,
  "income_range": "100k+",
  "risk_tolerance": "high",
  "financial_goals": ["wealth_building", "early_retirement"]
}
```

### Test Beginner User
```json
{
  "user_id": "beginner_user",
  "age": 23,
  "income_range": "25k-50k",
  "financial_goals": []
}
```

## 🔧 Development Tips

1. **Use the Interactive Docs**: Visit http://localhost:8001/docs for a user-friendly interface
2. **Monitor Logs**: Check terminal output for detailed processing information
3. **Test Edge Cases**: Try empty fields, invalid data, and missing users
4. **Gradual Data Building**: Add customers and transactions gradually to see segmentation improve
5. **Market Data**: Test with different stock symbols (AAPL, GOOGL, TSLA, SPY, etc.)

## 📈 Next Steps

1. **Add More Customers**: Create 10-20 test customers with varied profiles
2. **Add Transaction History**: Generate realistic transaction patterns
3. **Test Market Analysis**: Try different stock symbols and time periods
4. **Monitor Analytics**: Watch how segment distribution changes
5. **Prepare for ML**: When you reach 100+ customers, the system will be ready for ML model training

This API is ready to handle real customer data and will automatically improve as your user base grows!