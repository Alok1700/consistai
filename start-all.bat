@echo off
title ConsistAI ML 3.0 Launcher
echo ===================================================
echo  Starting ConsistAI ML 3.0 (All 3 Services)
echo ===================================================

echo [1/3] Launching Python FastAPI ML Service (Port 8000)...
start "ConsistAI ML Engine (Port 8000)" cmd /k "python ml-service/main.py"

echo [2/3] Launching Express Backend API (Port 5000)...
start "ConsistAI Backend (Port 5000)" cmd /k "cd backend && npm run dev"

echo [3/3] Launching React Vite Frontend (Port 5173)...
start "ConsistAI Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo ===================================================
echo  All 3 services launched in separate windows!
echo  Open your browser at: http://localhost:5173
echo ===================================================
pause
