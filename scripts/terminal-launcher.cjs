/**
 * Terminal Launcher Server
 *
 * This simple HTTP server launches the consolidation script in a terminal window.
 * Runs on port 3002.
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const RESULT_FILE = path.join(__dirname, 'consolidation-result.json');

// Track spawned consolidation processes
const spawnedProcesses = new Set();

// Remove old result file on startup
if (fs.existsSync(RESULT_FILE)) {
  fs.unlinkSync(RESULT_FILE);
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST /consolidate - Launch terminal with consolidation script
  if (req.method === 'POST' && req.url === '/consolidate') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { source, dest, signature } = JSON.parse(body);

        if (!source || !dest || !signature) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing parameters' }));
          return;
        }

        console.log('[Terminal Launcher] Launching consolidation for:', source);

        // Delete old result file
        if (fs.existsSync(RESULT_FILE)) {
          fs.unlinkSync(RESULT_FILE);
        }

        let terminal;

        if (process.platform === 'win32') {
          // Windows: Create batch file and launch cmd.exe
          const tempBat = path.join(__dirname, `consolidate-temp-${Date.now()}.bat`);
          const batContent = `@echo off
cd /d "${__dirname}"
node "consolidate-cli.cjs" --source ${source} --dest ${dest} --signature ${signature}
if errorlevel 1 (
    echo.
    echo Consolidation failed. Press any key to close...
    pause >nul
)
del "%~f0"
`;
          fs.writeFileSync(tempBat, batContent);

          terminal = spawn('cmd.exe', [
            '/c',
            'start',
            'cmd.exe',
            '/k',
            tempBat
          ], {
            detached: true,
            stdio: 'ignore',
            cwd: __dirname
          });
        } else if (process.platform === 'darwin') {
          // macOS: Use osascript to launch Terminal.app
          const script = `cd "${__dirname}" && node "consolidate-cli.cjs" --source ${source} --dest ${dest} --signature ${signature}`;
          terminal = spawn('osascript', [
            '-e',
            `tell application "Terminal" to do script "${script.replace(/"/g, '\\"')}"`
          ], {
            detached: true,
            stdio: 'ignore',
            cwd: __dirname
          });
        } else {
          // Linux: Try common terminal emulators
          const tempSh = path.join(__dirname, `consolidate-temp-${Date.now()}.sh`);
          const shContent = `#!/bin/bash
cd "${__dirname}"
node "consolidate-cli.cjs" --source ${source} --dest ${dest} --signature ${signature}
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "Consolidation failed. Press any key to close..."
    read -n 1
fi
rm -f "$0"
`;
          fs.writeFileSync(tempSh, shContent);
          fs.chmodSync(tempSh, 0o755);

          // Try to find an available terminal emulator
          const terminals = [
            { cmd: 'x-terminal-emulator', args: ['-e', tempSh] },
            { cmd: 'gnome-terminal', args: ['--', tempSh] },
            { cmd: 'konsole', args: ['-e', tempSh] },
            { cmd: 'xfce4-terminal', args: ['-e', tempSh] },
            { cmd: 'xterm', args: ['-e', tempSh] }
          ];

          let launched = false;
          for (const term of terminals) {
            try {
              terminal = spawn(term.cmd, term.args, {
                detached: true,
                stdio: 'ignore',
                cwd: __dirname
              });
              launched = true;
              break;
            } catch (err) {
              continue;
            }
          }

          if (!launched) {
            throw new Error('No terminal emulator found. Please install gnome-terminal, konsole, xfce4-terminal, or xterm.');
          }
        }

        terminal.unref();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Terminal launched' }));

      } catch (error) {
        console.error('[Terminal Launcher] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // POST /consolidate-batch - Launch terminal with batch consolidation script
  if (req.method === 'POST' && req.url === '/consolidate-batch') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { dest, addressBatch } = JSON.parse(body);

        if (!dest || !Array.isArray(addressBatch) || addressBatch.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing or invalid parameters' }));
          return;
        }

        console.log('[Terminal Launcher] Launching batch consolidation for', addressBatch.length, 'addresses');

        // Delete old result file
        if (fs.existsSync(RESULT_FILE)) {
          fs.unlinkSync(RESULT_FILE);
        }

        // Write batch data to temporary file to avoid command line escaping issues
        const batchDataFile = path.join(__dirname, 'batch-data.json');
        fs.writeFileSync(batchDataFile, JSON.stringify(addressBatch));

        let terminal;

        if (process.platform === 'win32') {
          // Windows: Create batch file and launch cmd.exe
          const tempBat = path.join(__dirname, `consolidate-batch-temp-${Date.now()}.bat`);
          const batContent = `@echo off
cd /d "${__dirname}"
node "consolidate-batch-cli.cjs" --dest ${dest} --batchfile "batch-data.json"
if errorlevel 1 (
    echo.
    echo Batch consolidation failed. Press any key to close...
    pause >nul
)
del "%~f0"
`;
          fs.writeFileSync(tempBat, batContent);

          terminal = spawn('cmd.exe', [
            '/c',
            'start',
            'cmd.exe',
            '/k',
            tempBat
          ], {
            detached: true,
            stdio: 'ignore',
            cwd: __dirname
          });
        } else if (process.platform === 'darwin') {
          // macOS: Use osascript to launch Terminal.app
          const script = `cd "${__dirname}" && node "consolidate-batch-cli.cjs" --dest ${dest} --batchfile "batch-data.json"`;
          terminal = spawn('osascript', [
            '-e',
            `tell application "Terminal" to do script "${script.replace(/"/g, '\\"')}"`
          ], {
            detached: true,
            stdio: 'ignore',
            cwd: __dirname
          });
        } else {
          // Linux: Try common terminal emulators
          const tempSh = path.join(__dirname, `consolidate-batch-temp-${Date.now()}.sh`);
          const shContent = `#!/bin/bash
cd "${__dirname}"
node "consolidate-batch-cli.cjs" --dest ${dest} --batchfile "batch-data.json"
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "Batch consolidation failed. Press any key to close..."
    read -n 1
fi
rm -f "$0"
`;
          fs.writeFileSync(tempSh, shContent);
          fs.chmodSync(tempSh, 0o755);

          // Try to find an available terminal emulator
          const terminals = [
            { cmd: 'x-terminal-emulator', args: ['-e', tempSh] },
            { cmd: 'gnome-terminal', args: ['--', tempSh] },
            { cmd: 'konsole', args: ['-e', tempSh] },
            { cmd: 'xfce4-terminal', args: ['-e', tempSh] },
            { cmd: 'xterm', args: ['-e', tempSh] }
          ];

          let launched = false;
          for (const term of terminals) {
            try {
              terminal = spawn(term.cmd, term.args, {
                detached: true,
                stdio: 'ignore',
                cwd: __dirname
              });
              launched = true;
              break;
            } catch (err) {
              continue;
            }
          }

          if (!launched) {
            throw new Error('No terminal emulator found. Please install gnome-terminal, konsole, xfce4-terminal, or xterm.');
          }
        }

        terminal.unref();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Batch terminal launched' }));

      } catch (error) {
        console.error('[Terminal Launcher] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // GET /result - Check if consolidation result is ready
  if (req.method === 'GET' && req.url === '/result') {
    if (fs.existsSync(RESULT_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ready: true, data }));
      } catch (error) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ready: false }));
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready: false }));
    }
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // POST /shutdown - Gracefully shutdown the server and exit
  if (req.method === 'POST' && req.url === '/shutdown') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Shutting down...' }));

    console.log('\n[Terminal Launcher] Shutdown requested from UI...');

    // Close server and exit after a brief delay to ensure response is sent
    setTimeout(() => {
      server.close(() => {
        console.log('[Terminal Launcher] Server stopped');

        if (process.platform === 'win32') {
          // On Windows, kill any node.js consolidation processes and close CMD windows
          spawn('taskkill', ['/F', '/FI', 'WINDOWTITLE eq Midnight*'], {
            detached: true,
            stdio: 'ignore'
          }).unref();

          // Wait a moment, then kill this process
          setTimeout(() => {
            spawn('taskkill', ['/PID', process.pid.toString(), '/F'], {
              detached: true,
              stdio: 'ignore'
            }).unref();
          }, 300);
        } else {
          // On Linux/macOS, just exit normally
          process.exit(0);
        }
      });
    }, 500);
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('================================================================================');
  console.log('           Terminal Launcher Server - Running');
  console.log('================================================================================');
  console.log('');
  console.log(`  Server listening on: http://localhost:${PORT}`);
  console.log('');
  console.log('  This server launches terminal windows for consolidation.');
  console.log('  Keep this window open while using the application.');
  console.log('');
  console.log('  Press Ctrl+C to stop the server.');
  console.log('================================================================================');
  console.log('');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('');
    console.error('================================================================================');
    console.error('  ERROR: Port 3002 is already in use!');
    console.error('================================================================================');
    console.error('');
    console.error('  Another process is already using port 3002.');
    console.error('  Please either:');
    console.error('    1. Close the other process using port 3002');
    console.error('    2. Or wait a few seconds and try again');
    console.error('');
    console.error('  To find what is using port 3002, run:');
    console.error('    netstat -ano | findstr ":3002"');
    console.error('');
    console.error('================================================================================');
  } else {
    console.error('');
    console.error('================================================================================');
    console.error('  ERROR: Failed to start server');
    console.error('================================================================================');
    console.error('');
    console.error('  Error:', error.message);
    console.error('');
    console.error('================================================================================');
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Terminal Launcher] Shutting down...');
  server.close(() => {
    console.log('[Terminal Launcher] Server stopped');
    process.exit(0);
  });
});
