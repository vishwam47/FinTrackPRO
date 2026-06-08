@echo off
cd /d "%~dp0"

echo Installing dependencies...
call npm install

echo.
echo Starting Backend Server...
echo Port: 5000
echo.

npm start

pause