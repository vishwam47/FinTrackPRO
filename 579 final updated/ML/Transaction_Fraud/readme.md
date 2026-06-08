# Fraud Detection API Setup Guide

## Prerequisites

1. **Save your best model**: Make sure you have `xgb_model.pkl` file from your notebook
2. **Python 3.8+** installed
3. **Optional**: Docker for containerized deployment

## Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv fraud_api_env
source fraud_api_env/bin/activate  # On Windows: fraud_api_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Prepare Model File

Make sure your `xgb_model.pkl` file is in the same directory as `main.py`. If you need to recreate it, run:

```python
# In your notebook, ensure you save the model:
import pickle
with open('xgb_model.pkl', 'wb') as file:
    pickle.dump(xgb, file)
```

### 3. Run the API

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test the API

```bash
python test_api.py
```

## API Endpoints

### 1. Health Check
- **GET** `/health`
- Returns API status and model loading status

### 2. Single Prediction
- **POST** `/predict`
- Input: Transaction details
- Output: Fraud prediction with probability and risk factors

Example request:
```json
{
  "amount": 50000.0,
  "oldbalanceOrg": 100000.0,
  "newbalanceOrig": 50000.0,
  "oldbalanceDest": 0.0,
  "newbalanceDest": 50000.0,
  "transaction_type": "TRANSFER"
}
```

Example response:
```json
{
  "is_fraud": true,
  "fraud_probability": 0.8543,
  "confidence_level": "High",
  "risk_factors": [
    "High-risk transaction type",
    "Large transaction amount"
  ]
}
```

### 3. Batch Prediction
- **POST** `/predict_batch`
- Input: Array of transactions
- Output: Array of predictions

## Interactive Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Docker Deployment

### Build and Run
```bash
# Build image
docker build -t fraud-detection-api .

# Run container
docker run -p 8000:8000 fraud-detection-api
```

## Model Features

The API expects these input features:
- `amount`: Transaction amount
- `oldbalanceOrg`: Original sender balance
- `newbalanceOrig`: New sender balance
- `oldbalanceDest`: Original recipient balance  
- `newbalanceDest`: New recipient balance
- `transaction_type`: One of ['CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER']

## Risk Factors Detected

The API identifies these fraud patterns:
- Account completely drained (newbalanceOrig = 0)
- High-risk transaction types (TRANSFER, CASH_OUT)
- Large transaction amounts (≥ 1M)
- Full balance transfers
- Round transaction amounts (multiples of 10,000)

## Performance Metrics

Based on your model evaluation:
- **Recall (Fraud Detection)**: 99%
- **Precision**: 94%
- **F1 Score**: 97%
- **AUC**: 99.7%

## Troubleshooting

1. **Model not loading**: Ensure `xgb_model.pkl` is in the correct directory
2. **Import errors**: Check that all requirements are installed
3. **Port conflicts**: Change port using `--port` flag
4. **Memory issues**: Consider reducing model complexity for deployment

## Security Considerations

For production deployment:
- Add authentication/authorization
- Implement rate limiting
- Use HTTPS
- Add input validation and sanitization
- Monitor for adversarial inputs