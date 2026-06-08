from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
import logging
import os
import json
import uuid
import asyncio
from enum import Enum
import warnings
warnings.filterwarnings('ignore')

# Core libraries
import numpy as np
import pandas as pd
from scipy import optimize
import yfinance as yf
from fredapi import Fred

# Portfolio optimization libraries
from pypfopt import EfficientFrontier, risk_models, expected_returns, discrete_allocation
from pypfopt.hierarchical_portfolio import HRPOpt
from pypfopt.risk_models import CovarianceShrinkage
from pypfopt.black_litterman import BlackLittermanModel
from pypfopt import objective_functions

# Risk management libraries
import empyrical
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Backtesting (optional - can be installed separately)
try:
    import zipline
    ZIPLINE_AVAILABLE = True
except ImportError:
    ZIPLINE_AVAILABLE = False
    print("Zipline not available - backtesting features will be limited")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Risk Management & Portfolio Optimization API",
    description="Advanced portfolio optimization, risk analysis, and performance analytics",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
class Settings:
    FRED_API_KEY = os.getenv("FRED_API_KEY", "your-fred-api-key")
    DATA_DIR = "data/portfolio"
    RISK_FREE_RATE = 0.02  # Default 2% risk-free rate

settings = Settings()

# Create data directory
os.makedirs(settings.DATA_DIR, exist_ok=True)

# Initialize FRED API
try:
    fred = Fred(api_key=settings.FRED_API_KEY)
    FRED_AVAILABLE = True
except:
    FRED_AVAILABLE = False
    logger.warning("FRED API not available - using default risk-free rates")

# Pydantic Models
class OptimizationMethod(str, Enum):
    MAX_SHARPE = "max_sharpe"
    MIN_VOLATILITY = "min_volatility"
    MAX_QUADRATIC_UTILITY = "max_quadratic_utility"
    EFFICIENT_RISK = "efficient_risk"
    EFFICIENT_RETURN = "efficient_return"
    BLACK_LITTERMAN = "black_litterman"
    HIERARCHICAL_RISK_PARITY = "hrp"
    RISK_PARITY = "risk_parity"

class RiskMetric(str, Enum):
    SHARPE_RATIO = "sharpe_ratio"
    SORTINO_RATIO = "sortino_ratio"
    CALMAR_RATIO = "calmar_ratio"
    MAX_DRAWDOWN = "max_drawdown"
    VALUE_AT_RISK = "var"
    CONDITIONAL_VAR = "cvar"
    BETA = "beta"
    ALPHA = "alpha"
    VOLATILITY = "volatility"

class AssetInput(BaseModel):
    symbol: str = Field(..., description="Asset ticker symbol")
    weight: Optional[float] = Field(None, ge=0, le=1, description="Portfolio weight (optional)")
    expected_return: Optional[float] = Field(None, description="Expected annual return (optional)")

class PortfolioOptimizationRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    assets: List[AssetInput] = Field(..., min_items=2, max_items=50)
    optimization_method: OptimizationMethod = OptimizationMethod.MAX_SHARPE
    target_return: Optional[float] = Field(None, ge=0, description="Target return for efficient risk")
    target_risk: Optional[float] = Field(None, ge=0, description="Target risk for efficient return")
    risk_aversion: float = Field(1.0, ge=0, description="Risk aversion parameter")
    min_weight: float = Field(0.0, ge=0, le=1, description="Minimum weight per asset")
    max_weight: float = Field(1.0, ge=0, le=1, description="Maximum weight per asset")
    risk_free_rate: Optional[float] = Field(None, description="Risk-free rate (if not provided, fetched from FRED)")
    lookback_period: int = Field(252, ge=30, le=2520, description="Days of historical data")
    
    @validator('assets')
    def validate_weights(cls, v):
        weights = [asset.weight for asset in v if asset.weight is not None]
        if weights and abs(sum(weights) - 1.0) > 0.01:
            raise ValueError("Asset weights must sum to 1.0")
        return v

class OptimizedPortfolio(BaseModel):
    user_id: str
    portfolio_id: str
    assets: List[AssetInput]
    optimized_weights: Dict[str, float]
    optimization_method: OptimizationMethod
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float
    risk_metrics: Dict[str, float]
    performance_stats: Dict[str, Any]
    created_at: str

class RiskAnalysisRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    assets: List[AssetInput] = Field(..., min_items=1, max_items=50)
    weights: Optional[List[float]] = Field(None, description="Portfolio weights")
    benchmark: str = Field("SPY", description="Benchmark ticker")
    confidence_level: float = Field(0.95, ge=0.8, le=0.99, description="Confidence level for VaR")
    lookback_period: int = Field(252, ge=30, le=2520, description="Days of historical data")

class RiskAnalysisResult(BaseModel):
    user_id: str
    analysis_id: str
    portfolio_metrics: Dict[str, float]
    risk_metrics: Dict[str, float]
    var_analysis: Dict[str, float]
    factor_exposure: Dict[str, float]
    correlation_matrix: Dict[str, Dict[str, float]]
    benchmark_comparison: Dict[str, float]
    recommendations: List[str]
    created_at: str

class BacktestRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    strategy_name: str = Field(..., description="Strategy name")
    assets: List[AssetInput] = Field(..., min_items=2, max_items=20)
    rebalance_frequency: str = Field("monthly", description="Rebalancing frequency")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")
    initial_capital: float = Field(100000, gt=0, description="Initial capital")
    optimization_method: OptimizationMethod = OptimizationMethod.MAX_SHARPE

class BacktestResult(BaseModel):
    user_id: str
    backtest_id: str
    strategy_name: str
    performance_summary: Dict[str, float]
    annual_returns: Dict[str, float]
    risk_metrics: Dict[str, float]
    drawdown_analysis: Dict[str, float]
    portfolio_evolution: List[Dict[str, Any]]
    benchmark_comparison: Dict[str, float]
    recommendations: List[str]
    created_at: str

# File Storage Manager
class PortfolioStorageManager:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
    
    def get_user_dir(self, user_id: str) -> str:
        user_dir = os.path.join(self.base_dir, user_id)
        os.makedirs(user_dir, exist_ok=True)
        return user_dir
    
    def save_portfolio(self, user_id: str, portfolio: OptimizedPortfolio):
        user_dir = self.get_user_dir(user_id)
        file_path = os.path.join(user_dir, f"portfolio_{portfolio.portfolio_id}.json")
        
        with open(file_path, "w") as f:
            json.dump(portfolio.dict(), f, indent=2)
    
    def load_portfolios(self, user_id: str) -> List[OptimizedPortfolio]:
        user_dir = self.get_user_dir(user_id)
        portfolios = []
        
        for file_name in os.listdir(user_dir):
            if file_name.startswith("portfolio_") and file_name.endswith(".json"):
                file_path = os.path.join(user_dir, file_name)
                try:
                    with open(file_path, "r") as f:
                        portfolio_data = json.load(f)
                    portfolios.append(OptimizedPortfolio(**portfolio_data))
                except Exception as e:
                    logger.error(f"Error loading portfolio {file_name}: {str(e)}")
        
        return portfolios
    
    def save_risk_analysis(self, user_id: str, analysis: RiskAnalysisResult):
        user_dir = self.get_user_dir(user_id)
        file_path = os.path.join(user_dir, f"risk_analysis_{analysis.analysis_id}.json")
        
        with open(file_path, "w") as f:
            json.dump(analysis.dict(), f, indent=2)
    
    def save_backtest(self, user_id: str, backtest: BacktestResult):
        user_dir = self.get_user_dir(user_id)
        file_path = os.path.join(user_dir, f"backtest_{backtest.backtest_id}.json")
        
        with open(file_path, "w") as f:
            json.dump(backtest.dict(), f, indent=2)

# Initialize storage
storage = PortfolioStorageManager(settings.DATA_DIR)

