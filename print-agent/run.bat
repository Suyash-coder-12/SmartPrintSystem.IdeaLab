@echo off
title SmartPrint Local Print Agent (TypeScript)
echo ==========================================================
echo   SMARTPRINT LOCAL PRINT AGENT DAEMON
echo   Polling http://127.0.0.1:8000/api
echo ==========================================================
node dist/agent.js
pause
