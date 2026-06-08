# Credit Score Prediction API

A machine learning-powered REST API for predicting credit scores using artificial neural networks (ANN). This project provides real-time credit score predictions based on customer financial and demographic data.

## 🚀 Features

- **Real-time Predictions**: Get instant credit score predictions (Poor/Standard/Good)
- **Multiple Input Options**: Simple endpoint with minimal inputs or full endpoint with all 46 features
- **Confidence Scores**: Returns prediction confidence and probability distributions
- **Interactive Documentation**: Built-in Swagger UI for easy testing
- **Model Performance**: 86% accuracy on test data with robust preprocessing

## 📊 Model Performance

- **Test Accuracy**: 86%
- **Architecture**: Deep Neural Network with batch normalization and dropout
- **Classes**: Poor (0), Standard (1), Good (2)
- **Features**: 46 engineered features including financial metrics and demographics

## 🛠️ Installation

### Prerequisites
- Python 3.8+
- pip

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd credit-score-prediction-api
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Verify model files are present**
```
project/
├── final_model_credit_score.keras
├── credit_score_scaler
├── app.py
├── requirements.txt
└── README.md
```

## 🚀 Usage

### Start the API Server

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

### Interactive Documentation

Visit `http://localhost:8000/docs` for Swagger UI documentation where you can test the API directly.

## 📡 API Endpoints

### 1. Health Check
```http
GET /health
```
Check if the API and model are loaded correctly.

### 2. Simple Prediction (Recommended)
```http
POST /predict_simple
```

**Input Example:**
```json
{
  "age": 25,
  "annual_income": 50000.0,
  "monthly_inhand_salary": 4000.0,
  "credit_history_age": 60,
  "num_bank_accounts": 3,
  "num_credit_card": 2,
  "outstanding_debt": 1500.0,
  "credit_utilization_ratio": 25.5,
  "occupation": "engineer"
}
```

**Output Example:**
```json
{
  "prediction": "Good",
  "confidence": 0.367,
  "probabilities": {
    "Poor": 0.295,
    "Standard": 0.338,
    "Good": 0.367
  }
}
```

### 3. Full Prediction
```http
POST /predict
```
Requires all 46 features for maximum accuracy. See `/feature_info` for complete feature list.

### 4. Feature Information
```http
GET /feature_info
```
Returns detailed information about all required features.

## 🧪 Testing

### Using the Test Client

```bash
python test_client.py
```

### Using curl

```bash
# Health check
curl -X GET "http://localhost:8000/health"

# Simple prediction
curl -X POST "http://localhost:8000/predict_simple" \
     -H "Content-Type: application/json" \
     -d '{
       "age": 30,
       "annual_income": 60000,
       "monthly_inhand_salary": 5000,
       "credit_history_age": 72,
       "num_bank_accounts": 4,
       "num_credit_card": 3,
       "outstanding_debt": 8000,
       "credit_utilization_ratio": 30.0,
       "occupation": "scientist"
     }'
```

## 📋 Input Features

### Simple Prediction Inputs
- **age**: Customer age (16-55)
- **annual_income**: Annual income in currency units
- **monthly_inhand_salary**: Monthly take-home salary
- **credit_history_age**: Age of credit history in months
- **num_bank_accounts**: Number of bank accounts (0-10)
- **num_credit_card**: Number of credit cards (0-10)
- **outstanding_debt**: Total outstanding debt
- **credit_utilization_ratio**: Credit utilization percentage (20-50)
- **occupation**: Job title (engineer, scientist, doctor, etc.)

### Available Occupations
- accountant, architect, developer, doctor, engineer
- entrepreneur, journalist, lawyer, manager, mechanic
- media_manager, musician, scientist, teacher, writer

## 🎯 Credit Score Categories

| Score | Category | Description |
|-------|----------|-------------|
| 0 | Poor | High risk, may face difficulties getting credit |
| 1 | Standard | Average risk, standard credit terms |
| 2 | Good | Low risk, favorable credit terms |

## 🏗️ Model Architecture

- **Type**: Sequential Neural Network
- **Layers**: Dense layers with ReLU activation
- **Regularization**: L1 regularization, Batch Normalization, Dropout
- **Optimizer**: Adam with learning rate 0.0003
- **Training**: 260 epochs with class weight balancing

## 📊 Data Processing

- **Scaling**: StandardScaler for most features, RobustScaler for outlier-prone features
- **Encoding**: One-hot encoding for categorical variables
- **Features**: 46 engineered features from original 28 columns

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Set custom host and port
export HOST=0.0.0.0
export PORT=8000
```

### Model Files
- `final_model_credit_score.keras`: Trained TensorFlow model
- `credit_score_scaler`: Pickled preprocessing scaler

## 🚨 Error Handling

The API provides detailed error messages for:
- Invalid input formats
- Missing required fields
- Model prediction errors
- Server configuration issues

## 📈 Performance Metrics

| Metric | Poor | Standard | Good |
|--------|------|----------|------|
| Precision | 0.80 | 0.95 | 0.78 |
| Recall | 0.96 | 0.78 | 0.95 |
| F1-Score | 0.87 | 0.85 | 0.85 |

**Overall Accuracy**: 86%

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

## 🔮 Future Enhancements

- [ ] Model retraining pipeline
- [ ] Batch prediction endpoint
- [ ] Model performance monitoring
- [ ] Authentication and rate limiting
- [ ] Docker containerization
- [ ] Cloud deployment guides

---

**Built with ❤️ using FastAPI, TensorFlow, and scikit-learn**
