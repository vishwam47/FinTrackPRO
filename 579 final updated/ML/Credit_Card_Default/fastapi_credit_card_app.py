from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import pickle
import joblib
import os
from typing import Dict, List, Optional
import tensorflow as tf
from tensorflow import keras
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Credit Card Default Prediction API",
    description="Predict credit card payment default using machine learning",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and preprocessor
model = None
scaler = None
model_info = None
feature_names = None

class CreditCardInput(BaseModel):
    """Input model for credit card default prediction"""
    LIMIT_BAL: float = Field(..., description="Amount of given credit in NT dollars")
    SEX: int = Field(..., description="Gender (1=male, 2=female)", ge=1, le=2)
    EDUCATION: int = Field(..., description="Education (1=graduate, 2=university, 3=high school, 4=others)", ge=1, le=4)
    MARRIAGE: int = Field(..., description="Marital status (1=married, 2=single, 3=others)", ge=1, le=3)
    AGE: int = Field(..., description="Age in years", ge=18, le=100)
    PAY_0: int = Field(..., description="Repayment status in September")
    PAY_2: int = Field(..., description="Repayment status in August")
    PAY_3: int = Field(..., description="Repayment status in July")
    PAY_4: int = Field(..., description="Repayment status in June")
    PAY_5: int = Field(..., description="Repayment status in May")
    PAY_6: int = Field(..., description="Repayment status in April")
    BILL_AMT1: float = Field(..., description="Bill amount in September (NT dollar)")
    BILL_AMT2: float = Field(..., description="Bill amount in August (NT dollar)")
    BILL_AMT3: float = Field(..., description="Bill amount in July (NT dollar)")
    BILL_AMT4: float = Field(..., description="Bill amount in June (NT dollar)")
    BILL_AMT5: float = Field(..., description="Bill amount in May (NT dollar)")
    BILL_AMT6: float = Field(..., description="Bill amount in April (NT dollar)")
    PAY_AMT1: float = Field(..., description="Previous payment in September (NT dollar)")
    PAY_AMT2: float = Field(..., description="Previous payment in August (NT dollar)")
    PAY_AMT3: float = Field(..., description="Previous payment in July (NT dollar)")
    PAY_AMT4: float = Field(..., description="Previous payment in June (NT dollar)")
    PAY_AMT5: float = Field(..., description="Previous payment in May (NT dollar)")
    PAY_AMT6: float = Field(..., description="Previous payment in April (NT dollar)")

class SimplifiedInput(BaseModel):
    """Simplified input model for quick predictions"""
    LIMIT_BAL: float = Field(..., description="Credit limit amount", example=50000)
    AGE: int = Field(..., description="Age in years", ge=18, le=100, example=30)
    SEX: int = Field(..., description="Gender (1=male, 2=female)", ge=1, le=2, example=2)
    EDUCATION: int = Field(..., description="Education level (1=graduate, 2=university, 3=high school, 4=others)", ge=1, le=4, example=2)
    MARRIAGE: int = Field(..., description="Marital status (1=married, 2=single, 3=others)", ge=1, le=3, example=1)
    BILL_AMT1: float = Field(..., description="Most recent bill amount", example=3000)
    PAY_AMT1: float = Field(..., description="Most recent payment amount", example=2000)

class PredictionResponse(BaseModel):
    """Response model for predictions"""
    prediction: int
    prediction_label: str
    probability: float
    risk_level: str
    model_used: str
    confidence: str

