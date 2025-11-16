@echo off
REM ============================================================================
REM Midnight Consolidation Tool - Serve Only (No Build)
REM ============================================================================
REM This script serves already-built files from the dist/ folder.
REM Use this if you've already run build-and-serve.cmd once.
REM No Node.js required - just serves static files.
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ================================================================================
echo          Midnight Consolidation Tool - Starting Server
echo ================================================================================
echo.

REM ============================================================================
REM Check for dist directory
REM ============================================================================
if not exist "dist" (
    echo ERROR: Build files not found in 'dist' folder.
    echo.
    echo Please run 'build-and-serve.cmd' first to build the application.
    pause
    exit /b 1
)

echo Starting servers...
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
echo      Terminal windows show exactly what is sent to Midnight API.
echo ================================================================================
echo.

REM Open browser
start http://localhost:3000

REM Start PowerShell HTTP server
powershell -NoProfile -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:3000/'); $listener.Start(); Write-Host 'Server started on http://localhost:3000'; while ($listener.IsListening) { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $path = $request.Url.LocalPath; if ($path -eq '/') { $path = '/index.html' }; $filePath = Join-Path 'dist' $path.TrimStart('/'); if (Test-Path $filePath -PathType Leaf) { $content = [System.IO.File]::ReadAllBytes($filePath); $response.ContentLength64 = $content.Length; $ext = [System.IO.Path]::GetExtension($filePath); $contentType = switch ($ext) { '.html' { 'text/html' } '.css' { 'text/css' } '.js' { 'application/javascript' } '.json' { 'application/json' } '.png' { 'image/png' } '.jpg' { 'image/jpeg' } '.svg' { 'image/svg+xml' } '.wasm' { 'application/wasm' } default { 'application/octet-stream' } }; $response.ContentType = $contentType; $response.OutputStream.Write($content, 0, $content.Length); } else { $response.StatusCode = 404; $buffer = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found'); $response.OutputStream.Write($buffer, 0, $buffer.Length); }; $response.Close(); }"
