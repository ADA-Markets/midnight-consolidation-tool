#!/bin/bash
# ============================================================================
# Midnight Consolidation Tool - Unix/Linux/macOS Setup Script
# ============================================================================
# This script performs complete setup:
# 1. Checks for Node.js 20.x
# 2. Installs all dependencies
# 3. Builds Vite application
# 4. Opens browser and starts the app
# ============================================================================

set -e  # Exit on error

echo ""
echo "================================================================================"
echo "                 Midnight Consolidation Tool - Setup"
echo "================================================================================"
echo ""

# ============================================================================
# Check Node.js
# ============================================================================
echo "[1/4] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Node.js not found!"
    echo ""
    echo "Please download and install Node.js 20.x from:"
    echo "https://nodejs.org/"
    echo ""
    echo "After installation, run this script again."

    # Try to open browser (works on macOS and most Linux systems)
    if command -v open &> /dev/null; then
        open "https://nodejs.org/"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://nodejs.org/"
    fi

    exit 1
else
    echo "Node.js found!"
    node --version
    echo ""
fi

# ============================================================================
# Install dependencies
# ============================================================================
echo "[2/4] Installing project dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo "Dependencies installed!"
echo ""

# ============================================================================
# Build application (skipped for dev mode - Vite builds on the fly)
# ============================================================================
echo "[3/4] Preparing application..."
echo "Build will happen automatically when you start the dev server."
echo ""

# ============================================================================
# Setup complete, display info
# ============================================================================
echo "================================================================================"
echo "                         Setup Complete!"
echo "================================================================================"
echo ""
echo "Your wallet and consolidation data will be stored in:"
echo "   $HOME/Documents/MidnightConsolidationTool/"
echo ""
echo "This allows you to update the software without losing your data."
echo ""

# ============================================================================
# Start application
# ============================================================================
echo "[4/4] Starting application..."
echo ""

echo "================================================================================"
echo "              Midnight Consolidation Tool - Ready!"
echo "================================================================================"
echo ""
echo "Web Interface: http://localhost:3000"
echo ""
echo "The application will open in your default browser."
echo "Press Ctrl+C to stop the server."
echo "================================================================================"
echo ""

# ============================================================================
# Start terminal launcher server in background
# ============================================================================
echo "[4/4] Starting Terminal Launcher on port 3002..."

# Start terminal launcher in background
node scripts/terminal-launcher.cjs &
LAUNCHER_PID=$!

# Wait for server to start
echo "Waiting for terminal launcher to start..."
sleep 3

# Verify launcher is running
if lsof -i:3002 &> /dev/null || netstat -an 2>/dev/null | grep -q ":3002"; then
    echo "Terminal launcher started successfully on port 3002 (PID: $LAUNCHER_PID)"
else
    echo "Warning: Terminal launcher may not be running on port 3002"
fi

echo ""
echo "================================================================================"
echo "              Midnight Consolidation Tool - Ready!"
echo "================================================================================"
echo ""
echo "Web Interface:     http://localhost:3000"
echo "Terminal Launcher:  http://localhost:3002"
echo ""
echo "The application will open in your default browser."
echo "Consolidation will run in a separate terminal window (fully transparent)."
echo ""
echo "IMPORTANT: Keep this terminal window open."
echo "           Press Ctrl+C to stop both servers."
echo "================================================================================"
echo ""

# Trap Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping servers...'; kill $LAUNCHER_PID 2>/dev/null; exit" INT TERM

# Start Vite (will auto-open browser)
npm run dev