def load_models():
    """Load the trained model and preprocessor"""
    global model, scaler, model_info, feature_names
    
    try:
        # Load scaler
        if os.path.exists('credit_card_scaler.pkl'):
            scaler = joblib.load('credit_card_scaler.pkl')
            print("✅ Scaler loaded successfully")
        else:
            raise FileNotFoundError("Scaler file not found")
        
        # Load model info
        if os.path.exists('model_info.pkl'):
            with open('model_info.pkl', 'rb') as f:
                model_info = pickle.load(f)
            print(f"✅ Model info loaded: {model_info}")
        else:
            raise FileNotFoundError("Model info file not found")
        
        # Load feature names
        if os.path.exists('feature_names.pkl'):
            with open('feature_names.pkl', 'rb') as f:
                feature_names = pickle.load(f)
            print(f"✅ Feature names loaded: {len(feature_names)} features")
        else:
            raise FileNotFoundError("Feature names file not found")
        
        # Load the appropriate model
        if model_info['model_type'] == 'deep_learning':
            if os.path.exists('best_model_deep_learning.h5'):
                model = keras.models.load_model('best_model_deep_learning.h5')
                print("✅ Deep Learning model loaded successfully")
            else:
                raise FileNotFoundError("Deep Learning model file not found")
        else:
            # Load traditional ML model
            model_file = f"best_model_{model_info['model_name'].lower().replace(' ', '_')}.pkl"
            if os.path.exists(model_file):
                model = joblib.load(model_file)
                print(f"✅ {model_info['model_name']} model loaded successfully")
            else:
                raise FileNotFoundError(f"Model file {model_file} not found")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading models: {str(e)}")
        return False

def preprocess_input(data: dict) -> np.ndarray:
    """Preprocess input data for prediction"""
    try:
        # Create DataFrame with the correct feature order
        df = pd.DataFrame([data])
        
        # Ensure all required features are present
        missing_features = set(feature_names) - set(df.columns)
        if missing_features:
            # Fill missing features with default values
            for feature in missing_features:
                if 'PAY_' in feature:
                    df[feature] = 0  # Default payment status
                elif 'BILL_AMT' in feature:
                    df[feature] = 0  # Default bill amount
                elif 'PAY_AMT' in feature:
                    df[feature] = 0  # Default payment amount
                else:
                    df[feature] = 0
        
        # Reorder columns to match training data
        df = df[feature_names]
        
        # Scale the features
        scaled_data = scaler.transform(df)
        
        return scaled_data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error preprocessing data: {str(e)}")

