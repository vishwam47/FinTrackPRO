import axios from 'axios';

const ML_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

const mlApi = axios.create({
  baseURL: ML_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

mlApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('ML API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const fraudDetectionAPI = {
  predict: (data) => mlApi.post('/transaction_fraud/predict', data),
  health: () => mlApi.get('/transaction_fraud/health'),
};

export const cryptoAPI = {
  getTrending: () => mlApi.get('/cryptocurrency_analysis_and_trading/crypto/trending'),
  getMarketOverview: () => mlApi.get('/cryptocurrency_analysis_and_trading/crypto/market-overview'),
  getCryptoDetails: (symbol) => mlApi.get(`/cryptocurrency_analysis_and_trading/crypto/${symbol}`),
};

export const marketAPI = {
  screenStocks: (params) => mlApi.get('/algorithmic_trading/market-screener', { params }),
  getSignals: (symbol) => mlApi.get(`/algorithmic_trading/signals/${symbol}`),
};

export const creditCardAPI = {
  predictDefault: (data) => mlApi.post('/credit_card_default/predict', data),
};

export const creditScoreAPI = {
  predictScore: (data) => mlApi.post('/credit_score_prediction/predict', data),
};

export const personalFinanceAPI = {
  getAdvice: (data) => mlApi.post('/personal_finance_ai/advice', data),
  analyzeBudget: (data) => mlApi.post('/personal_finance_ai/analyze-budget', data),
};

export const newsAPI = {
  getSentiment: (ticker) => mlApi.get(`/realtime_news_sentiment_trading/sentiment/${ticker}`),
  getRecommendations: (ticker) => mlApi.get(`/realtime_news_sentiment_trading/recommendations/${ticker}`),
};

export const documentAPI = {
  processDocument: (formData) => mlApi.post('/financial_document_processing/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const portfolioAPI = {
  optimizePortfolio: (data) => mlApi.post('/risk_management_and_portfolio_optimization/optimize', data),
  calculateRisk: (data) => mlApi.post('/risk_management_and_portfolio_optimization/risk', data),
};

export const complianceAPI = {
  checkCompliance: (data) => mlApi.post('/regulatory_compliance_and_aml_detection/check', data),
};

export const expenseCategorizationAPI = {
  categorize: (data) => mlApi.post('/expense_categorization_and_financial_insights/categorize', data),
  getInsights: (userId) => mlApi.get(`/expense_categorization_and_financial_insights/insights/${userId}`),
};

export const mlHealthAPI = {
  checkAll: () => mlApi.get('/health'),
  getServices: () => mlApi.get('/services'),
};

// ─── New AI-Powered Services ──────────────────────────────────────────────

export const stockSuggestionsAPI = {
  getSuggestions: () => mlApi.get('/stock_suggestions/suggestions'),
  getCustomSuggestions: (symbols) => mlApi.post('/stock_suggestions/suggestions', { symbols }),
  getRisk: (symbol) => mlApi.get(`/stock_suggestions/risk/${symbol}`),
};

export const geminiStockAPI = {
  analyze: (symbol, question) => mlApi.post('/gemini_stock/analyze', { symbol, question }),
  chat: (symbol, messages, new_message) => mlApi.post('/gemini_stock/chat', { symbol, messages, new_message }),
  getStockData: (symbol) => mlApi.get(`/gemini_stock/stock/${symbol}`),
};

export const stockNewsFraudAPI = {
  checkSymbol: (symbol, maxArticles = 8) =>
    mlApi.get(`/stock_news_fraud/check/${symbol}`, { params: { max_articles: maxArticles } }),
  checkText: (data) => mlApi.post('/stock_news_fraud/check-text', data),
};

export default mlApi;