import requests
import json

# API base URL
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    print("-" * 50)

def test_model_info():
    """Test the model info endpoint"""
    print("Testing model info...")
    response = requests.get(f"{BASE_URL}/model-info")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)

def test_full_prediction():
    """Test full prediction with all features"""
    print("Testing full prediction...")
    
    # Sample data for prediction
    sample_data = {
        "LIMIT_BAL": 20000.0,
        "SEX": 2,
        "EDUCATION": 2,
        "MARRIAGE": 1,
        "AGE": 24,
        "PAY_0": 2,
        "PAY_2": 2,
        "PAY_3": -1,
        "PAY_4": -1,
        "PAY_5": -2,
        "PAY_6": -2,
        "BILL_AMT1": 3913.0,
        "BILL_AMT2": 3102.0,
        "BILL_AMT3": 689.0,
        "BILL_AMT4": 0.0,
        "BILL_AMT5": 0.0,
        "BILL_AMT6": 0.0,
        "PAY_AMT1": 0.0,
        "PAY_AMT2": 689.0,
        "PAY_AMT3": 0.0,
        "PAY_AMT4": 0.0,
        "PAY_AMT5": 0.0,
        "PAY_AMT6": 0.0
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=sample_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)

def test_simplified_prediction():
    """Test simplified prediction"""
    print("Testing simplified prediction...")
    
    # Simplified sample data
    simple_data = {
        "LIMIT_BAL": 50000.0,
        "AGE": 30,
        "SEX": 2,
        "EDUCATION": 2,
        "MARRIAGE": 1,
        "BILL_AMT1": 3000.0,
        "PAY_AMT1": 2000.0
    }
    
    response = requests.post(f"{BASE_URL}/predict-simple", json=simple_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)

def test_batch_prediction():
    """Test batch prediction"""
    print("Testing batch prediction...")
    
    # Multiple records
    batch_data = [
        {
            "LIMIT_BAL": 20000.0,
            "SEX": 2,
            "EDUCATION": 2,
            "MARRIAGE": 1,
            "AGE": 24,
            "PAY_0": 2,
            "PAY_2": 2,
            "PAY_3": -1,
            "PAY_4": -1,
            "PAY_5": -2,
            "PAY_6": -2,
            "BILL_AMT1": 3913.0,
            "BILL_AMT2": 3102.0,
            "BILL_AMT3": 689.0,
            "BILL_AMT4": 0.0,
            "BILL_AMT5": 0.0,
            "BILL_AMT6": 0.0,
            "PAY_AMT1": 0.0,
            "PAY_AMT2": 689.0,
            "PAY_AMT3": 0.0,
            "PAY_AMT4": 0.0,
            "PAY_AMT5": 0.0,
            "PAY_AMT6": 0.0
        },
        {
            "LIMIT_BAL": 120000.0,
            "SEX": 2,
            "EDUCATION": 2,
            "MARRIAGE": 2,
            "AGE": 26,
            "PAY_0": -1,
            "PAY_2": 2,
            "PAY_3": 0,
            "PAY_4": 0,
            "PAY_5": 0,
            "PAY_6": 2,
            "BILL_AMT1": 2682.0,
            "BILL_AMT2": 1725.0,
            "BILL_AMT3": 2682.0,
            "BILL_AMT4": 3272.0,
            "BILL_AMT5": 3455.0,
            "BILL_AMT6": 3261.0,
            "PAY_AMT1": 0.0,
            "PAY_AMT2": 1000.0,
            "PAY_AMT3": 1000.0,
            "PAY_AMT4": 1000.0,
            "PAY_AMT5": 0.0,
            "PAY_AMT6": 2000.0
        }
    ]
    
    response = requests.post(f"{BASE_URL}/predict-batch", json=batch_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 50)

def test_feature_info():
    """Test feature info endpoint"""
    print("Testing feature info...")
    response = requests.get(f"{BASE_URL}/feature-info")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total Features: {data['total_features']}")
        print("Features:")
        for feature in data['features'][:5]:  # Show first 5 features
            print(f"  - {feature['name']}: {feature['description']}")
        print("  ... (and more)")
    else:
        print(f"Error: {response.json()}")
    print("-" * 50)

def run_all_tests():
    """Run all API tests"""
    print("=" * 60)
    print("CREDIT CARD DEFAULT PREDICTION API TESTS")
    print("=" * 60)
    
    try:
        # Test basic endpoints
        test_health_check()
        test_model_info()
        test_feature_info()
        
        # Test prediction endpoints
        test_simplified_prediction()
        test_full_prediction()
        test_batch_prediction()
        
        print("✅ All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API.")
        print("Make sure the FastAPI server is running:")
        print("python app.py")
        print("or")
        print("uvicorn app:app --reload")
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")

if __name__ == "__main__":
    run_all_tests()