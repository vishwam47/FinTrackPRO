@echo off
title Realtime Finance - Master Startup
color 0A

echo ============================================
echo   REALTIME FINANCE - STARTING ALL SERVERS
echo ============================================
echo.

start "ML Server (Port 8000)" cmd /k "cd ML && run_ml_server.bat"
timeout /t 3 /nobreak >nul

start "Backend Server (Port 5000)" cmd /k "cd backend && run_backend.bat"
timeout /t 3 /nobreak >nul

start "Frontend Server (Port 5173)" cmd /k "cd frontend && run_frontend.bat"

echo.
echo ============================================
echo   ALL SERVERS STARTING...
echo ============================================
echo.
echo   ML API:       http://localhost:8000/docs
echo   Backend API:  http://localhost:5000
echo   Frontend:     http://localhost:5173
echo.
echo ============================================
echo   Press any key to exit this window
echo   (Servers will keep running)
echo ============================================

pause >nul