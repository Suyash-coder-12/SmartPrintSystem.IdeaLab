@echo off
title SmartPrint Enterprise System Launcher
echo ==========================================================
echo   SMARTPRINT - XEROX CENTER MANAGEMENT SYSTEM
echo ==========================================================
echo 1. Starting Backend PHP API Server on http://127.0.0.1:8000 ...
start "SmartPrint PHP API" cmd /k "cd /d %~dp0backend && php -c php.ini -S 127.0.0.1:8000 -t public"

echo 2. Starting Frontend Web App on http://localhost:5173 ...
start "SmartPrint Frontend (React/Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo 3. Starting Local Print Agent Daemon ...
start "SmartPrint Local Agent" cmd /k "cd /d %~dp0print-agent && node dist/agent.js"

echo ==========================================================
echo All services launched!
echo Open your browser at: http://localhost:5173
echo ==========================================================
timeout /t 3 >nul
start http://localhost:5173
