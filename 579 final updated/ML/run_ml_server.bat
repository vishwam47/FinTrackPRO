@echo off
cd /d "%~dp0"

echo Installing/Updating Python dependencies...
echo This may take a few minutes on first run...
echo.

pip install -r requirements.txt --quiet

echo.
echo Starting ML Server...
echo Port: 8000
echo.

python -m uvicorn main_combined_api:main_app --host 0.0.0.0 --port 8000 --reload

pause