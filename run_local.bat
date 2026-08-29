@echo off
echo ======================================================================
echo Starting VAYU-CPI Production Servers (Backend API + Next.js Frontend)
echo ======================================================================

start "VAYU-CPI Backend API (Port 8000)" cmd /k "python start.py"
start "VAYU-CPI Frontend (Port 3000)" cmd /k "cd web && npm run dev"

echo.
echo Both servers are starting up:
echo - Backend API:  http://localhost:8000/docs
echo - Frontend UI:  http://localhost:3000
echo.
echo Opening dashboard in your default browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000
