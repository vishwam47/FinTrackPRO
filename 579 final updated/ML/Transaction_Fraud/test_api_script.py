# test_api.py
import requests
import json

# API endpoint
BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print("Health Check:", response.json())

def test_single_prediction():
    """Test single fraud prediction"""
    # Example of a potentially fraudulent transaction (based on your analysis)
    fraud_transaction = {
        "amount": 1000000.0,
        "oldbalanceOrg": 1000000.0,
        "newbalanceOrig": 0.0,  # Account drained completely
        "oldbalanceDest": 0.0,
        "newbalanceDest": 1000000.0,
        "transaction_type": "TRANSFER"
    }
    
    # Example of a normal transaction
    normal_transaction = {
        "amount": 5000.0,
        "oldbalanceOrg": 50000.0,
        "newbalanceOrig": 45000.0,
        "oldbalanceDest": 10000.0,
        "newbalanceDest": 15000.0,
        "transaction_type": "PAYMENT"
    }
    
    print("\n=== Testing Potentially Fraudulent Transaction ===")
    response = requests.post(f"{BASE_URL}/predict", json=fraud_transaction)
    print("Input:", json.dumps(fraud_transaction, indent=2))
    print("Result:", json.dumps(response.json(), indent=2))
    
    print("\n=== Testing Normal Transaction ===")
    response = requests.post(f"{BASE_URL}/predict", json=normal_transaction)
    print("Input:", json.dumps(normal_transaction, indent=2))
    print("Result:", json.dumps(response.json(), indent=2))

def test_batch_prediction():
    """Test batch fraud prediction"""
    transactions = [
        {
            "amount": 500000.0,
            "oldbalanceOrg": 500000.0,
            "newbalanceOrig": 0.0,
            "oldbalanceDest": 0.0,
            "newbalanceDest": 500000.0,
            "transaction_type": "CASH_OUT"
        },
        {
            "amount": 1500.0,
            "oldbalanceOrg": 10000.0,
            "newbalanceOrig": 8500.0,
            "oldbalanceDest": 5000.0,
            "newbalanceDest": 6500.0,
            "transaction_type": "PAYMENT"
        }
    ]
    
    print("\n=== Testing Batch Prediction ===")
    response = requests.post(f"{BASE_URL}/predict_batch", json=transactions)
    print("Result:", json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    try:
        test_health()
        test_single_prediction()
        test_batch_prediction()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to API. Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"Error: {e}")