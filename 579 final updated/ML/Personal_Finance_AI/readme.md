# Personal Finance AI API v2.0

A comprehensive FastAPI-based microservice for automated expense categorization and financial insights. Designed to integrate seamlessly with existing web applications by accepting user IDs as parameters.

## 🎯 Features

- **🤖 Automated Expense Categorization** using Fina API
- **💡 Smart Budget Recommendations** with 4 budgeting strategies  
- **🎯 Savings Goal Optimization** - Set and track financial goals
- **📅 Bill Prediction and Reminders** - Auto-detect recurring bills
- **📊 Personalized Financial Insights** - AI-powered spending analysis
- **📈 Spending Pattern Analysis** and trend detection
- **🏆 Financial Health Score** - Comprehensive wellness tracking
- **📱 Dashboard Summary** - Complete financial overview
- **💾 Transaction History** - Store and retrieve categorized transactions
- **🔍 Advanced Filtering** - Filter by category, date, amount
- **📋 Industry Benchmark Comparisons** for spending validation
- **⚡ Real-time Processing** for instant categorization
- **📤 CSV File Upload** with automatic parsing and categorization
- **🔧 Flexible API Versions** (v2/v3 support)

## 🏗️ Architecture

### **Microservice Design**
- **No authentication required** - Assumes users already authenticated on main website
- **User ID parameter** - Simple `?user_id=user123` parameter for all endpoints
- **File-based storage** - JSON files with immediate persistence
- **Stateless operations** - Each request is independent

### **Data Storage Structure**
```
data/
├── users/
│   ├── user_123/
│   │   ├── transactions.json    # All categorized transactions
│   │   ├── goals.json          # Savings goals and progress
│   │   ├── bills.json          # Recurring bills detected
│   │   └── insights.json       # Generated financial insights
│   ├── user_456/
│   │   ├── transactions.json
│   │   ├── goals.json
│   │   └── bills.json
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip for dependency management

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd personal-finance-ai
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set environment variables**
```bash
export FINA_API_KEY="your-fina-api-key"
export PARTNER_ID="your-partner-id"
```

4. **Run the application**
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## 📦 Requirements

Create a `requirements.txt` file:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
httpx==0.25.2
pandas==2.1.3
pydantic==2.5.0
python-multipart==0.0.6
python-dotenv==1.0.0
```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Core Endpoints

#### 1. Transaction Categorization

**Single Transaction:**
```http
POST /categorize/single?user_id=user123
Content-Type: application/json

{
  "name": "TESLA SUPERCHARGER US",
  "merchant": "Tesla Supercharger",
  "amount": -211,
  "date": "2024-01-15",
  "account": "Credit Card"
}
```

**Batch Processing:**
```http
POST /categorize/batch?user_id=user123
Content-Type: application/json

[
  {
    "name": "TESLA SUPERCHARGER US",
    "amount": -211,
    "date": "2024-01-15"
  },
  {
    "name": "STARBUCKS COFFEE",
    "amount": -5.50,
    "date": "2024-01-15"
  }
]
```

**CSV Upload:**
```http
POST /categorize/upload-csv?user_id=user123
Content-Type: multipart/form-data

file: transactions.csv
```

#### 2. Budget Analysis

**Comprehensive Analysis:**
```http
POST /budget/analyze?user_id=user123
Content-Type: application/json

{
  "monthly_income": 5000,
  "fixed_expenses": 2000,
  "current_savings": 10000,
  "debt_amount": 5000,
  "budget_rule": "50_30_20",
  "analysis_months": 6
}
```

**Quick Analysis:**
```http
POST /budget/quick-analysis?user_id=user123&monthly_income=5000&analysis_months=3
```

#### 3. Savings Goals

**Create Goal:**
```http
POST /goals/create?user_id=user123
Content-Type: application/json

{
  "name": "Emergency Fund",
  "goal_type": "emergency_fund",
  "target_amount": 15000,
  "target_date": "2024-12-31",
  "monthly_contribution": 500,
  "priority": 5
}
```

**Update Progress:**
```http
PUT /goals/{goal_id}/update-progress?user_id=user123
Content-Type: application/json

{
  "current_amount": 3500
}
```

