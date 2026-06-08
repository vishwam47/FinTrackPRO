"""
Script to remove 'if __name__ == "__main__"' blocks from FastAPI files
This prepares them for importing in the combined API
"""

import os
import re

def remove_main_block(file_path):
    """Remove the if __name__ == '__main__' block from a Python file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match if __name__ == "__main__": block
        # Fixed the regex pattern - escaped the quotes properly
        pattern = r'\n\s*if\s+__name__\s*==\s*["\']__main__["\']\s*:\s*\n[\s\S]*?(?=\n\S|\n*$)'
        
        # Remove the block
        new_content = re.sub(pattern, '', content)
        
        # Also remove any trailing uvicorn.run statements that might be outside the if block
        uvicorn_pattern = r'\n\s*uvicorn\.run\([^)]*\).*?(?=\n|$)'
        new_content = re.sub(uvicorn_pattern, '', new_content)
        
        # Additional pattern to catch any remaining import uvicorn statements at the end
        import_uvicorn_pattern = r'\n\s*import uvicorn\s*\n\s*uvicorn\.run.*?(?=\n|$)'
        new_content = re.sub(import_uvicorn_pattern, '', new_content)
        
        # Clean up any trailing whitespace at the end of file
        new_content = new_content.rstrip() + '\n'
        
        # Write back if content changed
        if new_content != content:
            # Create backup
            backup_path = file_path + '.backup'
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Write modified content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✅ Modified: {file_path} (backup created)")
            return True
        else:
            print(f"⏭️  No changes needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    files_to_process = [
        "Algorithmic_Trading/trading_api.py",
        "Credit_Card_Default/fastapi_credit_card_app.py",
        "Credit_Score_Prediction/fastapi_credit_score.py",
        "Cryptocurrency_Analysis_and_Trading/crypto_trading_api.py",
        "Expense_Categorization_and_Financial_Insights/finance_fastapi.py",
        "Financial_Document_Processing/financial_doc_api.py",
        "Fraud_Detection/cc_fraud_api.py",
        "Personal_Finance_AI/personal_finance_fastapi.py",
        "Realtime_News_Sentiment_Trading/yfinance_pyfin_trading_api.py",
        "Regulatory_Compliance_and_AML_Detection/aml_compliance_api.py",
        "Risk_Management_and_Portfolio_Optimization/portfolio_risk_api.py",
        "Transaction_Fraud/tranaction_fraud_detection_api.py",
    ]
    
    print("Removing 'if __name__ == \"__main__\"' blocks from FastAPI files...")
    print("Backups will be created with .backup extension\n")
    
    modified_count = 0
    for file_path in files_to_process:
        if os.path.exists(file_path):
            if remove_main_block(file_path):
                modified_count += 1
        else:
            print(f"⚠️  File not found: {file_path}")
    
    print(f"\n📋 Summary: {modified_count} files modified out of {len(files_to_process)} files")
    print("\n🚀 You can now run: python main_combined_api.py")

if __name__ == "__main__":
    main()