/**
 * Midnight Batch Consolidation CLI Script
 *
 * This script handles multiple address consolidations in a single terminal window.
 * Used for seed phrase import mode where multiple addresses need to be consolidated.
 *
 * Usage:
 *   node consolidate-batch-cli.cjs --dest <addr> --batch <json_array>
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
    `Destination Address: ${details.destinationAddress || 'n/a'}`,
    `Primary Source Address: ${details.primarySource || 'n/a'}`,
    `Total Addresses Processed: ${typeof details.total === 'number' ? details.total : 'n/a'}`,
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

function persistBatchInputArtifact(batchFilePath, rawBatch = null) {
  if (!sessionLogger || typeof sessionLogger.copyArtifact !== 'function') return;
  if (batchFilePath && fs.existsSync(batchFilePath)) {
    sessionLogger.copyArtifact(batchFilePath, path.basename(batchFilePath));
    return;
  }

  if (rawBatch && sessionLogger.sessionDir) {
    try {
      fs.writeFileSync(path.join(sessionLogger.sessionDir, 'batch-input.json'), rawBatch, 'utf8');
    } catch (error) {
      logToFile(`Failed to persist batch input: ${error.message}`);
    }
  }
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

// Main batch consolidation function
async function consolidateBatch(destinationAddress, addressBatch) {
  console.log('\n================================================================================');
  console.log('        Midnight Batch Reward Consolidation - Terminal View');
  console.log('================================================================================\n');
  console.log('Destination Address: ' + destinationAddress);
  console.log('Total Addresses:     ' + addressBatch.length);
  console.log('\nThis terminal shows EXACTLY what is sent to the Midnight API.');
  console.log('All network calls are visible below.\n');
  console.log('================================================================================\n');

  const results = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let totalSolutions = 0;

  for (let i = 0; i < addressBatch.length; i++) {
    const item = addressBatch[i];
    const { sourceAddress, signature, sourceIndex } = item;

    console.log(`\n[${i + 1}/${addressBatch.length}] Processing address index ${sourceIndex}:`);
    console.log(`    ${sourceAddress.substring(0, 40)}...`);

    const url = `${MIDNIGHT_API}/donate_to/${destinationAddress}/${sourceAddress}/${signature}`;
    logToFile(`[REQUEST][${sourceIndex}] POST ${url}`);

    try {
      const response = await makeRequest(url, 'POST');
      logToFile(`[RESPONSE][${sourceIndex}] Status: ${response.status} Body: ${JSON.stringify(response.data)}`);

      console.log(`    ← Status: ${response.status}`);

      if (response.status >= 200 && response.status < 300) {
        const solutions = response.data.solutions_consolidated || 0;
        totalSolutions += solutions;
        successCount++;

        console.log(`    ✓ SUCCESS - ${solutions} solutions consolidated`);

        results.push({
          sourceAddress,
          sourceIndex,
          success: true,
          solutionsConsolidated: solutions,
          message: response.data.message || 'Consolidated successfully',
        });
      } else if (response.status === 409) {
        skipCount++;
        console.log(`    ⚠ SKIPPED - Already donated`);

        results.push({
          sourceAddress,
          sourceIndex,
          success: false,
          skipped: true,
          message: 'Already donated',
        });
      } else {
        errorCount++;
        const errorMsg = response.data.message || response.status.toString();
        console.log(`    ✗ ERROR - ${errorMsg}`);

        results.push({
          sourceAddress,
          sourceIndex,
          success: false,
          error: errorMsg,
        });
      }
    } catch (error) {
      errorCount++;
      console.log(`    ✗ ERROR - ${error.message}`);
      logToFile(`[ERROR][${sourceIndex}] ${error.message}`);

      results.push({
        sourceAddress,
        sourceIndex,
        success: false,
        error: error.message,
      });
    }

    // Small delay between requests
    if (i < addressBatch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n================================================================================');
  console.log('                    Batch Consolidation Complete');
  console.log('================================================================================\n');
  console.log(`Total Addresses:       ${addressBatch.length}`);
  console.log(`Successful:            ${successCount}`);
  console.log(`Skipped (already done):${skipCount}`);
  console.log(`Errors:                ${errorCount}`);
  console.log(`Total Solutions:       ${totalSolutions}\n`);

  // Save results to file
  const batchResult = {
    success: errorCount === 0,
    results,
    summary: {
      total: addressBatch.length,
      successful: successCount,
      skipped: skipCount,
      errors: errorCount,
      totalSolutions,
    },
    destinationAddress,
  };

  fs.writeFileSync(
    RESULT_FILE,
    JSON.stringify(batchResult, null, 2)
  );

  copyResultArtifact();
  recordEstimationSummary({
    status: errorCount === 0 ? 'SUCCESS' : 'COMPLETED_WITH_ERRORS',
    destinationAddress,
    primarySource: addressBatch[0]?.sourceAddress,
    solutions: totalSolutions,
    total: addressBatch.length,
    message: `Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`,
  });
  updateSessionMetadata({
    completedAt: new Date().toISOString(),
    status: errorCount === 0 ? 'SUCCESS' : 'COMPLETED_WITH_ERRORS',
    totals: {
      total: addressBatch.length,
      success: successCount,
      skipped: skipCount,
      errors: errorCount,
      solutions: totalSolutions,
    },
  });

  return errorCount === 0 ? 0 : 1;
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

// Main
(async () => {
  const params = parseArgs();

  if (!params.dest || (!params.batch && !params.batchfile)) {
    console.error('Usage: node consolidate-batch-cli.cjs --dest <addr> --batchfile <path>');
    process.exit(1);
  }

  try {
    let addressBatch;
    let rawBatchInput = null;

    if (params.batchfile) {
      // Read from file
      const batchData = fs.readFileSync(params.batchfile, 'utf8');
      addressBatch = JSON.parse(batchData);
    } else {
      // Legacy: read from command line
      rawBatchInput = params.batch;
      addressBatch = JSON.parse(params.batch);
    }

    if (!Array.isArray(addressBatch) || addressBatch.length === 0) {
      console.error('Error: Batch data must be a JSON array with at least one address');
      process.exit(1);
    }

    const sessionLabel = decodeLabel(params.labelBase64);

    sessionLogger = createSessionLogger(
      addressBatch[0]?.sourceAddress || params.dest,
      {
        type: 'batch',
        destinationAddress: params.dest,
        addressCount: addressBatch.length,
      },
      {
        customLabel: sessionLabel,
      }
    );
    logToFile(`Session folder created for batch consolidation to ${params.dest} (${addressBatch.length} addresses)`);
    persistBatchInputArtifact(params.batchfile, rawBatchInput);
    updateSessionMetadata({
      sourceSample: addressBatch.slice(0, 3).map((item) => item.sourceAddress),
    });

    const exitCode = await consolidateBatch(params.dest, addressBatch);

    console.log('Press any key to close this window...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, exitCode));

  } catch (error) {
    console.error('\n✗ FATAL ERROR:', error.message);
    console.log('\nPress any key to close this window...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 1));
  }
})();
