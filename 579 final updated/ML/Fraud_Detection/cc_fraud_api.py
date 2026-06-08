from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pickle
import pandas as pd
import numpy as np
from typing import Optional

# Initialize FastAPI app
app = FastAPI(title="Credit Card Fraud Detection API", version="1.0.0")

# Load the trained model
try:
    model = joblib.load('Fraud_Detection/fraud_detection_model.pkl')
    with open('Fraud_Detection/feature_columns.pkl', 'rb') as f:
        feature_columns = pickle.load(f)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    feature_columns = None

# Define input data model
class TransactionData(BaseModel):
    amt: float
    gender: int  # 0 for Female, 1 for Male
    city_pop: int
    age: float
    trans_month: int  # 1-12
    trans_year: int
    latitudinal_distance: float
    longitudinal_distance: float
    # Category features (0 or 1 for each)
    category_food_dining: int = 0
    category_gas_transport: int = 0
    category_grocery_net: int = 0
    category_grocery_pos: int = 0
    category_health_fitness: int = 0
    category_home: int = 0
    category_kids_pets: int = 0
    category_misc_net: int = 0
    category_misc_pos: int = 0
    category_personal_care: int = 0
    category_shopping_net: int = 0
    category_shopping_pos: int = 0
    category_travel: int = 0

# Define response model
class PredictionResponse(BaseModel):
    is_fraud: int
    fraud_probability: float
    prediction_text: str

@app.get("/")
async def root():
    return {"message": "Credit Card Fraud Detection API", "status": "running"}

@app.get("/health")
async def health_check():
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    return {"status": "healthy", "model_loaded": True}

@app.post("/predict", response_model=PredictionResponse)
async def predict_fraud(transaction: TransactionData):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Convert input to DataFrame
        input_data = pd.DataFrame([transaction.dict()])
        
        # Ensure columns are in the correct order
        input_data = input_data[feature_columns]
        
        # Make prediction
        prediction = model.predict(input_data)[0]
        
        # Get prediction probability
        prediction_proba = model.predict_proba(input_data)[0]
        fraud_probability = prediction_proba[1]  # Probability of fraud (class 1)
        
        # Create response
        prediction_text = "Fraudulent Transaction" if prediction == 1 else "Legitimate Transaction"
        
        return PredictionResponse(
            is_fraud=int(prediction),
            fraud_probability=float(fraud_probability),
            prediction_text=prediction_text
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "model_type": type(model).__name__,
        "feature_count": len(feature_columns),
        "features": feature_columns
    }

# Example endpoint for batch predictions
@app.post("/predict-batch")
async def predict_batch(transactions: list[TransactionData]):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Convert all transactions to DataFrame
        input_data = pd.DataFrame([t.dict() for t in transactions])
        input_data = input_data[feature_columns]
        
        # Make predictions
        predictions = model.predict(input_data)
        probabilities = model.predict_proba(input_data)
        
        results = []
        for i, (pred, prob) in enumerate(zip(predictions, probabilities)):
            results.append({
                "transaction_id": i,
                "is_fraud": int(pred),
                "fraud_probability": float(prob[1]),
                "prediction_text": "Fraudulent Transaction" if pred == 1 else "Legitimate Transaction"
            })
        
        return {"predictions": results}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch prediction error: {str(e)}")
