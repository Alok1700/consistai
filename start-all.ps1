# ConsistAI ML 3.0 Launcher for Windows PowerShell
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Starting ConsistAI ML 3.0 (All 3 Services)        " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "[1/3] Launching Python FastAPI ML Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -WorkingDirectory $root -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'ConsistAI ML Engine (Port 8000)'; python ml-service/main.py"

Write-Host "[2/3] Launching Express Backend API (Port 5000)..." -ForegroundColor Green
Start-Process powershell -WorkingDirectory "$root\backend" -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'ConsistAI Backend (Port 5000)'; npm run dev"

Write-Host "[3/3] Launching React Vite Frontend (Port 5173)..." -ForegroundColor Magenta
Start-Process powershell -WorkingDirectory "$root\frontend" -ArgumentList "-NoExit", "-Command", "`$host.UI.RawUI.WindowTitle = 'ConsistAI Frontend (Port 5173)'; npm run dev"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " All 3 services are launching in separate windows! " -ForegroundColor Cyan
Write-Host " Web App:  http://localhost:5173                   " -ForegroundColor White
Write-Host " Backend:  http://localhost:5000/api               " -ForegroundColor White
Write-Host " ML Docs:  http://localhost:8000/docs              " -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
