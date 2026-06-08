from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from Algorithmic_Trading.trading_api import app as algorithmic_trading_app
    from Credit_Card_Default.fastapi_credit_card_app import app as credit_card_default_app
    from Credit_Score_Prediction.fastapi_credit_score import app as credit_score_prediction_app
    from Cryptocurrency_Analysis_and_Trading.crypto_trading_api import app as cryptocurrency_analysis_and_trading_app
    from Expense_Categorization_and_Financial_Insights.finance_fastapi import app as expense_categorization_and_financial_insights_app
    from Financial_Document_Processing.financial_doc_api import app as financial_document_processing_app
    from Fraud_Detection.cc_fraud_api import app as fraud_detection_app
    from Personal_Finance_AI.personal_finance_fastapi import app as personal_finance_ai_app
    from Realtime_News_Sentiment_Trading.yfinance_pyfin_trading_api import app as realtime_news_sentiment_trading_app
    from Regulatory_Compliance_and_AML_Detection.aml_compliance_api import app as regulatory_compliance_and_aml_detection_app
    from Risk_Management_and_Portfolio_Optimization.portfolio_risk_api import app as risk_management_and_portfolio_optimization_app
    from Transaction_Fraud.transaction_fraud_detection_api import app as transaction_fraud_app
    # New AI-powered services
    from Stock_Suggestions.stock_suggestions_api import app as stock_suggestions_app
    from Gemini_Stock_Analysis.gemini_stock_api import app as gemini_stock_app
    from Stock_News_Fraud.stock_news_fraud_api import app as stock_news_fraud_app
except ImportError as e:
    print(f"Import Error: {e}")
    print("Make sure all required dependencies are installed and paths are correct")
    print("Also ensure you've removed the 'if __name__ == \"__main__\"' blocks from individual API files")
    raise