**List Goals:**
```http
GET /goals/list?user_id=user123
```

#### 4. Financial Insights

**Personalized Insights:**
```http
GET /insights/personalized?user_id=user123
```

**Financial Health Score:**
```http
GET /insights/financial-health-score?user_id=user123
```

#### 5. Dashboard & History

**Dashboard Summary:**
```http
GET /dashboard/summary?user_id=user123
```

**Transaction History:**
```http
GET /transactions/history?user_id=user123&limit=50&category=Transportation&start_date=2024-01-01
```

**Category Summary:**
```http
GET /categories/summary?user_id=user123
```

## 💡 Budgeting Strategies

### 1. 50/30/20 Rule
- **50% Needs**: Housing, food, utilities, minimum debt payments
- **30% Wants**: Entertainment, dining out, hobbies
- **20% Savings**: Emergency fund, retirement, extra debt payments

### 2. Zero-Based Budgeting
- Every dollar has a specific purpose
- Income minus expenses equals zero
- Prioritizes essential categories first

### 3. Envelope Method
- Allocate money to specific spending categories
- Based on historical spending patterns
- Prevents overspending in any category

### 4. Custom Budget
- AI-optimized based on your unique spending patterns
- Considers industry benchmarks
- Adapts to your financial goals and lifestyle

## 📊 Example Responses

### Transaction Categorization Response
```json
{
  "original_transaction": {
    "name": "TESLA SUPERCHARGER US",
    "merchant": "Tesla Supercharger",
    "amount": -211,
    "date": "2024-01-15"
  },
  "category": "Transportation",
  "subcategory": "Fuel",
  "confidence": 0.95,
  "fina_response": {
    "category": "Transportation",
    "subcategory": "Fuel",
    "confidence": 0.95
  }
}
```

### Budget Analysis Response
```json
{
  "rule_applied": "50_30_20",
  "monthly_income": 5000,
  "total_expenses": 3200,
  "recommended_allocations": {
    "Housing": 1500,
    "Food": 600,
    "Transportation": 750,
    "Savings": 1000
  },
  "insights": [
    {
      "category": "Housing",
      "current_monthly_avg": 1200,
      "recommended_budget": 1500,
      "variance_percentage": -20,
      "trend": "stable",
      "recommendation": "You have room to increase Housing budget by $300/month"
    }
  ],
  "savings_potential": 1800,
  "financial_health_score": 75,
  "recommendations": [
    "💰 Great savings potential! Consider investing excess",
    "✅ Good emergency fund coverage",
    "📊 Housing spending is optimal at 24% of income"
  ]
}
```

### Financial Health Score Response
```json
{
  "overall_score": 75,
  "level": "Good",
  "message": "👍 Good financial health with room for improvement",
  "factors": {
    "savings_rate": {
      "score": 25,
      "description": "How much you save vs spend"
    },
    "emergency_fund": {
      "score": 20,
      "description": "Emergency fund adequacy"
    },
    "spending_consistency": {
      "score": 15,
      "description": "How predictable your spending is"
    },
    "goal_progress": {
      "score": 15,
      "description": "Progress toward financial goals"
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FINA_API_KEY` | Your Fina API key | `fina-api-test` | ✅ |
| `PARTNER_ID` | Your partner ID for Fina API | `your-partner-id` | ✅ |
| `DATA_DIR` | Directory for storing user data | `data/users` | ❌ |

### Fina API Configuration

The application supports both Fina API v2 and v3:

**Headers sent to Fina API:**
- `x-api-key`: Your API key
- `x-partner-id`: Your partner ID  
- `x-api-model`: API version (v2/v3)
- `x-api-mapping`: Enable/disable mapping features

## 📁 CSV File Support

### Supported Column Names

| Field | Possible Column Names |
|-------|----------------------|
| Description | description, desc, transaction, merchant, name |
| Merchant | merchant, merchant_name, payee, vendor |
| Amount | amount, debit, credit, value, transaction_amount |
| Date | date, transaction_date, posted_date, created_date |
| Account | account, account_name, account_number |