def make_prediction(scaled_data: np.ndarray) -> dict:
    """Make prediction using the loaded model"""
    try:
        if model_info['model_type'] == 'deep_learning':
            # Deep learning prediction
            prediction_prob = model.predict(scaled_data, verbose=0)[0][0]
            prediction = int(prediction_prob > 0.5)
        else:
            # Traditional ML prediction
            prediction = model.predict(scaled_data)[0]
            prediction_prob = model.predict_proba(scaled_data)[0][1]
        
        # Create response
        prediction_label = "Default" if prediction == 1 else "No Default"
        
        # Determine risk level
        if prediction_prob < 0.3:
            risk_level = "Low Risk"
            confidence = "High"
        elif prediction_prob < 0.7:
            risk_level = "Medium Risk"
            confidence = "Medium"
        else:
            risk_level = "High Risk"
            confidence = "High"
        
        return {
            "prediction": prediction,
            "prediction_label": prediction_label,
            "probability": float(prediction_prob),
            "risk_level": risk_level,
            "model_used": model_info['model_name'],
            "confidence": confidence
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Load models when the API starts"""
    success = load_models()
    if not success:
        print("⚠️ Warning: Models not loaded. Some endpoints may not work.")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Credit Card Default Prediction API",
        "status": "active",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "model_info": model_info
    }

@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    if model_info is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_info": model_info,
        "feature_count": len(feature_names) if feature_names else 0,
        "features": feature_names
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_default(input_data: CreditCardInput):
    """Predict credit card default using full feature set"""
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Convert input to dictionary
        data_dict = input_data.dict()
        
        # Preprocess the data
        scaled_data = preprocess_input(data_dict)
        
        # Make prediction
        result = make_prediction(scaled_data)
        
        return PredictionResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict-simple", response_model=PredictionResponse)
async def predict_default_simple(input_data: SimplifiedInput):
    """Predict credit card default using simplified input"""
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Convert simplified input to full feature set with defaults
        data_dict = {
            'LIMIT_BAL': input_data.LIMIT_BAL,
            'SEX': input_data.SEX,
            'EDUCATION': input_data.EDUCATION,
            'MARRIAGE': input_data.MARRIAGE,
            'AGE': input_data.AGE,
            'PAY_0': 0,  # Default values
            'PAY_2': 0,
            'PAY_3': 0,
            'PAY_4': 0,
            'PAY_5': 0,
            'PAY_6': 0,
            'BILL_AMT1': input_data.BILL_AMT1,
            'BILL_AMT2': input_data.BILL_AMT1 * 0.9,  # Estimate based on recent bill
            'BILL_AMT3': input_data.BILL_AMT1 * 0.8,
            'BILL_AMT4': input_data.BILL_AMT1 * 0.7,
            'BILL_AMT5': input_data.BILL_AMT1 * 0.6,
            'BILL_AMT6': input_data.BILL_AMT1 * 0.5,
            'PAY_AMT1': input_data.PAY_AMT1,
            'PAY_AMT2': input_data.PAY_AMT1 * 0.9,  # Estimate based on recent payment
            'PAY_AMT3': input_data.PAY_AMT1 * 0.8,
            'PAY_AMT4': input_data.PAY_AMT1 * 0.7,
            'PAY_AMT5': input_data.PAY_AMT1 * 0.6,
            'PAY_AMT6': input_data.PAY_AMT1 * 0.5,
        }
        
        # Preprocess the data
        scaled_data = preprocess_input(data_dict)
        
        # Make prediction
        result = make_prediction(scaled_data)
        
        return PredictionResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict-batch")
async def predict_batch(input_data: List[CreditCardInput]):
    """Predict multiple records at once"""
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if len(input_data) > 100:
        raise HTTPException(status_code=400, detail="Batch size too large (max 100)")
    
    try:
        results = []
        for data in input_data:
            data_dict = data.dict()
            scaled_data = preprocess_input(data_dict)
            result = make_prediction(scaled_data)
            results.append(result)
        
        return {"predictions": results, "count": len(results)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@app.get("/feature-info")
async def get_feature_info():
    """Get information about required features"""
    if feature_names is None:
        raise HTTPException(status_code=503, detail="Feature information not loaded")
    
    feature_descriptions = {
        'LIMIT_BAL': 'Amount of given credit in NT dollars',
        'SEX': 'Gender (1=male, 2=female)',
        'EDUCATION': 'Education (1=graduate, 2=university, 3=high school, 4=others)',
        'MARRIAGE': 'Marital status (1=married, 2=single, 3=others)',
        'AGE': 'Age in years',
        'PAY_0': 'Repayment status in September (-1=pay duly, 1=payment delay for one month, etc.)',
        'PAY_2': 'Repayment status in August',
        'PAY_3': 'Repayment status in July',
        'PAY_4': 'Repayment status in June',
        'PAY_5': 'Repayment status in May',
        'PAY_6': 'Repayment status in April',
        'BILL_AMT1': 'Amount of bill statement in September (NT dollar)',
        'BILL_AMT2': 'Amount of bill statement in August (NT dollar)',
        'BILL_AMT3': 'Amount of bill statement in July (NT dollar)',
        'BILL_AMT4': 'Amount of bill statement in June (NT dollar)',
        'BILL_AMT5': 'Amount of bill statement in May (NT dollar)',
        'BILL_AMT6': 'Amount of bill statement in April (NT dollar)',
        'PAY_AMT1': 'Amount of previous payment in September (NT dollar)',
        'PAY_AMT2': 'Amount of previous payment in August (NT dollar)',
        'PAY_AMT3': 'Amount of previous payment in July (NT dollar)',
        'PAY_AMT4': 'Amount of previous payment in June (NT dollar)',
        'PAY_AMT5': 'Amount of previous payment in May (NT dollar)',
        'PAY_AMT6': 'Amount of previous payment in April (NT dollar)'
    }
    
    return {
        "features": [
            {
                "name": feature,
                "description": feature_descriptions.get(feature, "No description available")
            }
            for feature in feature_names
        ],
        "total_features": len(feature_names)
    }
