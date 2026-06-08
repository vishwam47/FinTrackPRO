# Credit Card Fraud Detection API Setup

## 1. Save Your Model
First, run the model saving code in your Jupyter notebook after training:

```python
# Add this to your notebook after training dtc2
import pickle
import joblib

# Save the best model
joblib.dump(dtc2, 'fraud_detection_model.pkl')

# Save feature columns
feature_columns = X_train.columns.tolist()
with open('feature_columns.pkl', 'wb') as f:
    pickle.dump(feature_columns, f)

print("Model saved successfully!")
```

## 2. Install Dependencies
```bash
pip install -r requirements.txt
```

## 3. Run the FastAPI Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or if you named your file differently:
```bash
python your_fastapi_file.py
```

## 4. Access the API

### Interactive Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### API Endpoints

#### Single Prediction
**POST** `/predict`
```json
{
  "amt": 100.50,
  "gender": 1,
  "city_pop": 50000,
  "age": 35.0,
  "trans_month": 6,
  "trans_year": 2020,
  "latitudinal_distance": 0.5,
  "longitudinal_distance": 0.3,
  "category_gas_transport": 1,
  "category_food_dining": 0,
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
```

#### Health Check
**GET** `/health`

#### Model Information
**GET** `/model-info`

## 5. Test the API
Run the test script:
```bash
python test_api.py
```

## Input Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| amt | float | Transaction amount |
| gender | int | 0 = Female, 1 = Male |
| city_pop | int | Population of the city |
| age | float | Customer age |
| trans_month | int | Transaction month (1-12) |
| trans_year | int | Transaction year |
| latitudinal_distance | float | Distance between customer and merchant (latitude) |
| longitudinal_distance | float | Distance between customer and merchant (longitude) |
| category_* | int | Binary flags for transaction categories (0 or 1) |

## Response Format
```json
{
  "is_fraud": 0,
  "fraud_probability": 0.1234,
  "prediction_text": "Legitimate Transaction"
}
```

## Example cURL Commands

### Legitimate Transaction
```bash
curl -X POST "http://localhost:8000/predict" \
-H "Content-Type: application/json" \
-d '{
  "amt": 50.0,
  "gender": 1,
  "city_pop": 100000,
  "age": 30.0,
  "trans_month": 6,
  "trans_year": 2020,
  "latitudinal_distance": 0.1,
  "longitudinal_distance": 0.1,
  "category_food_dining": 1,
  "category_gas_transport": 0,
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
}'
```

### Suspicious Transaction
```bash
curl -X POST "http://localhost:8000/predict" \
-H "Content-Type: application/json" \
-d '{
  "amt": 5000.0,
  "gender": 0,
  "city_pop": 1000,
  "age": 25.0,
  "trans_month": 12,
  "trans_year": 2020,
  "latitudinal_distance": 10.0,
  "longitudinal_distance": 15.0,
  "category_shopping_net": 1,
  "category_food_dining": 0,
  "category_gas_transport": 0,
  "category_grocery_net": 0,
  "category_grocery_pos": 0,
  "category_health_fitness": 0,
  "category_home": 0,
  "category_kids_pets": 0,
  "category_misc_net": 0,
  "category_misc_pos": 0,
  "category_personal_care": 0,
  "category_shopping_pos": 0,
  "category_travel": 0
}'
```
