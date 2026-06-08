# Personal Finance AI API

A FastAPI-based backend service for automated expense categorization using Fina API, designed to power personal finance management applications.

## Features

- **Automated Expense Categorization** using Fina API
- **Single Transaction Processing** for real-time categorization
- **Batch Processing** for multiple transactions
- **CSV File Upload** with automatic parsing and categorization
- **Category Analytics** and spending summaries
- **Flexible API Versions** (v2/v3 support)
- **Comprehensive Error Handling** and logging

## Quick Start

### Prerequisites

- Python 3.8+
- pip or poetry for dependency management

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

## Requirements

Create a `requirements.txt` file with:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
httpx==0.25.2
pandas==2.1.3
pydantic==2.5.0
python-multipart==0.0.6
python-dotenv==1.0.0
```

## API Documentation

### Interactive API Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Core Endpoints

#### 1. Single Transaction Categorization
```http
POST /categorize/single
```

**Request Body:**
```json
{
  "name": "TESLA SUPERCHARGER US",
  "merchant": "Tesla Supercharger",
  "amount": -211,
  "date": "2024-01-15",
  "account": "Credit Card"
}
```

**Response:**
```json
{
  "original_transaction": {
    "name": "TESLA SUPERCHARGER US",
    "merchant": "Tesla Supercharger",
    "amount": -211,
    "date": "2024-01-15",
    "account": "Credit Card"
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

#### 2. Batch Transaction Categorization
```http
POST /categorize/batch
```

**Request Body:**
```json
[
  {
    "name": "TESLA SUPERCHARGER US",
    "merchant": "Tesla Supercharger",
    "amount": -211
  },
  {
    "name": "STARBUCKS COFFEE",
    "merchant": "Starbucks",
    "amount": -5.50
  }
]
```

#### 3. CSV File Upload
```http
POST /categorize/upload-csv
```

**Form Data:**
- `file`: CSV file with transaction data
- `api_version`: v2 or v3 (optional, default: v2)
- `enable_mapping`: boolean (optional, default: false)

**CSV Format:**
```csv
description,amount,date,merchant,account
TESLA SUPERCHARGER US,-211,2024-01-15,Tesla Supercharger,Credit Card
STARBUCKS COFFEE,-5.50,2024-01-15,Starbucks,Debit Card
SALARY DEPOSIT,3000,2024-01-01,Company Inc,Checking
```

#### 4. Category Summary
```http
GET /categories/summary
```

Returns spending analysis by category with percentages and totals.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FINA_API_KEY` | Your Fina API key | `fina-api-test` |
| `PARTNER_ID` | Your partner ID for Fina API | `your-partner-id` |

### Fina API Configuration

The application supports both Fina API v2 and v3:

- **v2**: Standard categorization
- **v3**: Enhanced categorization with additional features

**Headers sent to Fina API:**
- `x-api-key`: Your API key
- `x-partner-id`: Your partner ID
- `x-api-model`: API version (v2/v3)
- `x-api-mapping`: Enable/disable mapping features

## CSV File Support

### Supported Column Names

The API automatically detects common CSV column names:

| Field | Possible Column Names |
|-------|----------------------|
| Description | description, desc, transaction, merchant, name |
| Merchant | merchant, merchant_name, payee, vendor |
| Amount | amount, debit, credit, value, transaction_amount |
| Date | date, transaction_date, posted_date, created_date |
| Account | account, account_name, account_number |

### CSV Processing Rules

- **Required fields**: description and amount
- **Negative amounts**: Expenses (outgoing money)
- **Positive amounts**: Income (incoming money)
- **Empty transactions**: Automatically filtered out
- **Batch processing**: Large files processed in chunks of 50 transactions

## Usage Examples

### Python Client Example

```python
import httpx
import asyncio

async def categorize_transaction():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/categorize/single",
            json={
                "name": "TESLA SUPERCHARGER US",
                "merchant": "Tesla Supercharger", 
                "amount": -211
            }
        )
        return response.json()

# Run the example
result = asyncio.run(categorize_transaction())
print(result)
```

### cURL Examples

**Single transaction:**
```bash
curl -X POST "http://localhost:8000/categorize/single" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TESLA SUPERCHARGER US",
    "merchant": "Tesla Supercharger",
    "amount": -211
  }'
```

**Upload CSV:**
```bash
curl -X POST "http://localhost:8000/categorize/upload-csv" \
  -F "file=@transactions.csv" \
  -F "api_version=v2"
```

## Error Handling

The API provides comprehensive error handling:

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (invalid input)
- `422`: Validation Error
- `500`: Internal Server Error

### Error Response Format

```json
{
  "error": true,
  "message": "Error description",
  "status_code": 400
}
```

### Common Errors

1. **Invalid CSV format**: Check column names and data types
2. **Fina API errors**: Verify API key and partner ID
3. **File size limits**: Maximum 100 transactions per batch
4. **Network timeouts**: Retry after a few seconds

## Development

### Running in Development Mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Setup

Create a `.env` file:
```env
FINA_API_KEY=your-actual-api-key
PARTNER_ID=your-actual-partner-id
DEBUG=True
```

### Testing

```python
# Test the health endpoint
import httpx

response = httpx.get("http://localhost:8000/health")
print(response.json())
```

## Production Deployment

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t finance-ai-api .
docker run -p 8000:8000 \
  -e FINA_API_KEY=your-key \
  -e PARTNER_ID=your-id \
  finance-ai-api
```

### Security Considerations

1. **API Keys**: Store in environment variables, never in code
2. **CORS**: Configure allowed origins for production
3. **Rate Limiting**: Implement rate limiting for public APIs
4. **Input Validation**: All inputs are validated using Pydantic
5. **File Uploads**: Limit file sizes and validate file types

## Integration Guide

### Frontend Integration

The API is designed to work with any frontend framework:

```javascript
// JavaScript example
async function categorizeTransaction(transaction) {
  const response = await fetch('/categorize/single', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction)
  });
  
  return await response.json();
}
```

### Database Integration

To persist categorized transactions, add database models:

```python
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String)
    subcategory = Column(String)
    confidence = Column(Float)
    created_at = Column(DateTime)
```

## Monitoring and Logging

The application includes comprehensive logging:

- **Info logs**: Successful operations
- **Error logs**: API errors and processing failures
- **Request logs**: All incoming requests

Configure log level:
```python
logging.basicConfig(level=logging.INFO)
```

## Support

For issues related to:
- **Fina API**: Contact Fina support
- **This implementation**: Create an issue in the repository
- **Feature requests**: Submit a feature request

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**Built with FastAPI and powered by Fina API for accurate transaction categorization.**