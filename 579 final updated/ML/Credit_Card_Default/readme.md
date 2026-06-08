# Credit Card Default Prediction - Complete Usage Guide

## 📋 Overview

This project provides a complete machine learning solution for predicting credit card payment defaults. It includes model training, evaluation, and a FastAPI web service for real-time predictions.

## 🚀 Quick Start

### Step 1: Train the Model

```bash
# Run the training script
python credit_card_model_training.py
```

This will:
- Load and preprocess the UCI Credit Card dataset
- Train multiple ML models (Logistic Regression, Random Forest, LightGBM, XGBoost, Deep Learning)
- Compare models and select the best one
- Save the best model and preprocessing components

**Generated Files:**
- `credit_card_scaler.pkl` - Feature scaler
- `best_model_*.pkl` or `best_model_*.h5` - Best trained model
- `model_info.pkl` - Model metadata
- `feature_names.pkl` - Feature names for API

### Step 2: Start the API Server

```bash
# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python app.py
# OR
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Test the API

```bash
# Run the test client
python test_client.py
```

## 📊 Model Training Details

### Supported Models
1. **Traditional ML Models:**
   - Logistic Regression
   - Naive Bayes
   - K-Nearest Neighbors
   - Decision Tree
   - Random Forest
   - Support Vector Machine
   - LightGBM
   - XGBoost

2. **Deep Learning Model:**
   - Neural Network with 3 hidden layers
   - Dropout regularization
   - Early stopping

### Feature Engineering
- Standardization using StandardScaler
- Categorical variable encoding
- Missing value handling

### Model Selection
- Automatic comparison of all models
- Selection based on test accuracy
- Cross-validation for hyperparameter tuning

## 🔌 API Endpoints

### 1. Health Check
```http
GET /health
```
Check if the API and model are loaded correctly.

### 2. Model Information
```http
GET /model-info
```
Get details about the loaded model.

### 3. Feature Information
```http
GET /feature-info
```
Get information about all required features.

### 4. Simple Prediction
```http
POST /predict-simple
```

**Input Example:**
```json
{
  "LIMIT_BAL": 50000.0,
  "AGE": 30,
  "SEX": 2,
  "EDUCATION": 2,
  "MARRIAGE": 1,
  "BILL_AMT1": 3000.0,
  "PAY_AMT1": 2000.0
}
```

### 5. Full Prediction
```http
POST /predict
```

Requires all 23 features. See API documentation for complete schema.

### 6. Batch Prediction
```http
POST /predict-batch
```

Process multiple predictions at once (max 100 records).

## 📝 Input Features

### Required Features (Full Prediction)
- **LIMIT_BAL**: Credit limit amount
- **SEX**: Gender (1=male, 2=female)
- **EDUCATION**: Education level (1=graduate, 2=university, 3=high school, 4=others)
- **MARRIAGE**: Marital status (1=married, 2=single, 3=others)
- **AGE**: Age in years
- **PAY_0 to PAY_6**: Payment status for 6 months
- **BILL_AMT1 to BILL_AMT6**: Bill amounts for 6 months
- **PAY_AMT1 to PAY_AMT6**: Payment amounts for 6 months

### Simplified Prediction
For quick predictions, you only need:
- Credit limit, age, gender, education, marriage status
- Most recent bill amount and payment amount

## 🧪 Testing

### Manual Testing with cURL

```bash
# Health check
curl -X GET "http://localhost:8000/health"

# Simple prediction
curl -X POST "http://localhost:8000/predict-simple" \
     -H "Content-Type: application/json" \
     -d '{
       "LIMIT_BAL": 50000,
       "AGE": 30,
       "SEX": 2,
       "EDUCATION": 2,
       "MARRIAGE": 1,
       "BILL_AMT1": 3000,
       "PAY_AMT1": 2000
     }'
```

### Using the Test Client

```bash
python test_client.py
```

This will run comprehensive tests on all endpoints.

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t credit-card-api .
```

### Run Container

```bash
# Run with volume mount for models
docker run -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  credit-card-api

# Or run with models copied into image
docker run -p 8000:8000 credit-card-api
```

## 📈 Model Performance

The system automatically selects the best-performing model based on test accuracy. Typical performance:

- **Accuracy**: 80-85%
- **AUC**: 0.75-0.80
- **Precision**: 0.70-0.85
- **Recall**: 0.65-0.80

## 🔧 Configuration

### Environment Variables

```bash
# Optional: Set custom host and port
export HOST=0.0.0.0
export PORT=8000

# Model directory
export MODEL_DIR=./models
```

### Model Files Structure

```
project/
├── credit_card_model_training.py
├── app.py
├── test_client.py
├── requirements.txt
├── Dockerfile
├── README.md
├── USAGE_GUIDE.md
├── credit_card_scaler.pkl          # Generated after training
├── best_model_*.pkl/.h5            # Generated after training
├── model_info.pkl                  # Generated after training
└── feature_names.pkl               # Generated after training
```

## ⚠️ Important Notes

1. **Data Requirements**: The model expects the UCI Credit Card dataset format
2. **Feature Order**: Features must be in the correct order (handled automatically by API)
3. **Scaling**: All features are automatically scaled using the saved StandardScaler
4. **Model Loading**: Models are loaded once at startup for optimal performance

## 🔍 Troubleshooting

### Common Issues

1. **Models not loading**
   - Ensure all `.pkl` files are in the same directory as `app.py`
   - Check file permissions
   - Verify model files were generated during training

2. **Prediction errors**
   - Verify input data format matches the schema
   - Check for missing required features
   - Ensure numeric values are within expected ranges

3. **API connection issues**
   - Confirm the server is running on the correct port
   - Check firewall settings
   - Verify the API URL in test scripts

### Debug Mode

```bash
# Run with debug logging
uvicorn app:app --reload --log-level debug
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
1. Check this usage guide
2. Review the API documentation
3. Run the test client to verify setup
4. Check logs for error details

---

**Happy Predicting! 🎯**