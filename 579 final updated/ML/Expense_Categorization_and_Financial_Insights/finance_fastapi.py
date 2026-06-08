from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import httpx
import pandas as pd
import json
import logging
from datetime import datetime
import io
import os
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Personal Finance AI API",
    description="API for automated expense categorization and financial insights",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
class Settings:
    FINA_API_URL = "https://app.fina.money/api/resource/categorize"
    FINA_API_KEY = os.getenv("FINA_API_KEY", "fina-api-test")  # Use environment variable in production
    PARTNER_ID = os.getenv("PARTNER_ID", "your-partner-id")   # Set your actual partner ID

settings = Settings()

# Pydantic Models
class TransactionInput(BaseModel):
    name: str = Field(..., description="Transaction description/merchant name")
    merchant: Optional[str] = Field(None, description="Merchant name (optional)")
    amount: float = Field(..., description="Transaction amount (negative for expenses)")
    date: Optional[str] = Field(None, description="Transaction date (YYYY-MM-DD)")
    account: Optional[str] = Field(None, description="Account name")

class FinaAPIRequest(BaseModel):
    name: str
    merchant: Optional[str] = None
    amount: float

class CategoryResponse(BaseModel):
    category: str
    subcategory: Optional[str] = None
    confidence: Optional[float] = None

class CategorizedTransaction(BaseModel):
    original_transaction: TransactionInput
    category: str
    subcategory: Optional[str] = None
    confidence: Optional[float] = None
    fina_response: Optional[Dict] = None

class BatchCategorizationResponse(BaseModel):
    success: bool
    categorized_transactions: List[CategorizedTransaction]
    total_processed: int
    errors: List[str] = []

class FileUploadResponse(BaseModel):
    success: bool
    total_transactions: int
    categorized_transactions: List[CategorizedTransaction]
    errors: List[str] = []

# API Version Enum
class APIVersion(str, Enum):
    v2 = "v2"
    v3 = "v3"

# Helper Functions
async def call_fina_api(
    transactions: List[FinaAPIRequest], 
    api_version: APIVersion = APIVersion.v2,
    enable_mapping: bool = False
) -> Dict[str, Any]:
    """Call Fina API for transaction categorization"""
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": settings.FINA_API_KEY,
        "x-partner-id": settings.PARTNER_ID,
        "x-api-model": api_version.value,
        "x-api-mapping": str(enable_mapping).lower()
    }
    
    # Convert transactions to the format expected by Fina API
    payload = [
        {
            "name": txn.name,
            "merchant": txn.merchant or "",
            "amount": txn.amount
        }
        for txn in transactions
    ]
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.FINA_API_URL,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPStatusError as e:
        logger.error(f"Fina API HTTP error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Fina API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"Fina API request error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to Fina API: {str(e)}"
        )

def parse_csv_transactions(file_content: bytes) -> List[TransactionInput]:
    """Parse CSV file and extract transactions"""
    try:
        # Read CSV content
        df = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
        
        # Common CSV column mappings
        column_mappings = {
            'description': ['description', 'desc', 'transaction', 'merchant', 'name'],
            'merchant': ['merchant', 'merchant_name', 'payee', 'vendor'],
            'amount': ['amount', 'debit', 'credit', 'value', 'transaction_amount'],
            'date': ['date', 'transaction_date', 'posted_date', 'created_date'],
            'account': ['account', 'account_name', 'account_number']
        }
        
        # Find actual column names
        actual_columns = {}
        for field, possible_names in column_mappings.items():
            for col in df.columns:
                if col.lower().strip() in [name.lower() for name in possible_names]:
                    actual_columns[field] = col
                    break
        
        transactions = []
        for _, row in df.iterrows():
            # Extract required fields
            name = str(row.get(actual_columns.get('description', df.columns[0]), '')).strip()
            amount = float(row.get(actual_columns.get('amount', df.columns[1]), 0))
            
            # Optional fields
            merchant = str(row.get(actual_columns.get('merchant', ''), '')).strip() or None
            date = str(row.get(actual_columns.get('date', ''), '')).strip() or None
            account = str(row.get(actual_columns.get('account', ''), '')).strip() or None
            
            if name and amount != 0:  # Only include valid transactions
                transactions.append(TransactionInput(
                    name=name,
                    merchant=merchant,
                    amount=amount,
                    date=date,
                    account=account
                ))
        
        return transactions
    
    except Exception as e:
        logger.error(f"Error parsing CSV: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing CSV file: {str(e)}"
        )

