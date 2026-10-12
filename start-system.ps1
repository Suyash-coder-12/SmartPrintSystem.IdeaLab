# SmartPrint Enterprise System Launcher (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SMARTPRINT - XEROX CENTER MANAGEMENT SYSTEM" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "1. Starting Backend PHP API Server (http://127.0.0.1:8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; php -c php.ini -S 127.0.0.1:8000 -t public"

Write-Host "2. Starting Frontend Web App (http://localhost:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host "3. Starting Local Print Agent Daemon..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\print-agent'; node dist/agent.js"

Write-Host "All services initiated! Navigating to http://localhost:5173..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
