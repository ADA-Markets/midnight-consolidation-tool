/**
 * Terminal Launcher Server
 *
 * This simple HTTP server launches the consolidation script in a terminal window.
 * Runs on port 3002.
 */

const http = require('http');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const RESULT_FILE = path.join(__dirname, 'consolidation-result.json');
const DEFAULT_WINDOW_TITLE = 'Midnight Consolidation';

// Track spawned consolidation processes
const spawnedProcesses = new Set();

// Remove old result file on startup
if (fs.existsSync(RESULT_FILE)) {
  fs.unlinkSync(RESULT_FILE);
}

function buildNodeCommand(scriptPath, argPairs) {
  const args = ['node', scriptPath];

  for (const [flag, value] of argPairs) {
    if (value === undefined || value === null) continue;
    args.push(`--${flag}`);
    args.push(value);
  }

  return {
    args,
    string: args.join(' '),
  };
}

function commandExists(binary) {
  try {
    const whichCmd = process.platform === 'win32' ? 'where' : 'which';
    const res = spawnSync(whichCmd, [binary], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

function escapeAppleScriptString(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getLinuxTerminal(commandArgs, title) {
  const options = [
    {
      bin: 'x-terminal-emulator',
      buildArgs: () => ['-T', title, '-e', ...commandArgs],
    },
    {
      bin: 'gnome-terminal',
      buildArgs: () => ['--title', title, '--', ...commandArgs],
    },
    {
      bin: 'konsole',
      buildArgs: () => ['-p', `tabtitle=${title}`, '-e', ...commandArgs],
    },
    {
      bin: 'xfce4-terminal',
      buildArgs: () => ['--title', title, '-e', ...commandArgs],
    },
    {
      bin: 'alacritty',
      buildArgs: () => ['--title', title, '-e', ...commandArgs],
    },
    {
      bin: 'kitty',
      buildArgs: () => ['--title', title, ...commandArgs],
    },
    {
      bin: 'xterm',
      buildArgs: () => ['-T', title, '-e', ...commandArgs],
    },
  ];

  for (const option of options) {
    if (commandExists(option.bin)) {
      return { cmd: option.bin, args: option.buildArgs() };
    }
  }

  return null;
}

function launchTerminal(command, title = DEFAULT_WINDOW_TITLE) {
  if (process.platform === 'win32') {
    const terminal = spawn('cmd.exe', [
      '/c',
      'start',
      'cmd.exe',
      '/k',
      command.string,
    ], {
      detached: true,
      stdio: 'ignore',
    });

    terminal.unref();
    return;
  }

  if (process.platform === 'darwin') {
    const osaScript = `
      tell application "Terminal"
        activate
        do script "${escapeAppleScriptString(command.string)}"
      end tell
    `;

    const terminal = spawn('osascript', ['-e', osaScript], {
      detached: true,
      stdio: 'ignore',
    });
    terminal.unref();
    return;
  }

  // Linux / Unix-like
  const linuxTerminal = getLinuxTerminal(command.args, title);
  if (!linuxTerminal) {
    throw new Error('Unable to find a supported terminal emulator. Install xterm/gnome-terminal or run manually:\n' + command.string);
  }

  const terminal = spawn(linuxTerminal.cmd, linuxTerminal.args, {
    detached: true,
    stdio: 'ignore',
  });
  terminal.unref();
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

        const scriptPath = path.join(__dirname, 'consolidate-cli.cjs');
        const command = buildNodeCommand(scriptPath, [
          ['source', source],
          ['dest', dest],
          ['signature', signature],
        ]);

        // Launch Windows terminal with the consolidation script
        const terminal = spawn('cmd.exe', [
          '/c',
          'start',
          'cmd.exe',
          '/k',
          `node "${scriptPath}" --source ${source} --dest ${dest} --signature ${signature}`
        ], {
          detached: true,
          stdio: 'ignore'
        });

        // Track the process (note: this is the parent cmd.exe, not the spawned window)
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

        const scriptPath = path.join(__dirname, 'consolidate-batch-cli.cjs');
        const command = buildNodeCommand(scriptPath, [
          ['dest', dest],
          ['batchfile', batchDataFile],
        ]);

        // Launch Windows terminal with the batch consolidation script
        const terminal = spawn('cmd.exe', [
          '/c',
          'start',
          'cmd.exe',
          '/k',
          `node "${scriptPath}" --dest ${dest} --batchfile "${batchDataFile}"`
        ], {
          detached: true,
          stdio: 'ignore'
        });

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

        // On Windows, kill any node.js consolidation processes and close CMD windows
        if (process.platform === 'win32') {
          // Kill all node processes running consolidate scripts
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Terminal Launcher] Shutting down...');
  server.close(() => {
    console.log('[Terminal Launcher] Server stopped');
    process.exit(0);
  });
});
