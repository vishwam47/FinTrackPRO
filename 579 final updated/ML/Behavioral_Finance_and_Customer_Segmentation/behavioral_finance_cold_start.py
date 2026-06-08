from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import requests
import os
from textblob import TextBlob
import yfinance as yf
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import json
import asyncio

app = FastAPI(
    title="Behavioral Finance & Customer Segmentation API",
    description="Cold start implementation using APIs and external data",
    version="1.0.0"
)

# Pydantic models
class CustomerProfile(BaseModel):
    user_id: str
    age: Optional[int] = None
    income_range: Optional[str] = None
    location: Optional[str] = None
    risk_tolerance: Optional[str] = None
    financial_goals: List[str] = []

class TransactionData(BaseModel):
    user_id: str
    amount: float
    category: str
    date: str
    description: Optional[str] = None

class SentimentRequest(BaseModel):
    text: str
    source: Optional[str] = "feedback"

class MarketSentimentResponse(BaseModel):
    symbol: str
    sentiment_score: float
    sentiment_label: str
    volume: int
    price_change: float

class CustomerSegmentResponse(BaseModel):
    user_id: str
    segment: str
    characteristics: Dict[str, Any]
    recommendations: List[str]

class BehavioralInsights(BaseModel):
    user_id: str
    risk_profile: str
    spending_pattern: str
    investment_preference: str
    behavioral_score: float

# Cold start behavioral finance analyzer
class ColdStartBehavioralAnalyzer:
    def __init__(self):
        self.customer_data = {}  # In-memory storage (use database in production)
        self.transaction_history = {}
        self.scaler = StandardScaler()
        
        # Default customer segments for cold start
        self.default_segments = {
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
        }
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using TextBlob (free, no API key needed)"""
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        if polarity > 0.1:
            label = "positive"
        elif polarity < -0.1:
            label = "negative"
        else:
            label = "neutral"
            
        return {
            "sentiment_score": polarity,
            "sentiment_label": label,
            "subjectivity": subjectivity,
            "confidence": abs(polarity)
        }
    
    def get_market_sentiment(self, symbol: str) -> Dict[str, Any]:
        """Get market data and derive sentiment from price movements"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")
            
            if len(hist) < 2:
                raise HTTPException(status_code=404, detail="Insufficient market data")
            
            # Calculate price change and volume
            price_change = (hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2] * 100
            volume = int(hist['Volume'].iloc[-1])
            
            # Derive sentiment from price movement
            if price_change > 2:
                sentiment_label = "very_positive"
                sentiment_score = 0.8
            elif price_change > 0:
                sentiment_label = "positive"
                sentiment_score = 0.4
            elif price_change < -2:
                sentiment_label = "very_negative"
                sentiment_score = -0.8
            elif price_change < 0:
                sentiment_label = "negative"
                sentiment_score = -0.4
            else:
                sentiment_label = "neutral"
                sentiment_score = 0.0
                
            return {
                "symbol": symbol,
                "sentiment_score": sentiment_score,
                "sentiment_label": sentiment_label,
                "volume": volume,
                "price_change": round(price_change, 2),
                "current_price": round(hist['Close'].iloc[-1], 2)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching market data: {str(e)}")
    
    def assign_segment_by_rules(self, profile: CustomerProfile) -> str:
        """Rule-based segmentation for cold start (no ML model needed yet)"""
        age = profile.age or 30
        risk_tolerance = profile.risk_tolerance or "medium"
        income_range = profile.income_range or "medium"
        
        # Simple rule-based logic
        if risk_tolerance == "low" or age > 55:
            return "conservative_saver"
        elif risk_tolerance == "high" and age < 35:
            return "aggressive_trader"
        elif not profile.financial_goals:
            return "beginner"
        else:
            return "balanced_investor"
    
    def generate_behavioral_insights(self, user_id: str) -> Dict[str, Any]:
        """Generate insights using available data + external APIs"""
        profile = self.customer_data.get(user_id, {})
        transactions = self.transaction_history.get(user_id, [])
        
        # Default insights for new users
        if not transactions:
            return {
                "risk_profile": profile.get("risk_tolerance", "unknown"),
                "spending_pattern": "insufficient_data",
                "investment_preference": "to_be_determined",
                "behavioral_score": 0.5,
                "recommendations": [
                    "Complete financial assessment",
                    "Start with small investments",
                    "Use educational resources"
                ]
            }
        
        # Analyze spending if transactions exist
        total_spending = sum(t["amount"] for t in transactions if t["amount"] > 0)
        avg_transaction = total_spending / len(transactions) if transactions else 0
        
        # Categorize spending behavior
        if avg_transaction > 1000:
            spending_pattern = "high_spender"
        elif avg_transaction > 100:
            spending_pattern = "moderate_spender"
        else:
            spending_pattern = "conservative_spender"
        
        return {
            "risk_profile": profile.get("risk_tolerance", "medium"),
            "spending_pattern": spending_pattern,
            "investment_preference": "balanced",  # Default until more data
            "behavioral_score": min(0.8, 0.3 + len(transactions) * 0.1),
            "total_transactions": len(transactions),
            "avg_transaction_amount": round(avg_transaction, 2)
        }
    
    def train_model_when_ready(self):
        """Future: Train custom models when enough data is available"""
        if len(self.customer_data) < 100:  # Need minimum data
            return {"status": "insufficient_data", "required_customers": 100}
        
        # This will be implemented later when you have customer data
        return {"status": "ready_for_training", "customers": len(self.customer_data)}

# Initialize analyzer
analyzer = ColdStartBehavioralAnalyzer()

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "Behavioral Finance & Customer Segmentation API",
        "status": "cold_start_mode",
        "description": "Using APIs and rule-based logic until sufficient customer data is collected"
    }

