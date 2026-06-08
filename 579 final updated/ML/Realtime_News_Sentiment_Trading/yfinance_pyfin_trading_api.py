"""
YFinance News Sentiment Trading API
Using pyfin-sentiment for financial sentiment analysis
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pyfin_sentiment.model import SentimentModel
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import warnings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')

# Initialize FastAPI app
app = FastAPI(
    title="YFinance PyFin-Sentiment Trading API",
    description="Get BUY/SELL/HOLD recommendations based on news sentiment analysis using pyfin-sentiment",
    version="1.0.0",
    contact={
        "name": "Trading Bot API",
        "email": "support@tradingbot.com"
    }
)

class TradingAnalyzer:
    def __init__(self, model_size="small"):
        """
        Initialize the trading analyzer with pyfin-sentiment model
        
        Args:
            model_size (str): Model size - 'small' or 'large'
        """
        try:
            logger.info(f"Downloading and loading pyfin-sentiment model ({model_size})...")
            SentimentModel.download(model_size)
            self.sentiment_model = SentimentModel(model_size)
            logger.info("Sentiment model loaded successfully!")
            
            # Sentiment mapping
            self.sentiment_map = {
                '1': {'label': 'positive', 'description': 'Bullish', 'score': 1},
                '2': {'label': 'neutral', 'description': 'Uncertain', 'score': 0},
                '3': {'label': 'negative', 'description': 'Bearish', 'score': -1}
            }
            
        except Exception as e:
            logger.error(f"Error initializing sentiment model: {e}")
            raise e
    
    def get_stock_data(self, symbol: str, period: str = "1mo") -> Dict[str, Any]:
        """
        Get stock data and news using yfinance
        
        Args:
            symbol (str): Stock symbol (e.g., 'AAPL', 'TSLA')
            period (str): Time period for stock data
            
        Returns:
            dict: Stock info, price data, and news
        """
        try:
            # Create ticker object
            ticker = yf.Ticker(symbol)
            
            # Get basic stock info
            stock_info = ticker.info
            
            # Get historical price data
            hist_data = ticker.history(period=period)
            
            # Get news data
            news_data = ticker.news
            
            # Calculate price change
            current_price = stock_info.get('currentPrice', 0)
            previous_close = stock_info.get('previousClose', 0)
            
            if current_price == 0 and len(hist_data) > 0:
                current_price = hist_data['Close'].iloc[-1]
                if len(hist_data) > 1:
                    previous_close = hist_data['Close'].iloc[-2]
            
            return {
                'symbol': symbol,
                'company_name': stock_info.get('longName', symbol),
                'current_price': float(current_price),
                'previous_close': float(previous_close),
                'market_cap': stock_info.get('marketCap', 0),
                'sector': stock_info.get('sector', 'Unknown'),
                'price_data': hist_data,
                'news': news_data,
                'analyst_recommendation': stock_info.get('recommendationKey', 'none')
            }
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {str(e)}")
            raise HTTPException(status_code=404, detail=f"Could not fetch data for {symbol}: {str(e)}")
    
    def analyze_news_sentiment(self, news_data: List[Dict]) -> Dict[str, Any]:
        """
        Analyze sentiment of news articles using pyfin-sentiment
        
        Args:
            news_data (list): List of news articles from yfinance
            
        Returns:
            dict: Sentiment analysis results
        """
        if not news_data:
            return {
                'sentiment_scores': [],
                'overall_sentiment': 0,
                'sentiment_label': 'neutral',
                'bullish_count': 0,
                'bearish_count': 0,
                'neutral_count': 0,
                'news_count': 0,
                'confidence': 0
            }
        
        texts_to_analyze = []
        news_details = []
        
        for article in news_data:
            # Get article title and summary
            title = article.get('title', '')
            summary = article.get('summary', '')
            
            # Combine title and summary for analysis
            text_to_analyze = f"{title}. {summary}" if summary else title
            
            if len(text_to_analyze.strip()) > 10:  # Ensure we have meaningful text
                texts_to_analyze.append(text_to_analyze)
                news_details.append({
                    'title': title,
                    'summary': summary,
                    'published': article.get('providerPublishTime', 0),
                    'publisher': article.get('publisher', 'Unknown'),
                    'url': article.get('link', '')
                })
        
        if not texts_to_analyze:
            return {
                'sentiment_scores': [],
                'overall_sentiment': 0,
                'sentiment_label': 'neutral',
                'bullish_count': 0,
                'bearish_count': 0,
                'neutral_count': 0,
                'news_count': 0,
                'confidence': 0
            }
        
        # Analyze sentiment using pyfin-sentiment
        predictions = self.sentiment_model.predict(texts_to_analyze)
        
        # Process results
        sentiment_scores = []
        bullish_count = 0
        bearish_count = 0
        neutral_count = 0
        
        for i, prediction in enumerate(predictions):
            sentiment_info = self.sentiment_map.get(prediction, self.sentiment_map['2'])
            
            if prediction == '1':
                bullish_count += 1
            elif prediction == '3':
                bearish_count += 1
            else:
                neutral_count += 1
            
            sentiment_scores.append({
                'text': texts_to_analyze[i][:100] + '...' if len(texts_to_analyze[i]) > 100 else texts_to_analyze[i],
                'prediction': prediction,
                'sentiment_label': sentiment_info['label'],
                'sentiment_description': sentiment_info['description'],
                'sentiment_score': sentiment_info['score'],
                'news_detail': news_details[i]
            })
        
        # Calculate overall sentiment
        total_articles = len(predictions)
        if total_articles > 0:
            # Calculate weighted sentiment score
            bullish_ratio = bullish_count / total_articles
            bearish_ratio = bearish_count / total_articles
            overall_sentiment = bullish_ratio - bearish_ratio  # Range: -1 to 1
            
            # Determine overall sentiment label
            if bullish_count > bearish_count:
                sentiment_label = 'bullish'
            elif bearish_count > bullish_count:
                sentiment_label = 'bearish'
            else:
                sentiment_label = 'neutral'
            
            # Calculate confidence based on consensus
            max_count = max(bullish_count, bearish_count, neutral_count)
            confidence = max_count / total_articles
        else:
            overall_sentiment = 0
            sentiment_label = 'neutral'
            confidence = 0
        
        return {
            'sentiment_scores': sentiment_scores,
            'overall_sentiment': float(overall_sentiment),
            'sentiment_label': sentiment_label,
            'bullish_count': bullish_count,
            'bearish_count': bearish_count,
            'neutral_count': neutral_count,
            'news_count': total_articles,
            'confidence': float(confidence)
        }
    
    def calculate_price_momentum(self, price_data: pd.DataFrame) -> float:
        """Calculate price momentum from historical data"""
        if len(price_data) >= 5:
            recent_prices = price_data['Close'].tail(5)
            momentum = (recent_prices.iloc[-1] - recent_prices.iloc[0]) / recent_prices.iloc[0]
            return float(momentum)
        return 0.0
    
    def generate_trading_recommendation(self, symbol: str) -> Dict[str, Any]:
        """
        Generate BUY/SELL/HOLD recommendation based on sentiment analysis
        
        Args:
            symbol (str): Stock symbol
            
        Returns:
            dict: Complete analysis with trading recommendation
        """
        # Get stock data and news
        stock_data = self.get_stock_data(symbol)
        
        # Analyze news sentiment
        sentiment_analysis = self.analyze_news_sentiment(stock_data['news'])
        
        # Calculate price momentum
        price_momentum = self.calculate_price_momentum(stock_data['price_data'])
        
        # Calculate price change
        price_change = stock_data['current_price'] - stock_data['previous_close']
        price_change_percent = (price_change / stock_data['previous_close']) * 100 if stock_data['previous_close'] > 0 else 0
        
        # Generate recommendation
        recommendation = self._make_trading_decision(sentiment_analysis, price_momentum, stock_data)
        
        return {
            'symbol': symbol,
            'company_name': stock_data['company_name'],
            'current_price': stock_data['current_price'],
            'previous_close': stock_data['previous_close'],
            'price_change': float(price_change),
            'price_change_percent': float(price_change_percent),
            'sector': stock_data['sector'],
            'market_cap': stock_data['market_cap'],
            'sentiment_analysis': sentiment_analysis,
            'price_momentum': float(price_momentum),
            'recommendation': recommendation,
            'analyst_recommendation': stock_data['analyst_recommendation'],
            'timestamp': datetime.now().isoformat()
        }
    
    def _make_trading_decision(self, sentiment_analysis: Dict, price_momentum: float, stock_data: Dict) -> Dict[str, Any]:
        """
        Make trading decision based on sentiment and other factors
        """
        sentiment_score = sentiment_analysis['overall_sentiment']
        confidence = sentiment_analysis['confidence']
        news_count = sentiment_analysis['news_count']
        bullish_count = sentiment_analysis['bullish_count']
        bearish_count = sentiment_analysis['bearish_count']
        
        # Decision factors
        strong_bullish = sentiment_score > 0.3 and confidence > 0.6 and bullish_count >= 2
        moderate_bullish = sentiment_score > 0.1 and bullish_count > bearish_count
        strong_bearish = sentiment_score < -0.3 and confidence > 0.6 and bearish_count >= 2
        moderate_bearish = sentiment_score < -0.1 and bearish_count > bullish_count
        
        positive_momentum = price_momentum > 0.02  # 2% price increase
        negative_momentum = price_momentum < -0.02  # 2% price decrease
        sufficient_news = news_count >= 2  # At least 2 news articles
        
        # Trading logic with enhanced decision making
        if strong_bullish and positive_momentum and sufficient_news:
            decision = "STRONG BUY"
            confidence_level = "Very High"
            reason = f"Strong bullish sentiment ({bullish_count} bullish vs {bearish_count} bearish) with positive price momentum"
            
        elif strong_bullish and sufficient_news:
            decision = "BUY"
            confidence_level = "High"
            reason = f"Strong bullish sentiment in {news_count} news articles"
            
        elif moderate_bullish and positive_momentum:
            decision = "WEAK BUY"
            confidence_level = "Medium"
            reason = f"Moderate bullish sentiment with positive price momentum"
            
        elif strong_bearish and negative_momentum and sufficient_news:
            decision = "STRONG SELL"
            confidence_level = "Very High"
            reason = f"Strong bearish sentiment ({bearish_count} bearish vs {bullish_count} bullish) with negative price momentum"
            
        elif strong_bearish and sufficient_news:
            decision = "SELL"
            confidence_level = "High"
            reason = f"Strong bearish sentiment in {news_count} news articles"
            
        elif moderate_bearish and negative_momentum:
            decision = "WEAK SELL"
            confidence_level = "Medium"
            reason = f"Moderate bearish sentiment with negative price momentum"
            
        elif moderate_bullish and not negative_momentum:
            decision = "WEAK BUY"
            confidence_level = "Low"
            reason = f"Slight bullish bias in news sentiment"
            
        elif moderate_bearish and not positive_momentum:
            decision = "WEAK SELL"
            confidence_level = "Low"
            reason = f"Slight bearish bias in news sentiment"
            
        else:
            decision = "HOLD"
            confidence_level = "Medium"
            reason = "Neutral sentiment or conflicting signals suggest holding position"
        
        return {
            'decision': decision,
            'confidence_level': confidence_level,
            'reason': reason,
            'sentiment_score': sentiment_score,
            'price_momentum': price_momentum,
            'factors': {
                'strong_bullish': strong_bullish,
                'moderate_bullish': moderate_bullish,
                'strong_bearish': strong_bearish,
                'moderate_bearish': moderate_bearish,
                'positive_momentum': positive_momentum,
                'negative_momentum': negative_momentum,
                'sufficient_news': sufficient_news,
                'news_sentiment_ratio': f"{bullish_count}B/{bearish_count}B/{sentiment_analysis['neutral_count']}N"
            }
        }

# Initialize the trading analyzer globally
analyzer = TradingAnalyzer()

# Pydantic models for request/response
class TradingRecommendationResponse(BaseModel):
    symbol: str
    company_name: str
    current_price: float
    price_change: float
    price_change_percent: float
    recommendation: Dict[str, Any]
    sentiment_analysis: Dict[str, Any]
    timestamp: str

class MultiStockRequest(BaseModel):
    symbols: List[str]

class SentimentOnlyResponse(BaseModel):
    symbol: str
    sentiment_analysis: Dict[str, Any]
    news_count: int

# API Routes
@app.get("/", tags=["Health"])
async def root():
    """Welcome endpoint"""
    return {
        "message": "YFinance PyFin-Sentiment Trading API",
        "version": "1.0.0",
        "description": "Get BUY/SELL/HOLD recommendations based on financial news sentiment analysis",
        "endpoints": {
            "analyze": "/analyze/{symbol}",
            "sentiment": "/sentiment/{symbol}",
            "multiple": "/analyze-multiple",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": hasattr(analyzer, 'sentiment_model')
    }

@app.get("/analyze/{symbol}", response_model=TradingRecommendationResponse, tags=["Trading Analysis"])
async def analyze_stock(symbol: str):
    """
    Analyze a single stock and get trading recommendation
    
    - **symbol**: Stock symbol (e.g., AAPL, TSLA, GOOGL)
    
    Returns complete analysis with BUY/SELL/HOLD recommendation
    """
    try:
        symbol = symbol.upper()
        logger.info(f"Analyzing stock: {symbol}")
        result = analyzer.generate_trading_recommendation(symbol)
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/analyze-multiple", tags=["Trading Analysis"])
async def analyze_multiple_stocks(request: MultiStockRequest):
    """
    Analyze multiple stocks (max 10)
    
    - **symbols**: List of stock symbols
    
    Returns analysis for each valid symbol
    """
    try:
        results = []
        errors = []
        
        # Limit to 10 stocks to prevent abuse
        symbols_to_process = request.symbols[:10]
        
        for symbol in symbols_to_process:
            try:
                symbol = symbol.upper()
                result = analyzer.generate_trading_recommendation(symbol)
                results.append(result)
                logger.info(f"Successfully analyzed {symbol}")
                
            except Exception as e:
                error_msg = f"Error analyzing {symbol}: {str(e)}"
                logger.error(error_msg)
                errors.append({
                    'symbol': symbol,
                    'error': str(e)
                })
        
        return {
            "results": results,
            "errors": errors,
            "successful_count": len(results),
            "error_count": len(errors),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/sentiment/{symbol}", response_model=SentimentOnlyResponse, tags=["Sentiment Analysis"])
async def get_sentiment_only(symbol: str):
    """
    Get only sentiment analysis for a stock (no trading recommendation)
    
    - **symbol**: Stock symbol (e.g., AAPL, TSLA, GOOGL)
    
    Returns detailed sentiment analysis of recent news
    """
    try:
        symbol = symbol.upper()
        logger.info(f"Getting sentiment for: {symbol}")
        
        stock_data = analyzer.get_stock_data(symbol)
        sentiment_analysis = analyzer.analyze_news_sentiment(stock_data['news'])
        
        return {
            'symbol': symbol,
            'sentiment_analysis': sentiment_analysis,
            'news_count': len(stock_data['news'])
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sentiment for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/news/{symbol}", tags=["News Analysis"])
async def get_news_analysis(symbol: str):
    """
    Get detailed news analysis with individual article sentiments
    
    - **symbol**: Stock symbol (e.g., AAPL, TSLA, GOOGL)
    
    Returns news articles with individual sentiment scores
    """
    try:
        symbol = symbol.upper()
        logger.info(f"Getting news analysis for: {symbol}")
        
        stock_data = analyzer.get_stock_data(symbol)
        sentiment_analysis = analyzer.analyze_news_sentiment(stock_data['news'])
        
        return {
            'symbol': symbol,
            'company_name': stock_data['company_name'],
            'news_analysis': sentiment_analysis['sentiment_scores'],
            'summary': {
                'total_articles': sentiment_analysis['news_count'],
                'bullish_articles': sentiment_analysis['bullish_count'],
                'bearish_articles': sentiment_analysis['bearish_count'],
                'neutral_articles': sentiment_analysis['neutral_count'],
                'overall_sentiment': sentiment_analysis['sentiment_label'],
                'confidence': sentiment_analysis['confidence']
            },
            'timestamp': datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting news analysis for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Run the application
