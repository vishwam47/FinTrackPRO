import requests
import json

# API endpoint
BASE_URL = "http://localhost:8000"

def test_single_prediction():
    # Example transaction data
    transaction_data = {
        "amt": 100.50,
        "gender": 1,  # Male
        "city_pop": 50000,
        "age": 35.0,
        "trans_month": 6,
        "trans_year": 2020,
        "latitudinal_distance": 0.5,
        "longitudinal_distance": 0.3,
        "category_food_dining": 0,
        "category_gas_transport": 1,  # Gas station transaction
        "category_grocery_net": 0,
        "category_grocery_pos": 0,
        "category_health_fitness": 0,
        "category_home": 0,
        "category_kids_pets": 0,
        "category_misc_net": 0,
        "category_misc_pos": 0,
        "category_personal_care": 0,
        "category_shopping_net": 0,
        "category_shopping_pos": 0,
        "category_travel": 0
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=transaction_data)
    
    if response.status_code == 200:
        result = response.json()
        print("Prediction Result:")
        print(f"Is Fraud: {result['is_fraud']}")
        print(f"Fraud Probability: {result['fraud_probability']:.4f}")
        print(f"Prediction: {result['prediction_text']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

def test_health_check():
    response = requests.get(f"{BASE_URL}/health")
    print("Health Check:", response.json())

def test_model_info():
    response = requests.get(f"{BASE_URL}/model-info")
    print("Model Info:", response.json())

def test_suspicious_transaction():
    # Example of a potentially fraudulent transaction
    suspicious_data = {
        "amt": 5000.0,  # High amount
        "gender": 0,
        "city_pop": 1000,  # Small city
        "age": 25.0,
        "trans_month": 12,
        "trans_year": 2020,
        "latitudinal_distance": 5.0,  # Far from customer location
        "longitudinal_distance": 8.0,  # Far from customer location
        "category_food_dining": 0,
        "category_gas_transport": 0,
        "category_grocery_net": 1,  # Online grocery (common fraud category)
        "category_grocery_pos": 0,
        "category_health_fitness": 0,
        "category_home": 0,
        "category_kids_pets": 0,
        "category_misc_net": 0,
        "category_misc_pos": 0,
        "category_personal_care": 0,
        "category_shopping_net": 0,
        "category_shopping_pos": 0,
        "category_travel": 0
    }
    
    response = requests.post(f"{BASE_URL}/predict", json=suspicious_data)
    
    if response.status_code == 200:
        result = response.json()
        print("\nSuspicious Transaction Result:")
        print(f"Is Fraud: {result['is_fraud']}")
        print(f"Fraud Probability: {result['fraud_probability']:.4f}")
        print(f"Prediction: {result['prediction_text']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

if __name__ == "__main__":
    print("Testing Fraud Detection API...")
    
    # Test health check
    test_health_check()
    print()
    
    # Test model info
    test_model_info()
    print()
    
    # Test normal transaction
    test_single_prediction()
    
    # Test suspicious transaction
    test_suspicious_transaction()
