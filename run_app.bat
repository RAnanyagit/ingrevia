@echo off
echo =========================================
echo Starting Ingrevia Platform...
echo =========================================

echo 1. Starting Backend API on port 8001...
start "Ingrevia Backend" cmd /k "python -m uvicorn app.main:app --port 8001 --reload"

echo 2. Starting Frontend Application...
cd ingrevia-frontend
start "Ingrevia Frontend" cmd /k "npm start"

echo =========================================
echo Both servers have been launched in separate windows!
echo You can now use the app.
echo =========================================
