# reproduce_env.ps1
# Automates the clean setup of the ML environment to resolve TensorFlow/Google-AI conflicts.

Write-Host "--- ML Environment Setup Script ---" -ForegroundColor Cyan

# 1. Clean up conflicting packages
Write-Host "[1/4] Uninstalling conflicting packages..." -ForegroundColor Yellow
pip uninstall -y tensorflow tensorflow-intel keras protobuf google-generativeai google-ai-generativelanguage

# 2. Install the bridge dependency first
Write-Host "[2/4] Installing Protobuf bridge..." -ForegroundColor Yellow
pip install protobuf==4.25.3

# 3. Install core AI stack
Write-Host "[3/4] Installing Core Stack (TensorFlow 2.15.0 + Google-GenAI 0.5.4)..." -ForegroundColor Yellow
pip install tensorflow-intel==2.15.0 google-generativeai==0.5.4 keras==2.15.0

# 4. Install all other dependencies
Write-Host "[4/4] Installing all other dependencies from requirements.txt..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "--- Setup Complete ---" -ForegroundColor Green
Write-Host "Run 'python -c `"import tensorflow; import google.generativeai; print('Success! Environment is stable.')`"' to verify." -ForegroundColor Cyan