def process_fina_response(transactions: List[TransactionInput], fina_response: List[Dict]) -> List[CategorizedTransaction]:
    """Process Fina API response and match with original transactions"""
    categorized = []
    
    for i, (transaction, response) in enumerate(zip(transactions, fina_response)):
        try:
            # Extract category information from Fina response
            category = response.get('category', 'Unknown')
            subcategory = response.get('subcategory')
            confidence = response.get('confidence')
            
            categorized.append(CategorizedTransaction(
                original_transaction=transaction,
                category=category,
                subcategory=subcategory,
                confidence=confidence,
                fina_response=response
            ))
        except Exception as e:
            logger.error(f"Error processing transaction {i}: {str(e)}")
            categorized.append(CategorizedTransaction(
                original_transaction=transaction,
                category="Error",
                subcategory=None,
                confidence=None,
                fina_response={"error": str(e)}
            ))
    
    return categorized

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Personal Finance AI API",
        "version": "1.0.0",
        "endpoints": {
            "categorize_transaction": "/categorize/single",
            "categorize_batch": "/categorize/batch",
            "upload_csv": "/categorize/upload-csv",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/categorize/single", response_model=CategorizedTransaction)
async def categorize_single_transaction(
    transaction: TransactionInput,
    api_version: APIVersion = APIVersion.v2,
    enable_mapping: bool = False
):
    """Categorize a single transaction using Fina API"""
    
    # Convert to Fina API format
    fina_request = FinaAPIRequest(
        name=transaction.name,
        merchant=transaction.merchant,
        amount=transaction.amount
    )
    
    # Call Fina API
    fina_response = await call_fina_api([fina_request], api_version, enable_mapping)
    
    # Process response
    categorized = process_fina_response([transaction], fina_response)
    
    return categorized[0]

@app.post("/categorize/batch", response_model=BatchCategorizationResponse)
async def categorize_batch_transactions(
    transactions: List[TransactionInput],
    api_version: APIVersion = APIVersion.v2,
    enable_mapping: bool = False
):
    """Categorize multiple transactions in batch using Fina API"""
    
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions provided")
    
    if len(transactions) > 100:  # Limit batch size
        raise HTTPException(status_code=400, detail="Maximum 100 transactions per batch")
    
    errors = []
    categorized_transactions = []
    
    try:
        # Convert to Fina API format
        fina_requests = [
            FinaAPIRequest(
                name=txn.name,
                merchant=txn.merchant,
                amount=txn.amount
            )
            for txn in transactions
        ]
        
        # Call Fina API
        fina_response = await call_fina_api(fina_requests, api_version, enable_mapping)
        
        # Process response
        categorized_transactions = process_fina_response(transactions, fina_response)
        
    except Exception as e:
        errors.append(f"Batch processing error: {str(e)}")
        logger.error(f"Batch categorization error: {str(e)}")
    
    return BatchCategorizationResponse(
        success=len(errors) == 0,
        categorized_transactions=categorized_transactions,
        total_processed=len(transactions),
        errors=errors
    )

@app.post("/categorize/upload-csv", response_model=FileUploadResponse)
async def upload_and_categorize_csv(
    file: UploadFile = File(...),
    api_version: APIVersion = APIVersion.v2,
    enable_mapping: bool = False
):
    """Upload CSV file and categorize all transactions"""
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Read file content
    content = await file.read()
    
    # Parse transactions from CSV
    transactions = parse_csv_transactions(content)
    
    if not transactions:
        raise HTTPException(status_code=400, detail="No valid transactions found in CSV")
    
    errors = []
    categorized_transactions = []
    
    try:
        # Process in batches if there are many transactions
        batch_size = 50
        for i in range(0, len(transactions), batch_size):
            batch = transactions[i:i + batch_size]
            
            # Convert to Fina API format
            fina_requests = [
                FinaAPIRequest(
                    name=txn.name,
                    merchant=txn.merchant,
                    amount=txn.amount
                )
                for txn in batch
            ]
            
            # Call Fina API
            fina_response = await call_fina_api(fina_requests, api_version, enable_mapping)
            
            # Process response
            batch_categorized = process_fina_response(batch, fina_response)
            categorized_transactions.extend(batch_categorized)
    
    except Exception as e:
        errors.append(f"Processing error: {str(e)}")
        logger.error(f"CSV processing error: {str(e)}")
    
    return FileUploadResponse(
        success=len(errors) == 0,
        total_transactions=len(transactions),
        categorized_transactions=categorized_transactions,
        errors=errors
    )

@app.get("/categories/summary")
async def get_category_summary(transactions: List[CategorizedTransaction]):
    """Get summary of categorized transactions by category"""
    
    category_summary = {}
    total_amount = 0
    
    for txn in transactions:
        category = txn.category
        amount = abs(txn.original_transaction.amount)  # Use absolute value
        
        if category not in category_summary:
            category_summary[category] = {
                "total_amount": 0,
                "transaction_count": 0,
                "subcategories": {}
            }
        
        category_summary[category]["total_amount"] += amount
        category_summary[category]["transaction_count"] += 1
        total_amount += amount
        
        # Track subcategories
        if txn.subcategory:
            subcategory = txn.subcategory
            if subcategory not in category_summary[category]["subcategories"]:
                category_summary[category]["subcategories"][subcategory] = {
                    "amount": 0,
                    "count": 0
                }
            category_summary[category]["subcategories"][subcategory]["amount"] += amount
            category_summary[category]["subcategories"][subcategory]["count"] += 1
    
    # Calculate percentages
    for category in category_summary:
        if total_amount > 0:
            category_summary[category]["percentage"] = round(
                (category_summary[category]["total_amount"] / total_amount) * 100, 2
            )
        else:
            category_summary[category]["percentage"] = 0
    
    return {
        "total_amount": total_amount,
        "total_transactions": len(transactions),
        "categories": category_summary
    }

# Error Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": True,
        "message": exc.detail,
        "status_code": exc.status_code
    }
