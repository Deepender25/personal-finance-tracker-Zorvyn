@echo off
title Finance Dashboard Launcher

echo ============================================
echo   Finance Dashboard - Starting Services
echo ============================================
echo.

:: ── Check venv exists ────────────────────────
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at .\venv\
    echo         Please create it first: python -m venv venv
    echo         Then install: venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

:: ── Check node_modules exists ────────────────
if not exist "frontend\node_modules" (
    echo [ERROR] node_modules not found in .\frontend\
    echo         Please run: cd frontend ^&^& npm install
    pause
    exit /b 1
)

echo [1/2] Starting Flask Backend on http://localhost:5000 ...
start "Flask Backend" cmd /k "title Flask Backend && venv\Scripts\python run.py"

:: Small delay so Flask starts first
timeout /t 2 /nobreak > nul

echo [2/2] Starting React Frontend on http://localhost:3000 ...
start "React Frontend" cmd /k "title React Frontend && cd frontend && npm run dev"

echo.
echo ============================================
echo   Both services are starting up!
echo   Backend  -> http://localhost:5000
echo   Frontend -> http://localhost:3000
echo ============================================
echo.
echo This window can be closed. Each service runs in its own window.
pause