### CSV Format Example
```csv
description,amount,date,merchant,account
TESLA SUPERCHARGER US,-211,2024-01-15,Tesla Supercharger,Credit Card
STARBUCKS COFFEE,-5.50,2024-01-15,Starbucks,Debit Card
SALARY DEPOSIT,3000,2024-01-01,Company Inc,Checking
RENT PAYMENT,-1200,2024-01-01,Property Manager,Checking
```

### CSV Processing Rules
- **Required fields**: description and amount
- **Negative amounts**: Expenses (outgoing money)
- **Positive amounts**: Income (incoming money)
- **Empty transactions**: Automatically filtered out
- **Batch processing**: Large files processed in chunks of 50 transactions

## 🔄 Integration Examples

### Frontend JavaScript Integration

```javascript
// Upload CSV and get categorized transactions
async function uploadTransactions(userId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`/categorize/upload-csv?user_id=${userId}`, {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// Get budget analysis
async function getBudgetAnalysis(userId, monthlyIncome) {
  const response = await fetch(`/budget/quick-analysis?user_id=${userId}&monthly_income=${monthlyIncome}`, {
    method: 'POST'
  });
  
  return await response.json();
}

// Get dashboard summary
async function getDashboard(userId) {
  const response = await fetch(`/dashboard/summary?user_id=${userId}`);
  return await response.json();
}
```

### Python Client Integration

```python
import httpx
import asyncio

class FinanceAPIClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    async def categorize_transaction(self, user_id, transaction):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/categorize/single",
                params={"user_id": user_id},
                json=transaction
            )
            return response.json()
    
    async def get_insights(self, user_id):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/insights/personalized",
                params={"user_id": user_id}
            )
            return response.json()

# Usage
client = FinanceAPIClient()
result = asyncio.run(client.get_insights("user_123"))
```

## 🔍 Data Processing Flow

### 1. Transaction Processing
```
CSV Upload → Parse Columns → Validate Data → Call Fina API → 
Store Categorized Transactions → Return Results
```

### 2. Budget Analysis
```
Load User Transactions → Analyze Spending Patterns → 
Apply Budgeting Rules → Generate Insights → Return Recommendations
```

### 3. Savings Goal Optimization
```
Load Goals & Transactions → Calculate Available Savings → 
Optimize Allocations → Generate Timeline → Return Strategy
```

### 4. Financial Insights
```
Load All User Data → Calculate Health Score → 
Identify Trends → Generate Opportunities → Return Insights
```

## 🛡️ Error Handling

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid input, missing required fields)
- `404`: Not Found (user data, specific transaction/goal not found)
- `422`: Validation Error (invalid data types, out of range values)
- `500`: Internal Server Error (Fina API issues, file system errors)

### Error Response Format
```json
{
  "error": true,
  "message": "Detailed error description",
  "status_code": 400
}
```

### Common Error Scenarios

1. **Invalid CSV Format**
   - Missing required columns
   - Invalid data types
   - Empty file

2. **Fina API Errors**
   - Invalid API key
   - Rate limiting
   - Service unavailable

3. **File System Errors**
   - Disk space full
   - Permission issues
   - Corrupted JSON files

4. **Data Validation Errors**
   - Invalid user_id format
   - Negative goal amounts
   - Invalid date formats

## 🚀 Production Deployment

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p data/users

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t finance-ai-api .
docker run -p 8000:8000 \
  -e FINA_API_KEY=your-actual-api-key \
  -e PARTNER_ID=your-actual-partner-id \
  -v ./data:/app/data \
  finance-ai-api
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  finance-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - FINA_API_KEY=${FINA_API_KEY}
      - PARTNER_ID=${PARTNER_ID}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

### Cloud Deployment

**AWS EC2:**
```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start

# Clone and deploy
git clone <your-repo>
cd personal-finance-ai
docker build -t finance-api .
docker run -d -p 8000:8000 \
  -e FINA_API_KEY=your-key \
  -e PARTNER_ID=your-id \
  -v /home/ec2-user/data:/app/data \
  finance-api
```

