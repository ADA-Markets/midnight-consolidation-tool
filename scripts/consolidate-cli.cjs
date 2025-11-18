/**
 * Midnight Consolidation CLI Script
 *
 * This script runs in a terminal window and shows all API calls transparently.
 * It's called by the React UI after the user has signed the message.
 *
 * Usage:
 *   node consolidate-cli.js --source <addr> --dest <addr> --signature <sig>
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { createSessionLogger, createNoopLogger } = require('./session-logger.cjs');

const MIDNIGHT_API = 'https://scavenger.prod.gd.midnighttge.io';
const RESULT_FILE = path.join(__dirname, 'consolidation-result.json');

let sessionLogger = createNoopLogger();

function decodeLabel(encoded) {
  if (!encoded) return undefined;
  try {
    return Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return undefined;
  }
}

function logToFile(message) {
  if (!sessionLogger || typeof sessionLogger.log !== 'function') return;
  sessionLogger.log(message);
}

function recordEstimationSummary(details) {
  if (!sessionLogger || typeof sessionLogger.writeSummaryLines !== 'function') return;
  const lines = [
    `Timestamp: ${new Date().toISOString()}`,
    `Status: ${details.status || 'UNKNOWN'}`,
    `Source Address: ${details.sourceAddress || 'n/a'}`,
    `Destination Address: ${details.destinationAddress || 'n/a'}`,
    `Solutions at Request Time: ${typeof details.solutions === 'number' ? details.solutions : 'Unavailable'}`,
  ];

  if (details.message) {
    lines.push(`Message: ${details.message}`);
  }

  sessionLogger.writeSummaryLines(lines);
}

function updateSessionMetadata(updates) {
  if (!sessionLogger || typeof sessionLogger.updateMetadata !== 'function') return;
  sessionLogger.updateMetadata(updates);
}

function copyResultArtifact() {
  if (!sessionLogger || typeof sessionLogger.copyArtifact !== 'function') return;
  sessionLogger.copyArtifact(RESULT_FILE, 'consolidation-result.json');
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    params[key] = value;
  }

  return params;
}

// Make HTTPS request
function makeRequest(url, method = 'POST') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MidnightConsolidationTool/1.0',
      },
    };

    console.log(`\n→ ${method} ${url}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout after 30 seconds'));
    });

    req.end();
  });
}

// Main consolidation function
async function consolidate(sourceAddress, destinationAddress, signature) {
  console.log('\n================================================================================');
  console.log('           Midnight Reward Consolidation - Terminal View');
  console.log('================================================================================\n');
  console.log('Source Address:      ' + sourceAddress);
  console.log('Destination Address: ' + destinationAddress);
  console.log('Signature:           ' + signature.substring(0, 64) + '...');
  console.log('\nThis terminal shows EXACTLY what is sent to the Midnight API.');
  console.log('All network calls are visible below.\n');
  console.log('================================================================================\n');

  const url = `${MIDNIGHT_API}/donate_to/${destinationAddress}/${sourceAddress}/${signature}`;

  try {
    console.log('Making consolidation request...\n');
    logToFile(`[REQUEST] POST ${url}`);

    const response = await makeRequest(url, 'POST');
    logToFile(`[RESPONSE] Status: ${response.status} Body: ${JSON.stringify(response.data)}`);

    console.log(`\n← Response Status: ${response.status}`);
    console.log('← Response Body:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.status >= 200 && response.status < 300) {
      console.log('\n================================================================================');
      console.log('✓ SUCCESS - Consolidation Complete!');
      console.log('================================================================================\n');
      console.log(`Solutions Consolidated: ${response.data.solutions_consolidated || 0}`);
      console.log(`Message: ${response.data.message || 'Rewards consolidated successfully'}\n`);

      // Save result to file for UI to read
      const result = {
        success: true,
        solutionsConsolidated: response.data.solutions_consolidated || 0,
        message: response.data.message || 'Rewards consolidated successfully',
        sourceAddress,
        destinationAddress,
      };

      fs.writeFileSync(
        RESULT_FILE,
        JSON.stringify(result, null, 2)
      );

      copyResultArtifact();
      recordEstimationSummary({
        status: 'SUCCESS',
        sourceAddress,
        destinationAddress,
        solutions: response.data.solutions_consolidated || 0,
        message: response.data.message || 'Rewards consolidated successfully',
      });
      updateSessionMetadata({
        completedAt: new Date().toISOString(),
        status: 'SUCCESS',
        solutions: response.data.solutions_consolidated || 0,
      });

      return 0;
    } else if (response.status === 409) {
      console.log('\n================================================================================');
      console.log('⚠ Already Consolidated');
      console.log('================================================================================\n');
      console.log('This address has already been consolidated to the destination.\n');

      const result = {
        success: false,
        error: response.data.message || 'Already donated to this address',
        alreadyDonated: true,
        sourceAddress,
        destinationAddress,
      };

      fs.writeFileSync(
        RESULT_FILE,
        JSON.stringify(result, null, 2)
      );

      copyResultArtifact();
      recordEstimationSummary({
        status: 'ALREADY_CONSOLIDATED',
        sourceAddress,
        destinationAddress,
        solutions: 0,
        message: result.error,
      });
      updateSessionMetadata({
        completedAt: new Date().toISOString(),
        status: 'ALREADY_CONSOLIDATED',
      });

      return 0;
    } else {
      throw new Error(`Server rejected consolidation: ${response.data.message || response.status}`);
    }
  } catch (error) {
    console.error('\n================================================================================');
    console.error('✗ ERROR - Consolidation Failed');
    console.error('================================================================================\n');
    console.error('Error:', error.message);
    logToFile(`[ERROR] ${error.message}`);
    console.error('\n');

    const result = {
      success: false,
      error: error.message,
      sourceAddress,
      destinationAddress,
    };

    fs.writeFileSync(
      RESULT_FILE,
      JSON.stringify(result, null, 2)
    );

    copyResultArtifact();
    recordEstimationSummary({
      status: 'ERROR',
      sourceAddress,
      destinationAddress,
      message: error.message,
    });
    updateSessionMetadata({
      completedAt: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
    });

    return 1;
  }
}

// Main
(async () => {
  const params = parseArgs();

  if (!params.source || !params.dest || !params.signature) {
    console.error('Usage: node consolidate-cli.js --source <addr> --dest <addr> --signature <sig>');
    process.exit(1);
  }

  const sessionLabel = decodeLabel(params.labelBase64);

  sessionLogger = createSessionLogger(
    params.source || params.dest,
    {
      type: 'single',
      sourceAddress: params.source,
      destinationAddress: params.dest,
      signaturePreview: params.signature ? `${params.signature.substring(0, 24)}...` : undefined,
    },
    {
      customLabel: sessionLabel,
    }
  );
  logToFile(`Session folder created for ${params.source} -> ${params.dest}`);

  try {
    const exitCode = await consolidate(params.source, params.dest, params.signature);

    console.log('\nPress any key to close this window...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.exit(exitCode);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
