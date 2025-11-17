@echo off
REM ============================================================================
REM Midnight Consolidation Tool - Windows Setup Script
REM ============================================================================
REM This script performs complete setup:
REM 1. Checks for Node.js 20.x
REM 2. Installs all dependencies
REM 3. Builds Vite application
REM 4. Opens browser and starts the app
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ================================================================================
echo                 Midnight Consolidation Tool - Setup
echo ================================================================================
echo.

REM ============================================================================
REM Check Node.js
REM ============================================================================
echo [1/4] Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found!
    echo.
    echo Please download and install Node.js 20.x from:
    echo https://nodejs.org/dist/v20.19.3/node-v20.19.3-x64.msi
    echo.
    echo After installation, run this script again.
    pause
    start https://nodejs.org/dist/v20.19.3/node-v20.19.3-x64.msi
    exit /b 1
) else (
    echo Node.js found!
    node --version
    echo.
)

REM ============================================================================
REM Install dependencies
REM ============================================================================
echo [2/4] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed!
echo.

REM ============================================================================
REM Build application (skipped for dev mode - Vite builds on the fly)
REM ============================================================================
echo [3/4] Preparing application...
echo Build will happen automatically when you start the dev server.
echo.

REM ============================================================================
REM Setup complete, display info
REM ============================================================================
echo ================================================================================
echo                         Setup Complete!
echo ================================================================================
echo.
echo Your wallet and consolidation data will be stored in:
echo   %USERPROFILE%\Documents\MidnightConsolidationTool\
echo.
echo This allows you to update the software without losing your data.
echo.

REM ============================================================================
REM Start application
REM ============================================================================
echo [4/4] Starting application...
echo.

echo ================================================================================
echo              Midnight Consolidation Tool - Ready!
echo ================================================================================
echo.
echo Web Interface: http://localhost:3000
echo.
echo The application will open in your default browser.
echo Press Ctrl+C to stop the server.
echo ================================================================================
echo.

REM ============================================================================
REM Start terminal launcher server in a new window
REM ============================================================================
echo [4/4] Starting Terminal Launcher on port 3002...
start "Terminal Launcher" /MIN cmd /c "node \"scripts\terminal-launcher.cjs\""

REM Wait for server to start
echo Waiting for terminal launcher to start...
timeout /t 3 /nobreak >nul

REM Verify launcher is running
netstat -ano | findstr ":3002" >nul 2>&1
if %errorlevel% equ 0 (
    echo Terminal launcher started successfully on port 3002
) else (
    echo Warning: Terminal launcher may not be running on port 3002
)

echo.
echo ================================================================================
echo              Midnight Consolidation Tool - Ready!
echo ================================================================================
echo.
echo Web Interface:     http://localhost:3000
echo Terminal Launcher:  http://localhost:3002
echo.
echo The application will open in your default browser.
echo Consolidation will run in a separate terminal window (fully transparent).
echo.
echo IMPORTANT: Keep both this window and the "Terminal Launcher" window open.
echo            Press Ctrl+C in either window to stop the servers.
echo ================================================================================
echo.

REM Start Vite (will auto-open browser)
call npm run dev