# Portfolio Optimization Engine
class PortfolioOptimizer:
    def __init__(self):
        self.risk_free_rate = settings.RISK_FREE_RATE
    
    async def get_market_data(self, symbols: List[str], period_days: int = 252) -> pd.DataFrame:
        """Fetch historical price data for assets"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days + 30)  # Buffer for weekends
            
            data = yf.download(
                symbols,
                start=start_date.strftime('%Y-%m-%d'),
                end=end_date.strftime('%Y-%m-%d'),
                progress=False
            )['Adj Close']
            
            if isinstance(data, pd.Series):
                data = data.to_frame(symbols[0])
            
            # Remove any columns with insufficient data
            min_observations = max(30, period_days // 2)
            data = data.dropna().tail(period_days)
            
            if len(data) < min_observations:
                raise ValueError(f"Insufficient data: only {len(data)} observations available")
            
            return data
        
        except Exception as e:
            logger.error(f"Error fetching market data: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to fetch market data: {str(e)}")
    
    async def get_risk_free_rate(self) -> float:
        """Fetch current risk-free rate from FRED"""
        if not FRED_AVAILABLE:
            return self.risk_free_rate
        
        try:
            # Get 3-month Treasury rate
            rate_data = fred.get_series('TB3MS', limit=1)
            if not rate_data.empty:
                return float(rate_data.iloc[-1]) / 100  # Convert percentage to decimal
        except Exception as e:
            logger.warning(f"Could not fetch risk-free rate: {str(e)}")
        
        return self.risk_free_rate
    
    def calculate_expected_returns(self, prices: pd.DataFrame, method: str = "mean_historical") -> pd.Series:
        """Calculate expected returns using various methods"""
        if method == "mean_historical":
            return expected_returns.mean_historical_return(prices, frequency=252)
        elif method == "ema_historical":
            return expected_returns.ema_historical_return(prices, frequency=252)
        elif method == "capm_return":
            return expected_returns.capm_return(prices, frequency=252)
        else:
            return expected_returns.mean_historical_return(prices, frequency=252)
    
    def calculate_risk_model(self, prices: pd.DataFrame, method: str = "sample_cov") -> pd.DataFrame:
        """Calculate covariance matrix using various methods"""
        if method == "sample_cov":
            return risk_models.sample_cov(prices, frequency=252)
        elif method == "semicovariance":
            return risk_models.semicovariance(prices, frequency=252)
        elif method == "exp_cov":
            return risk_models.exp_cov(prices, frequency=252)
        elif method == "ledoit_wolf":
            cs = CovarianceShrinkage(prices)
            return cs.ledoit_wolf()
        else:
            return risk_models.sample_cov(prices, frequency=252)
    
    async def optimize_portfolio(self, request: PortfolioOptimizationRequest) -> OptimizedPortfolio:
        """Main portfolio optimization function"""
        symbols = [asset.symbol for asset in request.assets]
        
        # Get market data
        prices = await self.get_market_data(symbols, request.lookback_period)
        
        # Get risk-free rate
        if request.risk_free_rate is not None:
            risk_free_rate = request.risk_free_rate
        else:
            risk_free_rate = await self.get_risk_free_rate()
        
        # Calculate expected returns and covariance matrix
        mu = self.calculate_expected_returns(prices)
        S = self.calculate_risk_model(prices)
        
        # Apply optimization method
        if request.optimization_method == OptimizationMethod.HIERARCHICAL_RISK_PARITY:
            weights = self._optimize_hrp(prices)
        elif request.optimization_method == OptimizationMethod.BLACK_LITTERMAN:
            weights = self._optimize_black_litterman(prices, mu, S, request)
        else:
            weights = self._optimize_mean_variance(mu, S, request, risk_free_rate)
        
        # Calculate portfolio metrics
        portfolio_return = float(mu.T @ weights)
        portfolio_volatility = float(np.sqrt(weights.T @ S @ weights))
        sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility
        
        # Calculate additional risk metrics
        returns = prices.pct_change().dropna()
        portfolio_returns = returns @ weights
        
        risk_metrics = self._calculate_risk_metrics(portfolio_returns, risk_free_rate)
        performance_stats = self._calculate_performance_stats(portfolio_returns)
        
        # Create optimized portfolio object
        optimized_portfolio = OptimizedPortfolio(
            user_id=request.user_id,
            portfolio_id=str(uuid.uuid4()),
            assets=request.assets,
            optimized_weights={symbols[i]: float(weights[i]) for i in range(len(symbols))},
            optimization_method=request.optimization_method,
            expected_return=portfolio_return,
            expected_volatility=portfolio_volatility,
            sharpe_ratio=sharpe_ratio,
            risk_metrics=risk_metrics,
            performance_stats=performance_stats,
            created_at=datetime.now().isoformat()
        )
        
        # Save portfolio
        storage.save_portfolio(request.user_id, optimized_portfolio)
        
        return optimized_portfolio
    
    def _optimize_mean_variance(self, mu: pd.Series, S: pd.DataFrame, request: PortfolioOptimizationRequest, risk_free_rate: float) -> np.ndarray:
        """Mean-variance optimization using PyPortfolioOpt"""
        ef = EfficientFrontier(mu, S, weight_bounds=(request.min_weight, request.max_weight))
        
        if request.optimization_method == OptimizationMethod.MAX_SHARPE:
            weights = ef.max_sharpe(risk_free_rate=risk_free_rate)
        elif request.optimization_method == OptimizationMethod.MIN_VOLATILITY:
            weights = ef.min_volatility()
        elif request.optimization_method == OptimizationMethod.MAX_QUADRATIC_UTILITY:
            weights = ef.max_quadratic_utility(risk_aversion=request.risk_aversion)
        elif request.optimization_method == OptimizationMethod.EFFICIENT_RISK:
            if request.target_risk is None:
                raise HTTPException(status_code=400, detail="Target risk required for efficient risk optimization")
            weights = ef.efficient_risk(target_volatility=request.target_risk)
        elif request.optimization_method == OptimizationMethod.EFFICIENT_RETURN:
            if request.target_return is None:
                raise HTTPException(status_code=400, detail="Target return required for efficient return optimization")
            weights = ef.efficient_return(target_return=request.target_return)
        else:
            weights = ef.max_sharpe(risk_free_rate=risk_free_rate)
        
        # Clean weights and convert to array
        cleaned_weights = ef.clean_weights()
        return np.array([cleaned_weights[asset] for asset in mu.index])
    
    def _optimize_hrp(self, prices: pd.DataFrame) -> np.ndarray:
        """Hierarchical Risk Parity optimization"""
        hrp = HRPOpt(prices.pct_change().dropna())
        weights = hrp.optimize()
        return np.array([weights[asset] for asset in prices.columns])
    
    def _optimize_black_litterman(self, prices: pd.DataFrame, mu: pd.Series, S: pd.DataFrame, request: PortfolioOptimizationRequest) -> np.ndarray:
        """Black-Litterman optimization"""
        # Use market cap weights as prior (simplified - equal weights here)
        market_prior = np.array([1/len(mu)] * len(mu))
        
        # Create Black-Litterman model with minimal views (can be enhanced)
        bl = BlackLittermanModel(S, pi=mu, absolute_views={}, omega="idzorek")
        
        # Get posterior estimates
        ret_bl = bl.bl_returns()
        S_bl = bl.bl_cov()
        
        # Optimize using Black-Litterman inputs
        ef = EfficientFrontier(ret_bl, S_bl, weight_bounds=(request.min_weight, request.max_weight))
        weights = ef.max_sharpe()
        cleaned_weights = ef.clean_weights()
        
        return np.array([cleaned_weights[asset] for asset in mu.index])
    
    def _calculate_risk_metrics(self, returns: pd.Series, risk_free_rate: float) -> Dict[str, float]:
        """Calculate comprehensive risk metrics"""
        return {
            "sharpe_ratio": float(empyrical.sharpe_ratio(returns, risk_free=risk_free_rate)),
            "sortino_ratio": float(empyrical.sortino_ratio(returns, required_return=risk_free_rate)),
            "calmar_ratio": float(empyrical.calmar_ratio(returns)),
            "max_drawdown": float(empyrical.max_drawdown(returns)),
            "value_at_risk_95": float(empyrical.value_at_risk(returns, cutoff=0.05)),
            "conditional_var_95": float(empyrical.conditional_value_at_risk(returns, cutoff=0.05)),
            "volatility": float(empyrical.annual_volatility(returns)),
            "downside_risk": float(empyrical.downside_risk(returns)),
            "tail_ratio": float(empyrical.tail_ratio(returns)),
            "capture_ratio": float(empyrical.capture(returns, returns))
        }
    
    def _calculate_performance_stats(self, returns: pd.Series) -> Dict[str, Any]:
        """Calculate performance statistics"""
        cumulative_returns = empyrical.cum_returns(returns)
        
        return {
            "total_return": float(cumulative_returns.iloc[-1]),
            "annual_return": float(empyrical.annual_return(returns)),
            "best_month": float(returns.max()),
            "worst_month": float(returns.min()),
            "positive_months": int((returns > 0).sum()),
            "negative_months": int((returns < 0).sum()),
            "avg_monthly_return": float(returns.mean()),
            "std_monthly_return": float(returns.std()),
            "skewness": float(returns.skew()),
            "kurtosis": float(returns.kurtosis())
        }

# Risk Analysis Engine
class RiskAnalyzer:
    def __init__(self):
        self.optimizer = PortfolioOptimizer()
    
    async def analyze_portfolio_risk(self, request: RiskAnalysisRequest) -> RiskAnalysisResult:
        """Comprehensive risk analysis of a portfolio"""
        symbols = [asset.symbol for asset in request.assets]
        
        # Use provided weights or equal weights
        if request.weights:
            weights = np.array(request.weights)
        else:
            weights = np.array([1/len(symbols)] * len(symbols))
        
        # Get market data
        prices = await self.optimizer.get_market_data(symbols, request.lookback_period)
        returns = prices.pct_change().dropna()
        
        # Get benchmark data
        benchmark_data = await self.optimizer.get_market_data([request.benchmark], request.lookback_period)
        benchmark_returns = benchmark_data.pct_change().dropna()
        
        # Calculate portfolio returns
        portfolio_returns = returns @ weights
        
        # Portfolio metrics
        portfolio_metrics = self._calculate_portfolio_metrics(portfolio_returns, prices, weights)
        
        # Risk metrics
        risk_metrics = self._calculate_comprehensive_risk_metrics(portfolio_returns, request.confidence_level)
        
        # VaR analysis
        var_analysis = self._calculate_var_analysis(portfolio_returns, request.confidence_level)
        
        # Factor exposure analysis
        factor_exposure = self._calculate_factor_exposure(returns, weights)
        
        # Correlation matrix
        correlation_matrix = self._calculate_correlation_matrix(returns)
        
        # Benchmark comparison
        benchmark_comparison = self._compare_to_benchmark(portfolio_returns, benchmark_returns.iloc[:, 0])
        
        # Generate recommendations
        recommendations = self._generate_risk_recommendations(risk_metrics, portfolio_metrics, benchmark_comparison)
        
        result = RiskAnalysisResult(
            user_id=request.user_id,
            analysis_id=str(uuid.uuid4()),
            portfolio_metrics=portfolio_metrics,
            risk_metrics=risk_metrics,
            var_analysis=var_analysis,
            factor_exposure=factor_exposure,
            correlation_matrix=correlation_matrix,
            benchmark_comparison=benchmark_comparison,
            recommendations=recommendations,
            created_at=datetime.now().isoformat()
        )
        
        # Save analysis
        storage.save_risk_analysis(request.user_id, result)
        
        return result
    
    def _calculate_portfolio_metrics(self, portfolio_returns: pd.Series, prices: pd.DataFrame, weights: np.ndarray) -> Dict[str, float]:
        """Calculate basic portfolio metrics"""
        return {
            "expected_annual_return": float(empyrical.annual_return(portfolio_returns)),
            "annual_volatility": float(empyrical.annual_volatility(portfolio_returns)),
            "total_return": float(empyrical.cum_returns_final(portfolio_returns)),
            "number_of_assets": len(weights),
            "effective_number_of_assets": float(1 / np.sum(weights**2)),
            "concentration_ratio": float(np.max(weights)),
            "weight_entropy": float(-np.sum(weights * np.log(weights + 1e-10)))
        }
    
    def _calculate_comprehensive_risk_metrics(self, returns: pd.Series, confidence_level: float) -> Dict[str, float]:
        """Calculate comprehensive risk metrics"""
        return {
            "max_drawdown": float(empyrical.max_drawdown(returns)),
            "sharpe_ratio": float(empyrical.sharpe_ratio(returns)),
            "sortino_ratio": float(empyrical.sortino_ratio(returns)),
            "calmar_ratio": float(empyrical.calmar_ratio(returns)),
            "omega_ratio": float(empyrical.omega_ratio(returns)),
            "downside_risk": float(empyrical.downside_risk(returns)),
            "upside_risk": float(returns[returns > 0].std() * np.sqrt(252)),
            "skewness": float(returns.skew()),
            "kurtosis": float(returns.kurtosis()),
            "tail_ratio": float(empyrical.tail_ratio(returns)),
            "var_gaussian": float(-returns.quantile(1 - confidence_level)),
            "var_historical": float(-np.percentile(returns, (1 - confidence_level) * 100))
        }
    
    def _calculate_var_analysis(self, returns: pd.Series, confidence_level: float) -> Dict[str, float]:
        """Detailed VaR analysis"""
        var_levels = [0.90, 0.95, 0.99]
        var_analysis = {}
        
        for level in var_levels:
            var_analysis[f"var_{int(level*100)}"] = float(-np.percentile(returns, (1 - level) * 100))
            var_analysis[f"cvar_{int(level*100)}"] = float(-returns[returns <= np.percentile(returns, (1 - level) * 100)].mean())
        
        var_analysis["expected_shortfall"] = float(empyrical.conditional_value_at_risk(returns))
        
        return var_analysis
    
    def _calculate_factor_exposure(self, returns: pd.DataFrame, weights: np.ndarray) -> Dict[str, float]:
        """Calculate factor exposure using PCA"""
        try:
            scaler = StandardScaler()
            returns_scaled = scaler.fit_transform(returns.fillna(0))
            
            pca = PCA(n_components=min(5, len(returns.columns)))
            pca.fit(returns_scaled)
            
            portfolio_returns = returns @ weights
            portfolio_scaled = scaler.transform(portfolio_returns.values.reshape(-1, 1))
            factor_exposures = pca.transform(portfolio_scaled.T).flatten()
            
            exposure_dict = {}
            for i, exposure in enumerate(factor_exposures):
                exposure_dict[f"factor_{i+1}"] = float(exposure)
                exposure_dict[f"factor_{i+1}_explained_variance"] = float(pca.explained_variance_ratio_[i])
            
            return exposure_dict
        
        except Exception as e:
            logger.warning(f"Could not calculate factor exposure: {str(e)}")
            return {"error": "Factor analysis failed"}
    
    def _calculate_correlation_matrix(self, returns: pd.DataFrame) -> Dict[str, Dict[str, float]]:
        """Calculate correlation matrix"""
        corr_matrix = returns.corr()
        return {
            asset1: {asset2: float(corr_matrix.loc[asset1, asset2]) 
                    for asset2 in returns.columns}
            for asset1 in returns.columns
        }
    
    def _compare_to_benchmark(self, portfolio_returns: pd.Series, benchmark_returns: pd.Series) -> Dict[str, float]:
        """Compare portfolio to benchmark"""
        common_dates = portfolio_returns.index.intersection(benchmark_returns.index)
        port_aligned = portfolio_returns.loc[common_dates]
        bench_aligned = benchmark_returns.loc[common_dates]
        
        return {
            "alpha": float(empyrical.alpha(port_aligned, bench_aligned)),
            "beta": float(empyrical.beta(port_aligned, bench_aligned)),
            "correlation": float(port_aligned.corr(bench_aligned)),
            "tracking_error": float((port_aligned - bench_aligned).std() * np.sqrt(252)),
            "information_ratio": float(empyrical.excess_sharpe(port_aligned, bench_aligned)),
            "up_capture": float(empyrical.up_capture(port_aligned, bench_aligned)),
            "down_capture": float(empyrical.down_capture(port_aligned, bench_aligned))
        }
    
    def _generate_risk_recommendations(self, risk_metrics: Dict[str, float], portfolio_metrics: Dict[str, float], benchmark_comparison: Dict[str, float]) -> List[str]:
        """Generate risk management recommendations"""
        recommendations = []
        
        if risk_metrics["max_drawdown"] > 0.20:
            recommendations.append("⚠️ High maximum drawdown detected. Consider reducing position sizes or adding defensive assets.")
        
        if risk_metrics["sharpe_ratio"] < 0.5:
            recommendations.append("📈 Low Sharpe ratio suggests poor risk-adjusted returns. Review asset selection or weights.")
        
        if portfolio_metrics["concentration_ratio"] > 0.4:
            recommendations.append("🎯 High concentration in single asset. Consider diversifying to reduce specific risk.")
        
        if portfolio_metrics["effective_number_of_assets"] < 3:
            recommendations.append("📊 Low diversification. Consider adding more uncorrelated assets to the portfolio.")
        
        if benchmark_comparison["beta"] > 1.5:
            recommendations.append("📉 High beta indicates high market risk. Consider adding low-beta or defensive assets.")
        
        if benchmark_comparison["tracking_error"] > 0.15:
            recommendations.append("🎯 High tracking error suggests significant deviation from benchmark. Review if this aligns with strategy.")
        
        if risk_metrics["sharpe_ratio"] > 1.0:
            recommendations.append("✅ Excellent risk-adjusted returns. Consider maintaining current allocation.")
        
        if risk_metrics["sortino_ratio"] > risk_metrics["sharpe_ratio"]:
            recommendations.append("💪 Strong downside protection. Portfolio shows good risk management.")
        
        return recommendations[:8]

# Backtesting Engine
class BacktestEngine:
    def __init__(self):
        self.optimizer = PortfolioOptimizer()
    
    async def run_backtest(self, request: BacktestRequest) -> BacktestResult:
        """Run portfolio backtest with periodic rebalancing"""
        symbols = [asset.symbol for asset in request.assets]
        
        # Parse dates
        start_date = datetime.strptime(request.start_date, '%Y-%m-%d')
        end_date = datetime.strptime(request.end_date, '%Y-%m-%d')
        
        # Get market data for entire period
        buffer_days = 300  # Extra days for initial optimization
        extended_start = start_date - timedelta(days=buffer_days)
        
        price_data = yf.download(
            symbols,
            start=extended_start.strftime('%Y-%m-%d'),
            end=end_date.strftime('%Y-%m-%d'),
            progress=False
        )['Adj Close']
        
        if isinstance(price_data, pd.Series):
            price_data = price_data.to_frame(symbols[0])
        
        # Set rebalance frequency
        rebalance_freq_map = {
            "daily": 1,
            "weekly": 7,
            "monthly": 21,
            "quarterly": 63,
            "annually": 252
        }
        rebalance_days = rebalance_freq_map.get(request.rebalance_frequency, 21)
        
        # Initialize backtest tracking
        portfolio_value = request.initial_capital
        portfolio_history = []
        rebalance_dates = []
        weights_history = []
        
        # Get benchmark data
        benchmark_data = yf.download("SPY", start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))['Adj Close']
        benchmark_returns = benchmark_data.pct_change().dropna()
        
        # Backtest loop
        current_date = start_date
        last_rebalance_date = start_date
        current_weights = None
        
        while current_date <= end_date:
            # Check if we need to rebalance
            days_since_rebalance = (current_date - last_rebalance_date).days
            
            if current_weights is None or days_since_rebalance >= rebalance_days:
                # Rebalance portfolio
                try:
                    # Get data up to current date for optimization
                    opt_end_date = current_date
                    opt_start_date = current_date - timedelta(days=252)  # 1 year lookback
                    
                    opt_data = price_data.loc[opt_start_date:opt_end_date]
                    
                    if len(opt_data) < 50:  # Need sufficient data
                        current_date += timedelta(days=1)
                        continue
                    
                    # Calculate expected returns and covariance
                    mu = expected_returns.mean_historical_return(opt_data, frequency=252)
                    S = risk_models.sample_cov(opt_data, frequency=252)
                    
                    # Optimize portfolio
                    ef = EfficientFrontier(mu, S)
                    
                    if request.optimization_method == OptimizationMethod.MAX_SHARPE:
                        weights = ef.max_sharpe()
                    elif request.optimization_method == OptimizationMethod.MIN_VOLATILITY:
                        weights = ef.min_volatility()
                    else:
                        weights = ef.max_sharpe()  # Default
                    
                    current_weights = np.array([weights[symbol] for symbol in symbols])
                    
                    rebalance_dates.append(current_date)
                    weights_history.append(current_weights.copy())
                    last_rebalance_date = current_date
                    
                except Exception as e:
                    logger.warning(f"Rebalancing failed on {current_date}: {str(e)}")
                    if current_weights is None:
                        current_weights = np.array([1/len(symbols)] * len(symbols))  # Equal weights fallback
            
            # Calculate daily portfolio return
            if current_date in price_data.index and current_weights is not None:
                if len(portfolio_history) > 0:
                    # Get previous day's prices
                    prev_date_data = price_data.loc[:current_date].iloc[-2] if len(price_data.loc[:current_date]) > 1 else None
                    current_date_data = price_data.loc[current_date]
                    
                    if prev_date_data is not None:
                        # Calculate returns
                        daily_returns = (current_date_data - prev_date_data) / prev_date_data
                        daily_returns = daily_returns.fillna(0)
                        
                        # Portfolio return
                        portfolio_return = np.sum(current_weights * daily_returns)
                        portfolio_value *= (1 + portfolio_return)
                
                # Track portfolio evolution
                portfolio_history.append({
                    "date": current_date.strftime('%Y-%m-%d'),
                    "portfolio_value": portfolio_value,
                    "weights": {symbols[i]: float(current_weights[i]) for i in range(len(symbols))}
                })
            
            current_date += timedelta(days=1)
        
        # Calculate performance metrics
        portfolio_values = [entry["portfolio_value"] for entry in portfolio_history]
        portfolio_returns = pd.Series(portfolio_values).pct_change().dropna()
        
        # Align with benchmark
        portfolio_dates = [datetime.strptime(entry["date"], '%Y-%m-%d') for entry in portfolio_history[1:]]
        benchmark_aligned = benchmark_returns.loc[benchmark_returns.index.isin(portfolio_dates)]
        
        # Performance summary
        total_return = (portfolio_value - request.initial_capital) / request.initial_capital
        annual_return = empyrical.annual_return(portfolio_returns) if len(portfolio_returns) > 30 else 0
        
        performance_summary = {
            "total_return": float(total_return),
            "annual_return": float(annual_return),
            "annual_volatility": float(empyrical.annual_volatility(portfolio_returns)) if len(portfolio_returns) > 30 else 0,
            "sharpe_ratio": float(empyrical.sharpe_ratio(portfolio_returns)) if len(portfolio_returns) > 30 else 0,
            "max_drawdown": float(empyrical.max_drawdown(portfolio_returns)) if len(portfolio_returns) > 30 else 0,
            "final_value": float(portfolio_value),
            "number_of_rebalances": len(rebalance_dates)
        }
        
        # Risk metrics
        risk_metrics = {}
        if len(portfolio_returns) > 30:
            risk_metrics = {
                "sortino_ratio": float(empyrical.sortino_ratio(portfolio_returns)),
                "calmar_ratio": float(empyrical.calmar_ratio(portfolio_returns)),
                "var_95": float(-np.percentile(portfolio_returns, 5)),
                "cvar_95": float(-portfolio_returns[portfolio_returns <= np.percentile(portfolio_returns, 5)].mean()),
                "downside_risk": float(empyrical.downside_risk(portfolio_returns))
            }
        
        # Benchmark comparison
        benchmark_comparison = {}
        if len(benchmark_aligned) > 30 and len(portfolio_returns) > 30:
            try:
                # Align dates properly
                common_dates = pd.date_range(start=start_date, end=end_date, freq='D')
                benchmark_comparison = {
                    "benchmark_return": float(empyrical.annual_return(benchmark_aligned)),
                    "excess_return": float(annual_return - empyrical.annual_return(benchmark_aligned)),
                    "tracking_error": float((portfolio_returns - benchmark_aligned).std() * np.sqrt(252)),
                    "information_ratio": float(empyrical.excess_sharpe(portfolio_returns, benchmark_aligned))
                }
            except:
                benchmark_comparison = {"error": "Benchmark comparison failed"}
        
        # Generate recommendations
        recommendations = self._generate_backtest_recommendations(performance_summary, risk_metrics)
        
        result = BacktestResult(
            user_id=request.user_id,
            backtest_id=str(uuid.uuid4()),
            strategy_name=request.strategy_name,
            performance_summary=performance_summary,
            annual_returns={str(year): 0.0 for year in range(start_date.year, end_date.year + 1)},  # Simplified
            risk_metrics=risk_metrics,
            drawdown_analysis={"max_drawdown": performance_summary.get("max_drawdown", 0)},
            portfolio_evolution=portfolio_history[-50:],  # Last 50 days for response size
            benchmark_comparison=benchmark_comparison,
            recommendations=recommendations,
            created_at=datetime.now().isoformat()
        )
        
        # Save backtest
        storage.save_backtest(request.user_id, result)
        
        return result
    
    def _generate_backtest_recommendations(self, performance: Dict[str, float], risk_metrics: Dict[str, float]) -> List[str]:
        """Generate backtest-based recommendations"""
        recommendations = []
        
        if performance.get("sharpe_ratio", 0) > 1.0:
            recommendations.append("✅ Strong risk-adjusted performance achieved")
        elif performance.get("sharpe_ratio", 0) < 0.5:
            recommendations.append("⚠️ Low Sharpe ratio - consider different optimization method")
        
        if performance.get("max_drawdown", 0) > 0.2:
            recommendations.append("📉 High drawdown experienced - consider risk management measures")
        
        if performance.get("annual_volatility", 0) > 0.25:
            recommendations.append("📊 High volatility - consider adding stable assets")
        
        if performance.get("total_return", 0) > 0:
            recommendations.append("💰 Strategy generated positive returns")
        else:
            recommendations.append("❌ Strategy generated losses - review approach")
        
        return recommendations

# Initialize engines
portfolio_optimizer = PortfolioOptimizer()
risk_analyzer = RiskAnalyzer()
backtest_engine = BacktestEngine()

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Risk Management & Portfolio Optimization API",
        "version": "1.0.0",
        "features": [
            "Portfolio Optimization (Multiple Methods)",
            "Risk Analysis & Metrics",
            "Performance Analytics", 
            "Factor Analysis",
            "Backtesting & Simulation",
            "Real-time Market Data",
            "Benchmark Comparison"
        ],
        "optimization_methods": [method.value for method in OptimizationMethod],
        "supported_assets": "Stocks, ETFs, Bonds, Crypto (via Yahoo Finance)",
        "data_sources": ["Yahoo Finance", "FRED Economic Data", "VIX Volatility Index"],
        "endpoints": {
            "optimize_portfolio": "/portfolio/optimize",
            "risk_analysis": "/risk/analyze", 
            "backtest_strategy": "/backtest/run",
            "efficient_frontier": "/portfolio/efficient-frontier",
            "market_data": "/data/market/{symbol}",
            "risk_free_rate": "/data/risk-free-rate",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "yahoo_finance": "available",
            "fred_api": "available" if FRED_AVAILABLE else "unavailable",
            "zipline": "available" if ZIPLINE_AVAILABLE else "unavailable"
        }
    }
    return status

# Portfolio Optimization Endpoints
@app.post("/portfolio/optimize", response_model=OptimizedPortfolio)
async def optimize_portfolio(request: PortfolioOptimizationRequest):
    """
    Optimize portfolio using various methods including:
    - Maximum Sharpe Ratio
    - Minimum Volatility 
    - Black-Litterman
    - Hierarchical Risk Parity
    - Risk Parity
    """
    try:
        result = await portfolio_optimizer.optimize_portfolio(request)
        return result
    except Exception as e:
        logger.error(f"Portfolio optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/portfolio/list")
async def list_user_portfolios(user_id: str = Query(..., description="User ID")):
    """Get all portfolios for a user"""
    try:
        portfolios = storage.load_portfolios(user_id)
        return {
            "user_id": user_id,
            "portfolio_count": len(portfolios),
            "portfolios": portfolios
        }
    except Exception as e:
        logger.error(f"Error loading portfolios: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load portfolios: {str(e)}")

@app.post("/portfolio/efficient-frontier")
async def calculate_efficient_frontier(
    user_id: str = Query(..., description="User ID"),
    assets: List[str] = Query(..., description="Asset symbols"),
    num_portfolios: int = Query(100, ge=10, le=500, description="Number of portfolios to generate"),
    lookback_period: int = Query(252, ge=30, le=2520, description="Days of historical data")
):
    """Calculate efficient frontier for given assets"""
    try:
        # Get market data
        prices = await portfolio_optimizer.get_market_data(assets, lookback_period)
        
        # Calculate expected returns and covariance
        mu = portfolio_optimizer.calculate_expected_returns(prices)
        S = portfolio_optimizer.calculate_risk_model(prices)
        
        # Get risk-free rate
        risk_free_rate = await portfolio_optimizer.get_risk_free_rate()
        
        # Generate efficient frontier
        ef = EfficientFrontier(mu, S)
        
        # Calculate range of target returns
        min_ret = mu.min()
        max_ret = mu.max()
        target_returns = np.linspace(min_ret, max_ret, num_portfolios)
        
        frontier_portfolios = []
        
        for target_return in target_returns:
            try:
                ef_copy = EfficientFrontier(mu, S)  # Fresh copy for each optimization
                weights = ef_copy.efficient_return(target_return)
                
                # Calculate portfolio metrics
                portfolio_return = target_return
                portfolio_risk = np.sqrt(weights.T @ S @ weights)
                sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_risk
                
                frontier_portfolios.append({
                    "expected_return": float(portfolio_return),
                    "volatility": float(portfolio_risk),
                    "sharpe_ratio": float(sharpe_ratio),
                    "weights": {asset: float(weight) for asset, weight in weights.items()}
                })
            except:
                continue  # Skip infeasible portfolios
        
        # Add special portfolios
        special_portfolios = {}
        
        # Maximum Sharpe ratio portfolio
        ef_max_sharpe = EfficientFrontier(mu, S)
        max_sharpe_weights = ef_max_sharpe.max_sharpe(risk_free_rate=risk_free_rate)
        ret, vol, sharpe = ef_max_sharpe.portfolio_performance(risk_free_rate=risk_free_rate)
        
        special_portfolios["max_sharpe"] = {
            "expected_return": float(ret),
            "volatility": float(vol), 
            "sharpe_ratio": float(sharpe),
            "weights": {asset: float(weight) for asset, weight in max_sharpe_weights.items()}
        }
        
        # Minimum volatility portfolio
        ef_min_vol = EfficientFrontier(mu, S)
        min_vol_weights = ef_min_vol.min_volatility()
        ret, vol, sharpe = ef_min_vol.portfolio_performance(risk_free_rate=risk_free_rate)
        
        special_portfolios["min_volatility"] = {
            "expected_return": float(ret),
            "volatility": float(vol),
            "sharpe_ratio": float(sharpe),
            "weights": {asset: float(weight) for asset, weight in min_vol_weights.items()}
        }
        
        return {
            "user_id": user_id,
            "assets": assets,
            "efficient_frontier": frontier_portfolios,
            "special_portfolios": special_portfolios,
            "risk_free_rate": risk_free_rate,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Efficient frontier calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Efficient frontier calculation failed: {str(e)}")

@app.post("/portfolio/compare")
async def compare_portfolios(
    user_id: str = Query(..., description="User ID"),
    portfolio_ids: List[str] = Query(..., description="Portfolio IDs to compare"),
    benchmark: str = Query("SPY", description="Benchmark symbol")
):
    """Compare multiple portfolios against each other and benchmark"""
    try:
        portfolios = storage.load_portfolios(user_id)
        target_portfolios = [p for p in portfolios if p.portfolio_id in portfolio_ids]
        
        if len(target_portfolios) != len(portfolio_ids):
            raise HTTPException(status_code=404, detail="One or more portfolios not found")
        
        # Get benchmark data
        benchmark_data = await portfolio_optimizer.get_market_data([benchmark], 252)
        benchmark_returns = benchmark_data.pct_change().dropna()
        
        comparison_results = []
        
        for portfolio in target_portfolios:
            # Get portfolio asset data
            symbols = list(portfolio.optimized_weights.keys())
            weights = np.array(list(portfolio.optimized_weights.values()))
            
            prices = await portfolio_optimizer.get_market_data(symbols, 252)
            returns = prices.pct_change().dropna()
            portfolio_returns = returns @ weights
            
            # Compare to benchmark
            common_dates = portfolio_returns.index.intersection(benchmark_returns.index)
            port_aligned = portfolio_returns.loc[common_dates]
            bench_aligned = benchmark_returns.iloc[:, 0].loc[common_dates]
            
            comparison = {
                "portfolio_id": portfolio.portfolio_id,
                "optimization_method": portfolio.optimization_method,
                "metrics": portfolio.risk_metrics,
                "vs_benchmark": {
                    "alpha": float(empyrical.alpha(port_aligned, bench_aligned)),
                    "beta": float(empyrical.beta(port_aligned, bench_aligned)),
                    "correlation": float(port_aligned.corr(bench_aligned)),
                    "excess_return": float(empyrical.annual_return(port_aligned) - empyrical.annual_return(bench_aligned))
                }
            }
            comparison_results.append(comparison)
        
        return {
            "user_id": user_id,
            "benchmark": benchmark,
            "comparison": comparison_results,
            "summary": {
                "best_sharpe": max(comparison_results, key=lambda x: x["metrics"]["sharpe_ratio"])["portfolio_id"],
                "lowest_risk": min(comparison_results, key=lambda x: x["metrics"]["volatility"])["portfolio_id"],
                "highest_alpha": max(comparison_results, key=lambda x: x["vs_benchmark"]["alpha"])["portfolio_id"]
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Portfolio comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Portfolio comparison failed: {str(e)}")

# Risk Analysis Endpoints
@app.post("/risk/analyze", response_model=RiskAnalysisResult)
async def analyze_portfolio_risk(request: RiskAnalysisRequest):
    """
    Comprehensive risk analysis including:
    - VaR and CVaR calculations
    - Factor exposure analysis
    - Correlation analysis
    - Benchmark comparison
    """
    try:
        result = await risk_analyzer.analyze_portfolio_risk(request)
        return result
    except Exception as e:
        logger.error(f"Risk analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Risk analysis failed: {str(e)}")

class StressTestRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    assets: List[str] = Field(..., description="Asset symbols")
    weights: List[float] = Field(..., description="Portfolio weights")
    scenarios: List[Dict[str, Union[str, float]]] = Field(..., description="Stress test scenarios")
    confidence_levels: List[float] = Field([0.95, 0.99], description="Confidence levels for VaR")

# Replace the existing stress_test_portfolio endpoint (around line 1095) with this:

@app.post("/risk/stress-test")
async def stress_test_portfolio(request: StressTestRequest):
    """Stress test portfolio under various market scenarios"""
    try:
        if len(request.assets) != len(request.weights):
            raise HTTPException(status_code=400, detail="Assets and weights must have same length")
        
        if abs(sum(request.weights) - 1.0) > 0.01:
            raise HTTPException(status_code=400, detail="Weights must sum to 1.0")
        
        # Get historical data
        prices = await portfolio_optimizer.get_market_data(request.assets, 252)
        returns = prices.pct_change().dropna()
        
        # Calculate portfolio returns
        weights_array = np.array(request.weights)
        portfolio_returns = returns @ weights_array
        
        # Base case metrics
        base_metrics = {
            "annual_return": float(empyrical.annual_return(portfolio_returns)),
            "annual_volatility": float(empyrical.annual_volatility(portfolio_returns)),
            "sharpe_ratio": float(empyrical.sharpe_ratio(portfolio_returns)),
            "max_drawdown": float(empyrical.max_drawdown(portfolio_returns))
        }
        
        # Stress test scenarios
        stress_results = []
        
        for i, scenario in enumerate(request.scenarios):
            scenario_name = scenario.get("name", f"Scenario_{i+1}")
            
            # Apply scenario shocks to returns
            shocked_returns = returns.copy()
            for asset, shock in scenario.items():
                if asset in shocked_returns.columns and asset != "name":
                    shocked_returns[asset] = shocked_returns[asset] + float(shock)
            
            # Calculate stressed portfolio returns
            stressed_portfolio_returns = shocked_returns @ weights_array
            
            # Calculate stressed metrics
            stressed_metrics = {
                "scenario_name": scenario_name,
                "annual_return": float(empyrical.annual_return(stressed_portfolio_returns)),
                "annual_volatility": float(empyrical.annual_volatility(stressed_portfolio_returns)),
                "sharpe_ratio": float(empyrical.sharpe_ratio(stressed_portfolio_returns)),
                "max_drawdown": float(empyrical.max_drawdown(stressed_portfolio_returns))
            }
            
            # Calculate VaR for different confidence levels
            var_metrics = {}
            for confidence in request.confidence_levels:
                var_metrics[f"var_{int(confidence*100)}"] = float(-np.percentile(stressed_portfolio_returns, (1-confidence)*100))
                var_metrics[f"cvar_{int(confidence*100)}"] = float(-stressed_portfolio_returns[stressed_portfolio_returns <= np.percentile(stressed_portfolio_returns, (1-confidence)*100)].mean())
            
            stressed_metrics.update(var_metrics)
            stress_results.append(stressed_metrics)
        
        return {
            "user_id": request.user_id,
            "assets": request.assets,
            "weights": request.weights,
            "base_case": base_metrics,
            "stress_scenarios": stress_results,
            "worst_case_scenario": min(stress_results, key=lambda x: x["sharpe_ratio"])["scenario_name"],
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Stress test error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stress test failed: {str(e)}")
    
# Backtesting Endpoints
@app.post("/backtest/run", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest):
    """
    Run comprehensive backtest with:
    - Periodic rebalancing
    - Performance tracking
    - Risk analysis
    - Benchmark comparison
    """
    try:
        result = await backtest_engine.run_backtest(request)
        return result
    except Exception as e:
        logger.error(f"Backtest error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

# Performance Analytics Endpoints
@app.post("/analytics/performance")
async def analyze_performance(
    user_id: str = Query(..., description="User ID"),
    assets: List[str] = Query(..., description="Asset symbols"),
    weights: List[float] = Query(..., description="Portfolio weights"),
    benchmark: str = Query("SPY", description="Benchmark symbol"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """Comprehensive performance analysis over custom time period"""
    try:
        if len(assets) != len(weights):
            raise HTTPException(status_code=400, detail="Assets and weights must have same length")
        
        # Get portfolio data
        portfolio_data = yf.download(assets, start=start_date, end=end_date)['Adj Close']
        if isinstance(portfolio_data, pd.Series):
            portfolio_data = portfolio_data.to_frame(assets[0])
        
        portfolio_returns = portfolio_data.pct_change().dropna()
        weights_array = np.array(weights)
        portfolio_return_series = portfolio_returns @ weights_array
        
        # Get benchmark data
        benchmark_data = yf.download(benchmark, start=start_date, end=end_date)['Adj Close']
        benchmark_returns = benchmark_data.pct_change().dropna()
        
        # Align dates
        common_dates = portfolio_return_series.index.intersection(benchmark_returns.index)
        port_aligned = portfolio_return_series.loc[common_dates]
        bench_aligned = benchmark_returns.loc[common_dates]
        
        # Calculate comprehensive metrics
        performance_metrics = {
            "period": {
                "start_date": start_date,
                "end_date": end_date,
                "total_days": len(port_aligned),
                "trading_days": len(port_aligned)
            },
            "returns": {
                "total_return": float(empyrical.cum_returns_final(port_aligned)),
                "annual_return": float(empyrical.annual_return(port_aligned)),
                "benchmark_return": float(empyrical.annual_return(bench_aligned)),
                "excess_return": float(empyrical.annual_return(port_aligned) - empyrical.annual_return(bench_aligned))
            },
            "risk": {
                "annual_volatility": float(empyrical.annual_volatility(port_aligned)),
                "benchmark_volatility": float(empyrical.annual_volatility(bench_aligned)),
                "max_drawdown": float(empyrical.max_drawdown(port_aligned)),
                "benchmark_max_drawdown": float(empyrical.max_drawdown(bench_aligned))
            },
            "risk_adjusted": {
                "sharpe_ratio": float(empyrical.sharpe_ratio(port_aligned)),
                "sortino_ratio": float(empyrical.sortino_ratio(port_aligned)),
                "calmar_ratio": float(empyrical.calmar_ratio(port_aligned)),
                "omega_ratio": float(empyrical.omega_ratio(port_aligned)),
                "benchmark_sharpe": float(empyrical.sharpe_ratio(bench_aligned))
            },
            "relative_performance": {
                "alpha": float(empyrical.alpha(port_aligned, bench_aligned)),
                "beta": float(empyrical.beta(port_aligned, bench_aligned)),
                "correlation": float(port_aligned.corr(bench_aligned)),
                "tracking_error": float((port_aligned - bench_aligned).std() * np.sqrt(252)),
                "information_ratio": float(empyrical.excess_sharpe(port_aligned, bench_aligned))
            }
        }
        
        # Calculate rolling metrics (monthly windows)
        rolling_window = 21  # Approximately 1 month
        rolling_metrics = []
        
        for i in range(rolling_window, len(port_aligned), rolling_window):
            window_returns = port_aligned.iloc[i-rolling_window:i]
            window_bench = bench_aligned.iloc[i-rolling_window:i]
            
            rolling_metrics.append({
                "date": window_returns.index[-1].strftime('%Y-%m-%d'),
                "return": float(empyrical.cum_returns_final(window_returns)),
                "volatility": float(window_returns.std() * np.sqrt(252)),
                "sharpe": float(empyrical.sharpe_ratio(window_returns)),
                "alpha": float(empyrical.alpha(window_returns, window_bench)),
                "beta": float(empyrical.beta(window_returns, window_bench))
            })
        
        return {
            "user_id": user_id,
            "portfolio": {"assets": assets, "weights": weights},
            "benchmark": benchmark,
            "performance_metrics": performance_metrics,
            "rolling_performance": rolling_metrics,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Performance analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Performance analysis failed: {str(e)}")

# Market Data Endpoints
@app.get("/data/market/{symbol}")
async def get_market_data(
    symbol: str,
    period: str = Query("1y", description="Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)"),
    interval: str = Query("1d", description="Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)")
):
    """Get market data for a specific symbol"""
    try:
        ticker = yf.Ticker(symbol)
        
        # Get historical data
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
        
        # Get basic info
        info = ticker.info
        
        # Calculate basic metrics
        returns = hist['Close'].pct_change().dropna()
        
        response = {
            "symbol": symbol.upper(),
            "company_name": info.get('longName', 'N/A'),
            "sector": info.get('sector', 'N/A'),
            "market_cap": info.get('marketCap', 'N/A'),
            "current_price": float(hist['Close'].iloc[-1]),
            "period": period,
            "interval": interval,
            "data_points": len(hist),
            "price_data": {
                "dates": hist.index.strftime('%Y-%m-%d').tolist(),
                "open": hist['Open'].round(2).tolist(),
                "high": hist['High'].round(2).tolist(),
                "low": hist['Low'].round(2).tolist(),
                "close": hist['Close'].round(2).tolist(),
                "volume": hist['Volume'].tolist()
            },
            "metrics": {
                "annual_return": float(empyrical.annual_return(returns)) if len(returns) > 30 else None,
                "annual_volatility": float(empyrical.annual_volatility(returns)) if len(returns) > 30 else None,
                "sharpe_ratio": float(empyrical.sharpe_ratio(returns)) if len(returns) > 30 else None,
                "max_drawdown": float(empyrical.max_drawdown(returns)) if len(returns) > 30 else None,
                "current_change": float(((hist['Close'].iloc[-1] - hist['Close'].iloc[-2]) / hist['Close'].iloc[-2]) * 100) if len(hist) > 1 else 0
            },
            "retrieved_at": datetime.now().isoformat()
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Market data error for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

@app.get("/data/risk-free-rate")
async def get_risk_free_rate():
    """Get current risk-free rate from FRED"""
    try:
        if not FRED_AVAILABLE:
            return {
                "rate": settings.RISK_FREE_RATE,
                "source": "default",
                "note": "FRED API not available, using default rate"
            }
        
        # Get various risk-free rate proxies
        rates = {}
        
        try:
            # 3-Month Treasury
            tb3ms = fred.get_series('TB3MS', limit=1)
            if not tb3ms.empty:
                rates['3_month_treasury'] = float(tb3ms.iloc[-1]) / 100
        except:
            pass
        
        try:
            # 10-Year Treasury
            dgs10 = fred.get_series('DGS10', limit=1)
            if not dgs10.empty:
                rates['10_year_treasury'] = float(dgs10.iloc[-1]) / 100
        except:
            pass
        
        try:
            # Federal Funds Rate
            fedfunds = fred.get_series('FEDFUNDS', limit=1)
            if not fedfunds.empty:
                rates['federal_funds_rate'] = float(fedfunds.iloc[-1]) / 100
        except:
            pass
        
        # Use 3-month treasury as primary, fallback to others
        primary_rate = rates.get('3_month_treasury', 
                                rates.get('federal_funds_rate',
                                         rates.get('10_year_treasury', settings.RISK_FREE_RATE)))
        
        return {
            "primary_rate": primary_rate,
            "all_rates": rates,
            "source": "FRED",
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Risk-free rate error: {str(e)}")
        return {
            "rate": settings.RISK_FREE_RATE,
            "source": "default",
            "error": str(e)
        }

@app.get("/data/vix")
async def get_vix_data(period: str = Query("1y", description="Data period")):
    """Get VIX volatility index data"""
    try:
        # Try to get VIX data from multiple sources
        vix_data = None
        
        # First try Yahoo Finance
        try:
            vix_ticker = yf.Ticker("^VIX")
            vix_data = vix_ticker.history(period=period)
        except:
            pass
        
        # If Yahoo fails, try FRED
        if vix_data is None or vix_data.empty:
            if FRED_AVAILABLE:
                try:
                    # Get number of days for period
                    period_days = {"1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730}.get(period, 365)
                    start_date = datetime.now() - timedelta(days=period_days)
                    
                    vix_fred = fred.get_series('VIXCLS', start=start_date.strftime('%Y-%m-%d'))
                    if not vix_fred.empty:
                        vix_data = pd.DataFrame({'Close': vix_fred})
                except:
                    pass
        
        if vix_data is None or vix_data.empty:
            raise HTTPException(status_code=404, detail="VIX data not available")
        
        current_vix = float(vix_data['Close'].iloc[-1])
        
        # Calculate VIX statistics
        vix_stats = {
            "current_vix": current_vix,
            "average_vix": float(vix_data['Close'].mean()),
            "max_vix": float(vix_data['Close'].max()),
            "min_vix": float(vix_data['Close'].min()),
            "vix_percentile": float((vix_data['Close'] < current_vix).sum() / len(vix_data) * 100)
        }
        
        # VIX interpretation
        if current_vix < 20:
            market_sentiment = "Low volatility - Complacent market"
        elif current_vix < 30:
            market_sentiment = "Moderate volatility - Normal market conditions" 
        elif current_vix < 40:
            market_sentiment = "High volatility - Elevated fear"
        else:
            market_sentiment = "Extreme volatility - Panic conditions"
        
        return {
            "vix_data": {
                "dates": vix_data.index.strftime('%Y-%m-%d').tolist(),
                "values": vix_data['Close'].round(2).tolist()
            },
            "statistics": vix_stats,
            "market_sentiment": market_sentiment,
            "period": period,
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"VIX data error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch VIX data: {str(e)}")

class MonteCarloRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    assets: List[str] = Field(..., description="Asset symbols")
    weights: List[float] = Field(..., description="Portfolio weights")
    initial_value: float = Field(100000, gt=0, description="Initial portfolio value")
    time_horizon: int = Field(252, ge=30, le=2520, description="Simulation horizon in days")
    num_simulations: int = Field(1000, ge=100, le=10000, description="Number of Monte Carlo simulations")
    confidence_levels: List[float] = Field([0.05, 0.95], description="Confidence levels for projections")

# And replace the Monte Carlo endpoint with this:

@app.post("/risk/monte-carlo")
async def monte_carlo_simulation(request: MonteCarloRequest):
    """Monte Carlo simulation for portfolio projections"""
    try:
        if len(request.assets) != len(request.weights):
            raise HTTPException(status_code=400, detail="Assets and weights must have same length")
        
        # Get historical data
        prices = await portfolio_optimizer.get_market_data(request.assets, 252)
        returns = prices.pct_change().dropna()
        
        # Calculate portfolio statistics
        weights_array = np.array(request.weights)
        portfolio_returns = returns @ weights_array
        
        mean_return = portfolio_returns.mean()
        volatility = portfolio_returns.std()
        
        # Run Monte Carlo simulation
        np.random.seed(42)  # For reproducibility
        simulations = []
        
        for _ in range(request.num_simulations):
            # Generate random returns
            random_returns = np.random.normal(mean_return, volatility, request.time_horizon)
            
            # Calculate portfolio value path
            portfolio_values = [request.initial_value]
            for daily_return in random_returns:
                portfolio_values.append(portfolio_values[-1] * (1 + daily_return))
            
            simulations.append(portfolio_values)
        
        # Convert to numpy array for easier analysis
        simulations_array = np.array(simulations)
        
        # Calculate statistics for final values
        final_values = simulations_array[:, -1]
        
        # Calculate percentiles
        percentiles = {}
        for confidence in request.confidence_levels:
            percentiles[f"percentile_{int(confidence*100)}"] = float(np.percentile(final_values, confidence*100))
        
        # Calculate additional statistics
        simulation_stats = {
            "mean_final_value": float(np.mean(final_values)),
            "median_final_value": float(np.median(final_values)),
            "std_final_value": float(np.std(final_values)),
            "min_final_value": float(np.min(final_values)),
            "max_final_value": float(np.max(final_values)),
            "probability_of_loss": float(np.mean(final_values < request.initial_value)),
            "expected_return": float((np.mean(final_values) - request.initial_value) / request.initial_value),
            **percentiles
        }
        
        # Calculate path statistics (every 21 days ≈ monthly)
        path_stats = []
        reporting_intervals = range(21, request.time_horizon + 1, 21)
        
        for day in reporting_intervals:
            day_values = simulations_array[:, day]
            path_stats.append({
                "day": day,
                "mean_value": float(np.mean(day_values)),
                "percentile_5": float(np.percentile(day_values, 5)),
                "percentile_95": float(np.percentile(day_values, 95)),
                "probability_of_loss": float(np.mean(day_values < request.initial_value))
            })
        
        return {
            "user_id": request.user_id,
            "simulation_parameters": {
                "assets": request.assets,
                "weights": request.weights,
                "initial_value": request.initial_value,
                "time_horizon_days": request.time_horizon,
                "num_simulations": request.num_simulations
            },
            "final_value_statistics": simulation_stats,
            "path_statistics": path_stats,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Monte Carlo simulation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Monte Carlo simulation failed: {str(e)}")

# Utility Endpoints
@app.get("/analytics/correlation-matrix")
async def get_correlation_matrix(
    assets: List[str] = Query(..., description="Asset symbols"),
    period: str = Query("1y", description="Data period"),
    method: str = Query("pearson", description="Correlation method (pearson, spearman, kendall)")
):
    """Calculate correlation matrix for given assets"""
    try:
        # Get market data
        data = yf.download(assets, period=period)['Adj Close']
        if isinstance(data, pd.Series):
            data = data.to_frame(assets[0])
        
        returns = data.pct_change().dropna()
        
        # Calculate correlation matrix
        if method == "pearson":
            corr_matrix = returns.corr()
        elif method == "spearman":
            corr_matrix = returns.corr(method='spearman')
        elif method == "kendall":
            corr_matrix = returns.corr(method='kendall')
        else:
            corr_matrix = returns.corr()
        
        # Convert to nested dictionary
        correlation_dict = {}
        for asset1 in corr_matrix.index:
            correlation_dict[asset1] = {}
            for asset2 in corr_matrix.columns:
                correlation_dict[asset1][asset2] = float(corr_matrix.loc[asset1, asset2])
        
        # Calculate additional statistics
        avg_correlation = float(corr_matrix.values[np.triu_indices_from(corr_matrix.values, k=1)].mean())
        max_correlation = float(corr_matrix.values[np.triu_indices_from(corr_matrix.values, k=1)].max())
        min_correlation = float(corr_matrix.values[np.triu_indices_from(corr_matrix.values, k=1)].min())
        
        return {
            "assets": assets,
            "correlation_matrix": correlation_dict,
            "statistics": {
                "average_correlation": avg_correlation,
                "maximum_correlation": max_correlation,
                "minimum_correlation": min_correlation,
                "method": method,
                "period": period
            },
            "diversification_score": 1 - avg_correlation,  # Higher score = better diversification
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Correlation matrix error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Correlation analysis failed: {str(e)}")

@app.get("/analytics/factor-analysis")
async def factor_analysis(
    assets: List[str] = Query(..., description="Asset symbols"),
    period: str = Query("2y", description="Data period"),
    n_factors: int = Query(5, ge=2, le=10, description="Number of factors to extract")
):
    """Perform factor analysis on asset returns"""
    try:
        # Get market data
        data = yf.download(assets, period=period)['Adj Close']
        if isinstance(data, pd.Series):
            data = data.to_frame(assets[0])
        
        returns = data.pct_change().dropna()
        
        # Standardize returns
        scaler = StandardScaler()
        returns_scaled = scaler.fit_transform(returns.fillna(0))
        
        # Apply PCA
        pca = PCA(n_components=min(n_factors, len(assets)))
        pca.fit(returns_scaled)
        
        # Get factor loadings
        loadings = pca.components_.T * np.sqrt(pca.explained_variance_)
        
        # Create loadings DataFrame
        loadings_df = pd.DataFrame(
            loadings,
            index=returns.columns,
            columns=[f"Factor_{i+1}" for i in range(pca.n_components_)]
        )
        
        # Convert to dictionary
        factor_loadings = {}
        for asset in loadings_df.index:
            factor_loadings[asset] = {}
            for factor in loadings_df.columns:
                factor_loadings[asset][factor] = float(loadings_df.loc[asset, factor])
        
        return {
            "assets": assets,
            "factor_analysis": {
                "n_factors": pca.n_components_,
                "explained_variance_ratio": [float(x) for x in pca.explained_variance_ratio_],
                "cumulative_explained_variance": [float(x) for x in np.cumsum(pca.explained_variance_ratio_)],
                "factor_loadings": factor_loadings
            },
            "interpretation": {
                f"factor_{i+1}": {
                    "explained_variance": float(pca.explained_variance_ratio_[i]),
                    "top_assets": sorted(
                        [(asset, abs(loadings_df.iloc[j, i])) for j, asset in enumerate(assets)],
                        key=lambda x: x[1], reverse=True
                    )[:3]
                }
                for i in range(pca.n_components_)
            },
            "total_variance_explained": float(np.sum(pca.explained_variance_ratio_)),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Factor analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Factor analysis failed: {str(e)}")

# Advanced Analytics Endpoints
@app.post("/analytics/regime-detection")
async def detect_market_regimes(
    assets: List[str] = Query(..., description="Asset symbols"),
    period: str = Query("5y", description="Data period"),
    n_regimes: int = Query(3, ge=2, le=5, description="Number of market regimes")
):
    """Detect market regimes using clustering analysis"""
    try:
        # Get market data
        data = yf.download(assets, period=period)['Adj Close']
        if isinstance(data, pd.Series):
            data = data.to_frame(assets[0])
        
        returns = data.pct_change().dropna()
        
        # Calculate rolling window features
        window = 21  # 1 month
        features = []
        dates = []
        
        for i in range(window, len(returns)):
            window_returns = returns.iloc[i-window:i]
            
            # Calculate features for this window
            feature_vector = [
                window_returns.mean().mean(),  # Average return
                window_returns.std().mean(),   # Average volatility
                window_returns.corr().values[np.triu_indices_from(window_returns.corr().values, k=1)].mean(),
                window_returns.min().min(),    # Worst return
                window_returns.max().max()     # Best return
            ]
            
            features.append(feature_vector)
            dates.append(returns.index[i])
        
        # Standardize features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Apply K-means clustering
        kmeans = KMeans(n_clusters=n_regimes, random_state=42, n_init=10)
        regime_labels = kmeans.fit_predict(features_scaled)
        
        # Calculate regime statistics
        regime_stats = {}
        for regime in range(n_regimes):
            regime_mask = regime_labels == regime
            regime_features = np.array(features)[regime_mask]
            
            regime_stats[f"regime_{regime}"] = {
                "periods": int(np.sum(regime_mask)),
                "percentage": float(np.sum(regime_mask) / len(regime_mask) * 100),
                "avg_return": float(regime_features[:, 0].mean()),
                "avg_volatility": float(regime_features[:, 1].mean()),
                "avg_correlation": float(regime_features[:, 2].mean()),
                "characteristics": _interpret_regime(regime_features[:, 0].mean(), 
                                                   regime_features[:, 1].mean(),
                                                   regime_features[:, 2].mean())
            }
        
        # Current regime
        current_regime = int(regime_labels[-1])
        
        return {
            "assets": assets,
            "regime_analysis": {
                "n_regimes": n_regimes,
                "current_regime": current_regime,
                "regime_statistics": regime_stats,
                "regime_history": [
                    {"date": date.strftime('%Y-%m-%d'), "regime": int(regime)}
                    for date, regime in zip(dates[-60:], regime_labels[-60:])
                ]
            },
            "market_outlook": regime_stats[f"regime_{current_regime}"]["characteristics"],
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Regime detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Regime detection failed: {str(e)}")

def _interpret_regime(avg_return: float, avg_volatility: float, avg_correlation: float) -> str:
    """Interpret market regime characteristics"""
    if avg_return > 0.001 and avg_volatility < 0.02:
        return "Bull Market - Rising prices with low volatility"
    elif avg_return < -0.001 and avg_volatility > 0.03:
        return "Bear Market - Falling prices with high volatility"
    elif avg_volatility > 0.025 and avg_correlation > 0.5:
        return "Crisis Period - High volatility and correlation"
    elif avg_volatility < 0.015:
        return "Calm Period - Low volatility across assets"
    else:
        return "Transitional Period - Mixed market conditions"

# Error Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": True,
        "message": exc.detail,
        "status_code": exc.status_code,
        "timestamp": datetime.now().isoformat()
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unexpected error: {str(exc)}")
    return {
        "error": True,
        "message": "Internal server error",
        "status_code": 500,
        "timestamp": datetime.now().isoformat()
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Risk Management & Portfolio Optimization API started")
    logger.info(f"Data directory: {settings.DATA_DIR}")
    logger.info(f"FRED API available: {FRED_AVAILABLE}")
    logger.info(f"Zipline available: {ZIPLINE_AVAILABLE}")

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)