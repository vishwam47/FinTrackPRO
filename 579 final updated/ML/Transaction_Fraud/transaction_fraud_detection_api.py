# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fraud Detection API",
    description="API for detecting fraudulent financial transactions",
    version="1.0.0"
)

# Load the trained model and scaler
try:
    with open('Transaction_Fraud/xgb_model.pkl', 'rb') as file:
        model = pickle.load(file)
    logger.info("XGBoost model loaded successfully")
except FileNotFoundError:
    logger.error("Model file not found. Please ensure xgb_model.pkl exists in the same directory.")
    model = None

# Input data model
class TransactionInput(BaseModel):
    amount: float = Field(..., description="Transaction amount", example=50000.0)
    oldbalanceOrg: float = Field(..., description="Initial balance before transaction", example=100000.0)
    newbalanceOrig: float = Field(..., description="New balance after transaction", example=50000.0)
    oldbalanceDest: float = Field(..., description="Initial balance of destination", example=0.0)
    newbalanceDest: float = Field(..., description="New balance of destination", example=50000.0)
    transaction_type: str = Field(..., description="Type of transaction", example="TRANSFER")
    
    class Config:
        schema_extra = {
            "example": {
                "amount": 50000.0,
                "oldbalanceOrg": 100000.0,
                "newbalanceOrig": 50000.0,
                "oldbalanceDest": 0.0,
                "newbalanceDest": 50000.0,
                "transaction_type": "TRANSFER"
            }
        }

# Output data model
class PredictionOutput(BaseModel):
    is_fraud: bool
    fraud_probability: float
    confidence_level: str
    risk_factors: list

def preprocess_input(data: TransactionInput):
    """
    Preprocess input data to match the training data format
    """
    # Create feature engineering (same as in training)
    balance_diff_orig = data.oldbalanceOrg - data.newbalanceOrig
    balance_diff_dest = data.newbalanceDest - data.oldbalanceDest
    
    # One-hot encoding for transaction types
    transaction_types = ['CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER']
    type_features = [1 if t == data.transaction_type else 0 for t in transaction_types]
    
    # Create feature vector (matching the training data order)
    # ['amount', 'balanceDiffOrig', 'balanceDiffDest', 'CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER']
    features = [
        data.amount,
        balance_diff_orig,
        balance_diff_dest
    ] + type_features
    
    return np.array(features).reshape(1, -1)

def get_risk_factors(data: TransactionInput, features: np.ndarray) -> list:
    """
    Identify potential risk factors based on transaction patterns
    """
    risk_factors = []
    
    # Check for common fraud patterns from your analysis
    if data.newbalanceOrig == 0 and data.amount > 0:
        risk_factors.append("Account completely drained")
    
    if data.transaction_type in ['TRANSFER', 'CASH_OUT']:
        risk_factors.append("High-risk transaction type")
    
    if data.amount >= 1000000:  # Large amounts
        risk_factors.append("Large transaction amount")
    
    if data.oldbalanceOrg == data.amount:  # Exact balance transfer
        risk_factors.append("Full balance transfer")
    
    # Check for round numbers (potential scripted behavior)
    if data.amount % 10000 == 0:
        risk_factors.append("Round transaction amount")
    
    return risk_factors

@app.get("/")
async def root():
    return {
        "message": "Fraud Detection API", 
        "status": "active",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_status": "loaded" if model is not None else "not_loaded"
    }

@app.post("/predict", response_model=PredictionOutput)
async def predict_fraud(transaction: TransactionInput):
    """
    Predict if a transaction is fraudulent
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Preprocess the input
        features = preprocess_input(transaction)
        
        # Make prediction
        prediction = model.predict(features)[0]
        prediction_proba = model.predict_proba(features)[0]
        
        fraud_probability = prediction_proba[1]  # Probability of fraud (class 1)
        is_fraud = bool(prediction)
        
        # Determine confidence level
        if fraud_probability >= 0.8:
            confidence = "High"
        elif fraud_probability >= 0.6:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        # Get risk factors
        risk_factors = get_risk_factors(transaction, features)
        
        return PredictionOutput(
            is_fraud=is_fraud,
            fraud_probability=round(fraud_probability, 4),
            confidence_level=confidence,
            risk_factors=risk_factors
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict_batch")
async def predict_fraud_batch(transactions: list[TransactionInput]):
    """
    Predict fraud for multiple transactions
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    results = []
    for transaction in transactions:
        try:
            prediction_result = await predict_fraud(transaction)
            results.append({
                "transaction": transaction.dict(),
                "prediction": prediction_result.dict()
            })
        except Exception as e:
            results.append({
                "transaction": transaction.dict(),
                "error": str(e)
            })
    
    return {"predictions": results}
