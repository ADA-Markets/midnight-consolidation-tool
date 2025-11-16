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

const MIDNIGHT_API = 'https://scavenger.prod.gd.midnighttge.io';

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

    const response = await makeRequest(url, 'POST');

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
        path.join(__dirname, 'consolidation-result.json'),
        JSON.stringify(result, null, 2)
      );

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
        path.join(__dirname, 'consolidation-result.json'),
        JSON.stringify(result, null, 2)
      );

      return 0;
    } else {
      throw new Error(`Server rejected consolidation: ${response.data.message || response.status}`);
    }
  } catch (error) {
    console.error('\n================================================================================');
    console.error('✗ ERROR - Consolidation Failed');
    console.error('================================================================================\n');
    console.error('Error:', error.message);
    console.error('\n');

    const result = {
      success: false,
      error: error.message,
      sourceAddress,
      destinationAddress,
    };

    fs.writeFileSync(
      path.join(__dirname, 'consolidation-result.json'),
      JSON.stringify(result, null, 2)
    );

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
