# Financial Document Processing API Setup Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt

# Install spaCy English model for NLP
python -m spacy download en_core_web_sm
```

### 2. Environment Variables
Create a `.env` file in your project root:
```bash
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Get Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing one
3. Generate an API key
4. Copy the key to your `.env` file

### 4. Run the API
```bash
# Development mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📋 API Endpoints

### Base URL: `http://localhost:8000`

### 1. Health Check
```
GET /health
```

### 2. Extract Raw Text
```
POST /extract/text
Content-Type: multipart/form-data
Body: file (PDF or image)
```

### 3. Process Any Financial Document
```
POST /process/document
Content-Type: multipart/form-data
Body: file (PDF or image)
```
**Response includes:**
- Document type detection
- Raw extracted text
- Structured data (varies by document type)
- Named entities
- Processing time

### 4. Process Invoice (Specialized)
```
POST /process/invoice
Content-Type: multipart/form-data
Body: file (PDF or image)
```
**Extracts:**
- Invoice number, dates
- Vendor/customer information
- Line items and amounts
- Totals and tax information

### 5. Process Bank Statement (Specialized)
```
POST /process/bank-statement
Content-Type: multipart/form-data
Body: file (PDF or image)
```
**Extracts:**
- Bank and account information
- Statement period
- Opening/closing balances
- Transaction details

## 🧪 Testing the API

### Using curl:
```bash
# Test with an invoice PDF
curl -X POST "http://localhost:8000/process/invoice" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@invoice.pdf"

# Test with an image
curl -X POST "http://localhost:8000/process/document" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@receipt.jpg"
```

### Using Python requests:
```python
import requests

# Process an invoice
with open('invoice.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/process/invoice',
        files={'file': f}
    )
    result = response.json()
    print(result)
```

### Interactive API Documentation:
Visit `http://localhost:8000/docs` for Swagger UI documentation where you can test all endpoints interactively.

## 📊 Supported File Types

### PDFs
- ✅ Digital PDFs (with embedded text)
- ✅ Scanned PDFs (image-based)
- ✅ Multi-page documents
- ✅ Password-protected PDFs (if readable)

### Images
- ✅ JPEG/JPG
- ✅ PNG
- ✅ TIFF
- ✅ BMP
- ✅ WEBP

## 📄 Document Types Supported

### Automatically Detected:
- **Invoices**: Vendor invoices, service bills
- **Bank Statements**: Account statements, transaction history
- **Receipts**: Purchase receipts, expense receipts
- **Balance Sheets**: Financial position statements
- **Income Statements**: P&L statements
- **Unknown**: Falls back to general text extraction

## 🔧 Customization Options

### Custom Prompts
You can modify the prompts in the code to extract specific information:

```python
# Example: Custom invoice prompt
custom_prompt = """
Extract the following from this invoice:
1. All line items with part numbers
2. Payment terms and conditions
3. Shipping and handling charges
4. Discount information
"""
```

### Adding New Document Types
1. Add detection logic in `detect_document_type()`
2. Create a new Pydantic model for the document structure
3. Add parsing logic in a new method
4. Create a specialized endpoint

### Enhanced Entity Recognition
The API uses spaCy for entity recognition. You can enhance it by:
- Training custom models
- Adding domain-specific patterns
- Using financial NER models

## 🚨 Error Handling

### Common Errors:
- **400**: Invalid file type or corrupted file
- **500**: Gemini API error or processing failure

### Debug Mode:
Set `DEBUG=True` in environment for detailed error messages.

## 🔒 Security Considerations

### For Production:
1. Add authentication/authorization
2. Implement rate limiting
3. Validate file sizes and types
4. Sanitize extracted data
5. Use HTTPS
6. Monitor API usage

### Example with API Key authentication:
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

def verify_token(token: str = Depends(security)):
    if token.credentials != "your-secret-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return token
```

## 📈 Performance Optimization

### For High Volume:
1. Implement async processing with Celery
2. Add Redis caching for repeated documents
3. Use multiple workers: `uvicorn main:app --workers 4`
4. Consider batch processing endpoints
5. Implement document preprocessing

### Monitoring:
- Add logging with structured formats
- Monitor processing times
- Track success rates
- Monitor Gemini API usage

## 🛠️ Advanced Features

### Batch Processing:
```python
@app.post("/process/batch")
async def process_batch(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        # Process each file
        result = await process_financial_document(file)
        results.append(result)
    return {"results": results}
```

### Webhook Support:
```python
@app.post("/process/async")
async def process_async(file: UploadFile, webhook_url: str):
    # Process document asynchronously
    # Send result to webhook_url when complete
    pass
```

## 📝 Example Response Formats

### Invoice Response:
```json
{
  "invoice_number": "INV-2024-001",
  "invoice_date": "2024-01-15",
  "vendor_name": "ABC Corp",
  "total_amount": 1250.00,
  "currency": "USD",
  "line_items": [
    {
      "description": "Professional Services",
      "quantity": 10,
      "unit_price": 125.00,
      "total": 1250.00
    }
  ]
}
```

### Document Processing Response:
```json
{
  "document_type": "invoice",
  "extracted_text": "INVOICE\nINV-2024-001...",
  "structured_data": {
    "invoice_number": "INV-2024-001",
    "total_amount": 1250.00
  },
  "entities": [
    {
      "text": "ABC Corp",
      "label": "ORG",
      "description": "Companies, agencies, institutions"
    }
  ],
  "processing_time": 2.34
}
```

This API provides a solid foundation for financial document processing using Google Gemini. You can extend it based on your specific needs!