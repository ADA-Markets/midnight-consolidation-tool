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

REM Get the current directory (where setup.cmd is located)
REM Remove trailing backslash if present
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
cd /d "%SCRIPT_DIR%"

REM Check if port 3002 is already in use and stop existing processes
netstat -ano | findstr ":3002" >nul 2>&1
if %errorlevel% equ 0 (
    echo Warning: Port 3002 is already in use.
    echo Stopping existing processes on port 3002...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
        echo Stopping process with PID: %%a
        taskkill /PID %%a /F >nul 2>&1
        echo Stopped process %%a
    )
    echo Waiting 2 seconds for port to be released...
    timeout /t 2 /nobreak >nul
)

REM Start terminal launcher in a visible window (not minimized) so we can see errors
REM Change to the script directory first
cd /d "%SCRIPT_DIR%"

REM Create a simple launcher batch file to avoid quoting issues
set "LAUNCHER_BAT=%TEMP%\midnight-launcher-%RANDOM%.bat"
(
    echo @echo off
    echo cd /d "%SCRIPT_DIR%"
    echo node scripts\terminal-launcher.cjs
    echo if errorlevel 1 pause
    echo del "%%~f0"
) > "%LAUNCHER_BAT%"

REM Start the launcher using the batch file
start "Terminal Launcher Server" cmd /k "%LAUNCHER_BAT%"

REM Wait for server to start
echo Waiting for terminal launcher to start...
timeout /t 5 /nobreak >nul

REM Verify launcher is running
netstat -ano | findstr ":3002" >nul 2>&1
if %errorlevel% equ 0 (
    echo Terminal launcher started successfully on port 3002
) else (
    echo.
    echo ERROR: Terminal launcher failed to start on port 3002
    echo.
    echo Please check the "Terminal Launcher Server" window for error messages.
    echo You can also manually start it by running: npm run launcher
    echo.
    pause
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
