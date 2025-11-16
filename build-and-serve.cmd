@echo off
REM ============================================================================
REM Midnight Consolidation Tool - Production Build & Serve Script
REM ============================================================================
REM This script:
REM 1. Checks for Node.js
REM 2. Installs dependencies if needed
REM 3. Builds production-ready static files
REM 4. Starts a simple HTTP server (no Node.js required for serving)
REM 5. Opens browser
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ================================================================================
echo          Midnight Consolidation Tool - Production Build
echo ================================================================================
echo.

REM ============================================================================
REM Check Node.js (required for building, not for running)
REM ============================================================================
echo [1/5] Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found!
    echo.
    echo Node.js is required to BUILD this application (one-time setup).
    echo Please download and install Node.js 20.x from:
    echo https://nodejs.org/dist/v20.19.3/node-v20.19.3-x64.msi
    echo.
    echo After installation, run this script again.
    pause
    start https://nodejs.org/dist/v20.19.3/node-v20.19.3-x64.msi
    exit /b 1
) else (
    echo Node.js found:
    node --version
    echo.
)

REM ============================================================================
REM Install dependencies if needed
REM ============================================================================
echo [2/5] Checking dependencies...
if not exist "node_modules" (
    echo Installing project dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed!
) else (
    echo Dependencies already installed.
)
echo.

REM ============================================================================
REM Build application
REM ============================================================================
echo [3/5] Building production application...
echo This creates optimized static files that can be audited and served securely.
echo.
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo Build complete!
echo.

REM ============================================================================
REM Check for dist directory
REM ============================================================================
if not exist "dist" (
    echo ERROR: Build directory not found
    pause
    exit /b 1
)

echo [4/5] Build output created in: dist\
echo.
echo You can now inspect all files in the 'dist' folder.
echo These are pure HTML, CSS, and JavaScript files - fully auditable.
echo.

REM ============================================================================
REM Start simple HTTP server using PowerShell (built-in, no dependencies)
REM ============================================================================
echo [5/5] Starting servers...
echo.

REM Start terminal launcher in background
echo Starting Terminal Launcher...
start "Terminal Launcher" /MIN cmd /c "node scripts\terminal-launcher.cjs"

REM Wait a moment for launcher to start
timeout /t 3 /nobreak >nul

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
echo Press Ctrl+C to stop the server.
echo.
echo NOTE: All code is running locally on your machine.
echo      The proxy server forwards API requests to Midnight servers.
echo ================================================================================
echo.

REM Open browser
start http://localhost:3000

REM Start PowerShell HTTP server
powershell -NoProfile -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:3000/'); $listener.Start(); Write-Host 'Server started on http://localhost:3000'; while ($listener.IsListening) { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $path = $request.Url.LocalPath; if ($path -eq '/') { $path = '/index.html' }; $filePath = Join-Path 'dist' $path.TrimStart('/'); if (Test-Path $filePath -PathType Leaf) { $content = [System.IO.File]::ReadAllBytes($filePath); $response.ContentLength64 = $content.Length; $ext = [System.IO.Path]::GetExtension($filePath); $contentType = switch ($ext) { '.html' { 'text/html' } '.css' { 'text/css' } '.js' { 'application/javascript' } '.json' { 'application/json' } '.png' { 'image/png' } '.jpg' { 'image/jpeg' } '.svg' { 'image/svg+xml' } '.wasm' { 'application/wasm' } default { 'application/octet-stream' } }; $response.ContentType = $contentType; $response.OutputStream.Write($content, 0, $content.Length); } else { $response.StatusCode = 404; $buffer = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found'); $response.OutputStream.Write($buffer, 0, $buffer.Length); }; $response.Close(); }"