@app.post("/customer/profile", response_model=Dict[str, Any])
async def create_customer_profile(profile: CustomerProfile):
    """Create or update customer profile"""
    analyzer.customer_data[profile.user_id] = profile.dict()
    
    # Assign initial segment using rule-based approach
    segment = analyzer.assign_segment_by_rules(profile)
    segment_info = analyzer.default_segments[segment]
    
    return {
        "user_id": profile.user_id,
        "segment": segment,
        "characteristics": segment_info["characteristics"],
        "recommendations": segment_info["recommendations"],
        "status": "profile_created"
    }

@app.post("/analyze/sentiment", response_model=Dict[str, Any])
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of customer feedback/text"""
    result = analyzer.analyze_sentiment(request.text)
    result["source"] = request.source
    result["analyzed_at"] = datetime.now().isoformat()
    return result

@app.get("/market/sentiment/{symbol}", response_model=MarketSentimentResponse)
async def get_market_sentiment(symbol: str):
    """Get market sentiment for a stock symbol"""
    result = analyzer.get_market_sentiment(symbol.upper())
    return MarketSentimentResponse(**result)

@app.post("/customer/transaction")
async def add_transaction(transaction: TransactionData):
    """Add customer transaction for behavioral analysis"""
    user_id = transaction.user_id
    
    if user_id not in analyzer.transaction_history:
        analyzer.transaction_history[user_id] = []
    
    analyzer.transaction_history[user_id].append(transaction.dict())
    
    return {
        "status": "transaction_added",
        "user_id": user_id,
        "total_transactions": len(analyzer.transaction_history[user_id])
    }

@app.get("/customer/{user_id}/insights", response_model=BehavioralInsights)
async def get_behavioral_insights(user_id: str):
    """Get behavioral insights for a customer"""
    if user_id not in analyzer.customer_data:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    insights = analyzer.generate_behavioral_insights(user_id)
    
    return BehavioralInsights(
        user_id=user_id,
        risk_profile=insights["risk_profile"],
        spending_pattern=insights["spending_pattern"],
        investment_preference=insights["investment_preference"],
        behavioral_score=insights["behavioral_score"]
    )

@app.get("/customer/{user_id}/segment", response_model=CustomerSegmentResponse)
async def get_customer_segment(user_id: str):
    """Get customer segment and recommendations"""
    if user_id not in analyzer.customer_data:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    profile_data = analyzer.customer_data[user_id]
    profile = CustomerProfile(**profile_data)
    segment = analyzer.assign_segment_by_rules(profile)
    segment_info = analyzer.default_segments[segment]
    
    return CustomerSegmentResponse(
        user_id=user_id,
        segment=segment,
        characteristics={
            "segment_type": segment,
            "traits": segment_info["characteristics"],
            "profile_completeness": len([v for v in profile_data.values() if v]) / 6
        },
        recommendations=segment_info["recommendations"]
    )

@app.get("/analytics/overview")
async def get_analytics_overview():
    """Get overall analytics and readiness for ML model training"""
    total_customers = len(analyzer.customer_data)
    total_transactions = sum(len(transactions) for transactions in analyzer.transaction_history.values())
    
    # Segment distribution
    segment_distribution = {}
    for user_id, profile_data in analyzer.customer_data.items():
        profile = CustomerProfile(**profile_data)
        segment = analyzer.assign_segment_by_rules(profile)
        segment_distribution[segment] = segment_distribution.get(segment, 0) + 1
    
    # Check readiness for ML training
    ml_readiness = analyzer.train_model_when_ready()
    
    return {
        "total_customers": total_customers,
        "total_transactions": total_transactions,
        "segment_distribution": segment_distribution,
        "ml_model_readiness": ml_readiness,
        "data_collection_progress": {
            "customers_needed_for_ml": 100,
            "current_customers": total_customers,
            "progress_percentage": min(100, (total_customers / 100) * 100)
        }
    }

@app.get("/segments/available")
async def get_available_segments():
    """Get all available customer segments and their descriptions"""
    return {
        "segments": analyzer.default_segments,
        "total_segments": len(analyzer.default_segments),
        "segmentation_method": "rule_based"
    }

@app.post("/market/bulk-sentiment")
async def get_bulk_market_sentiment(symbols: List[str]):
    """Get market sentiment for multiple symbols"""
    results = []
    for symbol in symbols[:10]:  # Limit to 10 symbols to avoid rate limits
        try:
            sentiment = analyzer.get_market_sentiment(symbol)
            results.append(sentiment)
        except:
            results.append({
                "symbol": symbol,
                "error": "Could not fetch data",
                "sentiment_score": 0,
                "sentiment_label": "unknown"
            })
    
    return {"results": results, "analyzed_symbols": len(results)}

# Placeholder for future ML model training endpoint
@app.post("/ml/train-models")
async def trigger_model_training():
    """Future endpoint: Train custom ML models when enough data is available"""
    readiness = analyzer.train_model_when_ready()
    
    if readiness["status"] == "insufficient_data":
        return {
            "status": "training_not_ready",
            "message": f"Need at least {readiness['required_customers']} customers to train models",
            "current_customers": len(analyzer.customer_data)
        }
    
    # TODO: Implement actual model training when ready
    return {
        "status": "training_scheduled",
        "message": "Custom ML model training will be implemented when sufficient data is available",
        "estimated_training_time": "2-4 hours",
        "models_to_train": ["customer_segmentation", "churn_prediction", "risk_profiling"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)