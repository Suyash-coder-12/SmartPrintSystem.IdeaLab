@echo off
title SmartPrint PHP API Backend (Port 8000)
echo ==========================================================
echo   SMARTPRINT BACKEND API (PHP 8.5)
echo   Listening on http://127.0.0.1:8000
echo ==========================================================
php -c php.ini -S 127.0.0.1:8000 -t public
pause