main_app = FastAPI(
    title="Combined Realtime Finance API",
    description="Comprehensive Financial Services API combining all microservices including AI-powered stock analysis, suggestions, and fraud detection",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

main_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

main_app.mount("/algorithmic_trading", algorithmic_trading_app)
main_app.mount("/credit_card_default", credit_card_default_app)
main_app.mount("/credit_score_prediction", credit_score_prediction_app)
main_app.mount("/cryptocurrency_analysis_and_trading", cryptocurrency_analysis_and_trading_app)
main_app.mount("/expense_categorization_and_financial_insights", expense_categorization_and_financial_insights_app)
main_app.mount("/financial_document_processing", financial_document_processing_app)
main_app.mount("/fraud_detection", fraud_detection_app)
main_app.mount("/personal_finance_ai", personal_finance_ai_app)
main_app.mount("/realtime_news_sentiment_trading", realtime_news_sentiment_trading_app)
main_app.mount("/regulatory_compliance_and_aml_detection", regulatory_compliance_and_aml_detection_app)
main_app.mount("/risk_management_and_portfolio_optimization", risk_management_and_portfolio_optimization_app)
main_app.mount("/transaction_fraud", transaction_fraud_app)
# New AI-powered services
main_app.mount("/stock_suggestions", stock_suggestions_app)
main_app.mount("/gemini_stock", gemini_stock_app)
main_app.mount("/stock_news_fraud", stock_news_fraud_app)

@main_app.get("/")
async def root():
    return {
        "message": "Realtime Finance - Combined API Gateway",
        "version": "1.0.0",
        "description": "Comprehensive financial services platform",
        "total_services": 12,
        "available_services": {
        "algorithmic_trading": {
            "base_path": "/algorithmic_trading",
            "description": "Algorithmic Trading",
            "docs": "/algorithmic_trading/docs",
            "source_file": "Algorithmic_Trading/trading_api.py"
        },
        "credit_card_default": {
            "base_path": "/credit_card_default",
            "description": "Credit Card Default",
            "docs": "/credit_card_default/docs",
            "source_file": "Credit_Card_Default/fastapi_credit_card_app.py"
        },
        "credit_score_prediction": {
            "base_path": "/credit_score_prediction",
            "description": "Credit Score Prediction",
            "docs": "/credit_score_prediction/docs",
            "source_file": "Credit_Score_Prediction/fastapi_credit_score.py"
        },
        "cryptocurrency_analysis_and_trading": {
            "base_path": "/cryptocurrency_analysis_and_trading",
            "description": "Cryptocurrency Analysis And Trading",
            "docs": "/cryptocurrency_analysis_and_trading/docs",
            "source_file": "Cryptocurrency_Analysis_and_Trading/crypto_trading_api.py"
        },
        "expense_categorization_and_financial_insights": {
            "base_path": "/expense_categorization_and_financial_insights",
            "description": "Expense Categorization And Financial Insights",
            "docs": "/expense_categorization_and_financial_insights/docs",
            "source_file": "Expense_Categorization_and_Financial_Insights/finance_fastapi.py"
        },
        "financial_document_processing": {
            "base_path": "/financial_document_processing",
            "description": "Financial Document Processing",
            "docs": "/financial_document_processing/docs",
            "source_file": "Financial_Document_Processing/financial_doc_api.py"
        },
        "fraud_detection": {
            "base_path": "/fraud_detection",
            "description": "Fraud Detection",
            "docs": "/fraud_detection/docs",
            "source_file": "Fraud_Detection/cc_fraud_api.py"
        },
        "personal_finance_ai": {
            "base_path": "/personal_finance_ai",
            "description": "Personal Finance Ai",
            "docs": "/personal_finance_ai/docs",
            "source_file": "Personal_Finance_AI/personal_finance_fastapi.py"
        },
        "realtime_news_sentiment_trading": {
            "base_path": "/realtime_news_sentiment_trading",
            "description": "Realtime News Sentiment Trading",
            "docs": "/realtime_news_sentiment_trading/docs",
            "source_file": "Realtime_News_Sentiment_Trading/yfinance_pyfin_trading_api.py"
        },
        "regulatory_compliance_and_aml_detection": {
            "base_path": "/regulatory_compliance_and_aml_detection",
            "description": "Regulatory Compliance And Aml Detection",
            "docs": "/regulatory_compliance_and_aml_detection/docs",
            "source_file": "Regulatory_Compliance_and_AML_Detection/aml_compliance_api.py"
        },
        "risk_management_and_portfolio_optimization": {
            "base_path": "/risk_management_and_portfolio_optimization",
            "description": "Risk Management And Portfolio Optimization",
            "docs": "/risk_management_and_portfolio_optimization/docs",
            "source_file": "Risk_Management_and_Portfolio_Optimization/portfolio_risk_api.py"
        },
        "transaction_fraud": {
            "base_path": "/transaction_fraud",
            "description": "Transaction Fraud",
            "docs": "/transaction_fraud/docs",
            "source_file": "Transaction_Fraud/transaction_fraud_detection_api.py"
        },
    },
        "documentation": {
            "main_docs": "/docs",
            "redoc": "/redoc"
        },
        "usage": {
            "individual_service_docs": "Visit /<service-name>/docs for specific API documentation",
            "example": "/fraud-detection/docs"
        }
    }

@main_app.get("/health")
async def combined_health_check():
    service_names = ["algorithmic_trading", "credit_card_default", "credit_score_prediction", "cryptocurrency_analysis_and_trading", "expense_categorization_and_financial_insights", "financial_document_processing", "fraud_detection", "personal_finance_ai", "realtime_news_sentiment_trading", "regulatory_compliance_and_aml_detection", "risk_management_and_portfolio_optimization", "transaction_fraud"]
    services_status = {}
    for service_name in service_names:
        services_status[service_name] = {
            "status": "mounted",
            "path": f"/{service_name}",
            "docs": f"/{service_name}/docs"
        }
    
    return {
        "status": "healthy",
        "timestamp": "2025-06-26",
        "services": services_status,
        "total_services": len(services_status)
    }

@main_app.get("/services")
async def list_services():
    return {
        "services": {
        "algorithmic_trading": {
            "base_path": "/algorithmic_trading",
            "description": "Algorithmic Trading",
            "docs": "/algorithmic_trading/docs",
            "source_file": "Algorithmic_Trading/trading_api.py"
        },
        "credit_card_default": {
            "base_path": "/credit_card_default",
            "description": "Credit Card Default",
            "docs": "/credit_card_default/docs",
            "source_file": "Credit_Card_Default/fastapi_credit_card_app.py"
        },
        "credit_score_prediction": {
            "base_path": "/credit_score_prediction",
            "description": "Credit Score Prediction",
            "docs": "/credit_score_prediction/docs",
            "source_file": "Credit_Score_Prediction/fastapi_credit_score.py"
        },
        "cryptocurrency_analysis_and_trading": {
            "base_path": "/cryptocurrency_analysis_and_trading",
            "description": "Cryptocurrency Analysis And Trading",
            "docs": "/cryptocurrency_analysis_and_trading/docs",
            "source_file": "Cryptocurrency_Analysis_and_Trading/crypto_trading_api.py"
        },
        "expense_categorization_and_financial_insights": {
            "base_path": "/expense_categorization_and_financial_insights",
            "description": "Expense Categorization And Financial Insights",
            "docs": "/expense_categorization_and_financial_insights/docs",
            "source_file": "Expense_Categorization_and_Financial_Insights/finance_fastapi.py"
        },
        "financial_document_processing": {
            "base_path": "/financial_document_processing",
            "description": "Financial Document Processing",
            "docs": "/financial_document_processing/docs",
            "source_file": "Financial_Document_Processing/financial_doc_api.py"
        },
        "fraud_detection": {
            "base_path": "/fraud_detection",
            "description": "Fraud Detection",
            "docs": "/fraud_detection/docs",
            "source_file": "Fraud_Detection/cc_fraud_api.py"
        },
        "personal_finance_ai": {
            "base_path": "/personal_finance_ai",
            "description": "Personal Finance Ai",
            "docs": "/personal_finance_ai/docs",
            "source_file": "Personal_Finance_AI/personal_finance_fastapi.py"
        },
        "realtime_news_sentiment_trading": {
            "base_path": "/realtime_news_sentiment_trading",
            "description": "Realtime News Sentiment Trading",
            "docs": "/realtime_news_sentiment_trading/docs",
            "source_file": "Realtime_News_Sentiment_Trading/yfinance_pyfin_trading_api.py"
        },
        "regulatory_compliance_and_aml_detection": {
            "base_path": "/regulatory_compliance_and_aml_detection",
            "description": "Regulatory Compliance And Aml Detection",
            "docs": "/regulatory_compliance_and_aml_detection/docs",
            "source_file": "Regulatory_Compliance_and_AML_Detection/aml_compliance_api.py"
        },
        "risk_management_and_portfolio_optimization": {
            "base_path": "/risk_management_and_portfolio_optimization",
            "description": "Risk Management And Portfolio Optimization",
            "docs": "/risk_management_and_portfolio_optimization/docs",
            "source_file": "Risk_Management_and_Portfolio_Optimization/portfolio_risk_api.py"
        },
        "transaction_fraud": {
            "base_path": "/transaction_fraud",
            "description": "Transaction Fraud",
            "docs": "/transaction_fraud/docs",
            "source_file": "Transaction_Fraud/transaction_fraud_detection_api.py"
        },
    },
        "total_count": 12
    }

@main_app.get("/urls")
async def get_service_urls():
    base_url = "http://localhost:8000"
    service_names = ["algorithmic_trading", "credit_card_default", "credit_score_prediction", "cryptocurrency_analysis_and_trading", "expense_categorization_and_financial_insights", "financial_document_processing", "fraud_detection", "personal_finance_ai", "realtime_news_sentiment_trading", "regulatory_compliance_and_aml_detection", "risk_management_and_portfolio_optimization", "transaction_fraud"]
    urls = {}
    for service_name in service_names:
        urls[service_name] = {
            "base": f"{base_url}/{service_name}",
            "docs": f"{base_url}/{service_name}/docs",
            "health": f"{base_url}/{service_name}/health"
        }
    return urls

if __name__ == "__main__":
    import uvicorn
    print("Starting Combined Realtime Finance API...")
    print(f"Found and mounted 12 services:")
    service_names = ["algorithmic_trading", "credit_card_default", "credit_score_prediction", "cryptocurrency_analysis_and_trading", "expense_categorization_and_financial_insights", "financial_document_processing", "fraud_detection", "personal_finance_ai", "realtime_news_sentiment_trading", "regulatory_compliance_and_aml_detection", "risk_management_and_portfolio_optimization", "transaction_fraud"]
    for service in service_names:
        print(f"  - {service}: /{service}")
    print("\nAccess the API at: http://localhost:8000")
    print("Main documentation: http://localhost:8000/docs")
    uvicorn.run("main_combined_api:main_app", host="0.0.0.0", port=8000, reload=True)