**Google Cloud Run:**
```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/finance-api

# Deploy
gcloud run deploy finance-api \
  --image gcr.io/PROJECT-ID/finance-api \
  --platform managed \
  --set-env-vars FINA_API_KEY=your-key,PARTNER_ID=your-id
```

## 📊 Monitoring & Observability

### Health Checks
```bash
# Basic health check
curl http://localhost:8000/health

# Check user data
curl "http://localhost:8000/dashboard/summary?user_id=test_user"
```

### Logging Configuration
```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('finance_api.log'),
        logging.StreamHandler()
    ]
)
```

### Performance Monitoring
- **File system usage**: Monitor `data/` directory size
- **API response times**: Track Fina API latency
- **Error rates**: Monitor failed categorizations
- **User activity**: Track active users and transaction volumes

## 🔒 Security Considerations

### API Security
1. **Input Validation**: All inputs validated using Pydantic models
2. **File Upload Limits**: CSV files limited to reasonable sizes
3. **SQL Injection**: Not applicable (no database)
4. **XSS Prevention**: JSON responses, no HTML rendering

### Data Security
1. **User Isolation**: Each user's data in separate directories
2. **File Permissions**: Restrict access to data directory
3. **API Keys**: Store in environment variables
4. **No PII Storage**: Only financial transaction data

### Production Security Checklist
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Secure file permissions (700 for data directory)
- [ ] Regular backup of data directory
- [ ] Monitor for unusual file system activity

## 🔧 Troubleshooting

### Common Issues

**1. File Permission Errors**
```bash
# Fix data directory permissions
chmod -R 755 data/
chown -R $USER data/
```

**2. Fina API Connection Issues**
```bash
# Test API connectivity
curl -X POST "https://app.fina.money/api/resource/categorize" \
  -H "x-api-key: your-key" \
  -H "x-partner-id: your-id" \
  -H "Content-Type: application/json" \
  -d '[{"name":"test","amount":-10}]'
```

**3. CSV Parsing Errors**
- Check CSV encoding (UTF-8 required)
- Verify column names match supported formats
- Ensure numeric amounts are properly formatted

**4. Missing User Data**
```bash
# Check if user directory exists
ls -la data/users/user_123/

# Check file contents
cat data/users/user_123/transactions.json
```

### Debug Mode
```bash
# Run with debug logging
export DEBUG=true
python main.py
```

## 📈 Performance Optimization

### File I/O Optimization
- **Lazy Loading**: Only load data when needed
- **Batch Operations**: Process multiple transactions together
- **Compression**: Consider compressing historical data
- **Archiving**: Move old data to separate files

### API Performance
- **Connection Pooling**: Reuse HTTP connections to Fina API
- **Request Batching**: Group multiple categorizations
- **Caching**: Cache frequently accessed insights
- **Async Operations**: Use async/await for I/O operations

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone <repo-url>
cd personal-finance-ai

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Run tests
pytest
```

### Code Style
- Use Black for code formatting
- Follow PEP 8 guidelines
- Add type hints for all functions
- Write comprehensive docstrings

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=main

# Run specific test
pytest tests/test_categorization.py
```

## 📝 Changelog

### v2.0.0 (Current)
- ✅ Removed user authentication system
- ✅ Added direct file storage with JSON format
- ✅ Simplified API endpoints with user_id parameters
- ✅ Implemented all 6 core financial features
- ✅ Added comprehensive budget analysis
- ✅ Added savings goal optimization
- ✅ Added financial health scoring

### v1.0.0
- ✅ Initial release with Fina API integration
- ✅ Basic transaction categorization
- ✅ Simple budget recommendations
- ✅ In-memory storage system

## 📞 Support

### Documentation
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Issues
For technical issues:
1. Check the troubleshooting section
2. Review error logs
3. Test with sample data
4. Create detailed issue report

### Feature Requests
To request new features:
1. Describe the use case
2. Explain expected behavior
3. Provide example API calls
4. Consider backwards compatibility

## 🙏 Acknowledgments

- **Fina API** for accurate transaction categorization
- **FastAPI** for the excellent web framework
- **Pydantic** for data validation
- **Pandas** for data processing capabilities

---
