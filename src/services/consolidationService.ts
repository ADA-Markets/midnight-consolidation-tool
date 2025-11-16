/**
 * Client-side consolidation service
 * Replaces Next.js API routes with direct calls to consolidation logger
 */

import axios from 'axios';
import { consolidationLogger, ConsolidationRecord } from '@/lib/storage/consolidation-logger';

// Use terminal launcher to spawn CMD windows showing transparent API calls
// The terminal launcher (terminal-launcher.cjs) must be running on port 3002
const TERMINAL_LAUNCHER_URL = 'http://localhost:3002';

export const consolidationService = {
  async saveSession(results: any[], sessionId: string) {
    try {
      if (!results || !Array.isArray(results)) {
        return { success: false, error: 'Invalid results data' };
      }

      // Convert results to ConsolidationRecord format
      const records: ConsolidationRecord[] = results.map((r: any) => ({
        ts: new Date().toISOString(),
        sourceAddress: r.sourceAddress,
        sourceIndex: r.sourceIndex,
        destinationAddress: r.destinationAddress || '',
        destinationIndex: r.destinationIndex,
        destinationMode: r.destinationMode || 'wallet',
        solutionsConsolidated: r.solutionsConsolidated || 0,
        message: r.success ? 'Consolidated successfully' : r.error,
        status: r.success ? 'success' : 'failed',
        error: r.error,
        apiResponse: r.apiResponse,
        skipped: r.skipped,
      }));

      const filepath = consolidationLogger.saveSessionResults(records, sessionId);

      return {
        success: true,
        filepath,
        message: `Session results saved to ${filepath}`,
      };
    } catch (error: any) {
      console.error('[Consolidation Service] Save session error:', error);
      return { success: false, error: error.message || 'Failed to save session results' };
    }
  },

  async getHistory() {
    try {
      const history = consolidationLogger.getAllHistory();
      return { success: true, history };
    } catch (error: any) {
      console.error('[Consolidation Service] Get history error:', error);
      return { success: false, error: error.message || 'Failed to get history' };
    }
  },

  async donate(
    sourceAddress: string,
    destinationAddress: string,
    signature: string,
    sourceIndex?: number,
    destinationIndex?: number,
    destinationMode?: string
  ) {
    try {
      if (!sourceAddress || !destinationAddress || !signature) {
        return {
          success: false,
          error: 'Missing required fields: sourceAddress, destinationAddress, signature',
        };
      }

      // Skip if source and destination are the same
      if (sourceAddress === destinationAddress) {
        return {
          success: false,
          error: 'Source and destination cannot be the same',
        };
      }

      console.log('[Consolidation Service] Launching terminal window for consolidation:', {
        sourceAddress,
        destinationAddress,
      });

      // Launch terminal window with consolidation script
      const launchResponse = await axios.post(`${TERMINAL_LAUNCHER_URL}/consolidate`, {
        source: sourceAddress,
        dest: destinationAddress,
        signature: signature,
      }, {
        timeout: 10000, // 10 second timeout for launching terminal
      });

      if (!launchResponse.data.success) {
        throw new Error(launchResponse.data.error || 'Failed to launch terminal');
      }

      console.log('[Consolidation Service] Terminal launched, polling for result...');

      // Poll for result from terminal script
      const maxAttempts = 60; // 60 seconds max wait
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;

        try {
          const resultResponse = await axios.get(`${TERMINAL_LAUNCHER_URL}/result`);

          if (resultResponse.data.ready) {
            const result = resultResponse.data.data;
            console.log('[Consolidation Service] Received result from terminal:', result);

            if (result.success) {
              // Log successful consolidation
              consolidationLogger.logConsolidation({
                ts: new Date().toISOString(),
                sourceAddress,
                sourceIndex,
                destinationAddress,
                destinationIndex,
                destinationMode: (destinationMode as 'wallet' | 'custom') || 'wallet',
                solutionsConsolidated: result.solutionsConsolidated || 0,
                message: result.message || 'Rewards consolidated successfully',
                status: 'success',
              });

              return {
                success: true,
                message: result.message || 'Rewards consolidated successfully',
                solutionsConsolidated: result.solutionsConsolidated || 0,
                sourceAddress,
                destinationAddress,
              };
            } else {
              // Handle already donated or other errors
              const isAlreadyDonated = result.alreadyDonated || result.error?.includes('already');

              // Log based on error type
              consolidationLogger.logConsolidation({
                ts: new Date().toISOString(),
                sourceAddress,
                sourceIndex,
                destinationAddress,
                destinationIndex,
                destinationMode: (destinationMode as 'wallet' | 'custom') || 'wallet',
                solutionsConsolidated: 0,
                message: result.error || 'Consolidation failed',
                status: isAlreadyDonated ? 'success' : 'failed',
                error: result.error,
              });

              return {
                success: false,
                error: result.error || 'Consolidation failed',
                alreadyDonated: isAlreadyDonated,
                sourceAddress,
                destinationAddress,
              };
            }
          }
        } catch (pollError) {
          // Result not ready yet, continue polling
          continue;
        }
      }

      // Timeout
      const timeoutError = 'Consolidation timed out after 60 seconds';
      console.error('[Consolidation Service]', timeoutError);

      consolidationLogger.logConsolidation({
        ts: new Date().toISOString(),
        sourceAddress,
        sourceIndex,
        destinationAddress,
        destinationIndex,
        destinationMode: (destinationMode as 'wallet' | 'custom') || 'wallet',
        solutionsConsolidated: 0,
        status: 'failed',
        error: timeoutError,
      });

      return {
        success: false,
        error: timeoutError,
        isTimeout: true,
      };

    } catch (error: any) {
      console.error('[Consolidation Service] Donate error:', error);

      const errorMsg = error.message || 'Failed to consolidate rewards';

      // Log failed consolidation
      consolidationLogger.logConsolidation({
        ts: new Date().toISOString(),
        sourceAddress,
        sourceIndex,
        destinationAddress,
        destinationIndex,
        destinationMode: (destinationMode as 'wallet' | 'custom') || 'wallet',
        solutionsConsolidated: 0,
        status: 'failed',
        error: errorMsg,
      });

      return {
        success: false,
        error: errorMsg
      };
    }
  },

  async donateBatch(
    destinationAddress: string,
    addressBatch: Array<{ sourceAddress: string; signature: string; sourceIndex: number }>
  ) {
    try {
      if (!destinationAddress || !Array.isArray(addressBatch) || addressBatch.length === 0) {
        return {
          success: false,
          error: 'Missing required fields: destinationAddress and addressBatch',
        };
      }

      console.log('[Consolidation Service] Launching batch terminal for', addressBatch.length, 'addresses');

      // Launch terminal window with batch consolidation script
      const launchResponse = await axios.post(`${TERMINAL_LAUNCHER_URL}/consolidate-batch`, {
        dest: destinationAddress,
        addressBatch: addressBatch,
      }, {
        timeout: 10000, // 10 second timeout for launching terminal
      });

      if (!launchResponse.data.success) {
        throw new Error(launchResponse.data.error || 'Failed to launch batch terminal');
      }

      console.log('[Consolidation Service] Batch terminal launched, polling for result...');

      // Poll for result from terminal script
      const maxAttempts = 300; // 5 minutes max wait for batch operations
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;

        try {
          const resultResponse = await axios.get(`${TERMINAL_LAUNCHER_URL}/result`);

          if (resultResponse.data.ready) {
            const result = resultResponse.data.data;
            console.log('[Consolidation Service] Received batch result from terminal:', result);

            // Log all successful consolidations
            if (result.results) {
              result.results.forEach((r: any) => {
                if (r.success || r.skipped) {
                  consolidationLogger.logConsolidation({
                    ts: new Date().toISOString(),
                    sourceAddress: r.sourceAddress,
                    sourceIndex: r.sourceIndex,
                    destinationAddress,
                    destinationMode: 'wallet',
                    solutionsConsolidated: r.solutionsConsolidated || 0,
                    message: r.message || (r.skipped ? 'Already donated' : 'Consolidated successfully'),
                    status: 'success',
                  });
                } else {
                  consolidationLogger.logConsolidation({
                    ts: new Date().toISOString(),
                    sourceAddress: r.sourceAddress,
                    sourceIndex: r.sourceIndex,
                    destinationAddress,
                    destinationMode: 'wallet',
                    solutionsConsolidated: 0,
                    status: 'failed',
                    error: r.error || 'Consolidation failed',
                  });
                }
              });
            }

            return {
              success: result.success,
              results: result.results,
              summary: result.summary,
              destinationAddress,
            };
          }
        } catch (pollError) {
          // Result not ready yet, continue polling
          continue;
        }
      }

      // Timeout
      const timeoutError = 'Batch consolidation timed out after 5 minutes';
      console.error('[Consolidation Service]', timeoutError);

      return {
        success: false,
        error: timeoutError,
        isTimeout: true,
      };

    } catch (error: any) {
      console.error('[Consolidation Service] Batch donate error:', error);
      return {
        success: false,
        error: error.message || 'Failed to batch consolidate rewards'
      };
    }
  },
};
