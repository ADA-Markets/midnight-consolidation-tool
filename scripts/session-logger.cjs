const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_ROOT_DIR = path.join(os.homedir(), 'NightConsolidation');

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeAddress(address) {
  if (!address) {
    return 'unknown-address';
  }
  const cleaned = address.replace(/[^a-zA-Z0-9]/g, '');
  return cleaned || 'unknown-address';
}

function sanitizeCustomLabel(label) {
  if (!label || typeof label !== 'string') {
    return null;
  }
  const trimmed = label.trim();
  if (!trimmed) return null;
  return trimmed
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function formatAddressLabel(address) {
  const safe = sanitizeAddress(address);
  if (safe.length <= 14) {
    return safe;
  }
  const prefix = safe.slice(0, 9);
  const suffix = safe.slice(-5);
  return `${prefix}...${suffix}`;
}

function formatTimestamp(date = new Date()) {
  const pad = (num) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function createNoopLogger() {
  const noop = () => {};
  return {
    sessionDir: null,
    addressLabel: 'unavailable',
    timestamp: '',
    log: noop,
    copyArtifact: noop,
    writeSummaryLines: noop,
    updateMetadata: noop,
  };
}

function createSessionLogger(primaryAddress, metadata = {}, options = {}) {
  try {
    ensureDirectory(LOG_ROOT_DIR);
    const customLabel = sanitizeCustomLabel(options.customLabel);
    const addressLabel = customLabel || formatAddressLabel(primaryAddress);
    const timestamp = formatTimestamp();
    const sessionDir = path.join(LOG_ROOT_DIR, addressLabel, timestamp);
    ensureDirectory(sessionDir);

    const logFile = path.join(sessionDir, 'logs.txt');
    const metadataFile = path.join(sessionDir, 'session-info.json');
    const summaryFile = path.join(sessionDir, 'EstNightTotal.txt');

    let metadataState = {
      addressLabel,
      sessionTimestamp: timestamp,
      createdAt: new Date().toISOString(),
      customLabel: customLabel ? options.customLabel : undefined,
      ...metadata,
    };

    function writeMetadataFile() {
      fs.writeFileSync(metadataFile, JSON.stringify(metadataState, null, 2));
    }

    writeMetadataFile();

    function appendLog(message) {
      const stamp = new Date().toISOString();
      fs.appendFileSync(logFile, `[${stamp}] ${message}\n`, 'utf8');
    }

    function copyArtifact(sourcePath, fileName) {
      if (!sourcePath || !fileName) return;
      try {
        if (fs.existsSync(sourcePath)) {
          const targetPath = path.join(sessionDir, fileName);
          fs.copyFileSync(sourcePath, targetPath);
        } else {
          appendLog(`Skipping artifact copy. Source not found: ${sourcePath}`);
        }
      } catch (error) {
        appendLog(`Failed to copy artifact ${fileName}: ${error.message}`);
      }
    }

    function writeSummaryLines(lines) {
      const content = [
        ...lines,
        '',
        'Note: Midnight finalizes Night rewards independently.',
        'Values recorded here reflect the exact time this consolidation ran.',
      ].join('\n');
      fs.writeFileSync(summaryFile, content, 'utf8');
    }

    function updateMetadata(extra = {}) {
      metadataState = { ...metadataState, ...extra };
      writeMetadataFile();
    }

    return {
      sessionDir,
      addressLabel,
      timestamp,
      log: appendLog,
      copyArtifact,
      writeSummaryLines,
      updateMetadata,
    };
  } catch (error) {
    console.error('[SessionLogger] Failed to initialize logging folder:', error.message);
    return createNoopLogger();
  }
}

module.exports = {
  createSessionLogger,
  createNoopLogger,
  formatAddressLabel,
  formatTimestamp,
};
