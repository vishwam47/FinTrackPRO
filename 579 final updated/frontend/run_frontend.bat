@echo off
cd /d "%~dp0"

echo Installing dependencies...
call npm install

echo.
echo Starting Frontend Development Server...
echo Port: 5173
echo.

npm run dev

pause