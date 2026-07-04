@echo off
title ChordRealm Dev Server
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found on your PATH.
  echo   Install it from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo   Installing dependencies for the first time. Please wait...
  call npm install
)

echo.
echo   ============================================
echo     Starting ChordRealm
echo     Your browser will open at localhost:3000
echo     Keep this window open while using the app.
echo     Close it (or press Ctrl+C) to stop.
echo   ============================================
echo.

start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000'"

call npm run dev

echo.
echo   Dev server stopped.
pause
