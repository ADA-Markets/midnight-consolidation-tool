/**
 * Consolidation Logger
 * Logs successful consolidation/donation records to localStorage
 */

export interface ConsolidationRecord {
  ts: string; // ISO timestamp
  sourceAddress: string;
  sourceIndex?: number; // Address index if from wallet
  destinationAddress: string;
  destinationIndex?: number; // Destination address index if from wallet
  destinationMode: 'wallet' | 'custom';
  solutionsConsolidated: number;
  message?: string; // Server response message
  status: 'success' | 'failed';
  error?: string; // Error message if failed
  apiResponse?: any; // Full API response from Midnight server
  skipped?: boolean; // If address was skipped (e.g., destination)
}

class ConsolidationLogger {
  private storageKey = 'midnight-consolidation-records';

  constructor() {
    console.log(`[Consolidation] Using browser localStorage for consolidation records`);
  }

  /**
   * Log a consolidation record (success or failure)
   */
  logConsolidation(record: ConsolidationRecord): void {
    try {
      const records = this.readConsolidations();
      records.push(record);
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (error: any) {
      console.error('[ConsolidationLogger] Failed to log consolidation:', error.message);
    }
  }

  /**
   * Read all consolidation records
   */
  readConsolidations(): ConsolidationRecord[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored) as ConsolidationRecord[];
    } catch (error: any) {
      console.error('[ConsolidationLogger] Failed to read consolidations:', error.message);
      return [];
    }
  }

  /**
   * Get consolidations for a specific source address
   */
  getConsolidationsForAddress(address: string): ConsolidationRecord[] {
    const allRecords = this.readConsolidations();
    return allRecords.filter(record => record.sourceAddress === address);
  }

  /**
   * Get all successful consolidations
   */
  getSuccessfulConsolidations(): ConsolidationRecord[] {
    const allRecords = this.readConsolidations();
    return allRecords.filter(record => record.status === 'success');
  }

  /**
   * Get recent consolidations (last N records)
   */
  getRecentConsolidations(count: number): ConsolidationRecord[] {
    try {
      const allRecords = this.readConsolidations();
      return allRecords.slice(-count);
    } catch (error: any) {
      console.error('[ConsolidationLogger] Failed to read recent consolidations:', error.message);
      return [];
    }
  }

  /**
   * Check if an address has been consolidated to a destination
   */
  hasAddressBeenConsolidated(sourceAddress: string, destinationAddress?: string): boolean {
    const records = this.getConsolidationsForAddress(sourceAddress);
    const successfulRecords = records.filter(r => r.status === 'success');

    if (!destinationAddress) {
      return successfulRecords.length > 0;
    }

    return successfulRecords.some(r => r.destinationAddress === destinationAddress);
  }

  /**
   * Get the latest consolidation for an address
   */
  getLatestConsolidation(sourceAddress: string): ConsolidationRecord | null {
    const records = this.getConsolidationsForAddress(sourceAddress);
    if (records.length === 0) return null;
    return records[records.length - 1];
  }

  /**
   * Save consolidation session results to localStorage and return JSON for download
   */
  saveSessionResults(results: ConsolidationRecord[], sessionId?: string): string {
    try {
      // Generate session data
      const timestamp = sessionId || new Date().toISOString().replace(/[:.]/g, '-');
      const sessionData = {
        sessionId: timestamp,
        timestamp: new Date().toISOString(),
        totalAddresses: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.skipped).length,
        totalSolutionsConsolidated: results.reduce((sum, r) => sum + (r.solutionsConsolidated || 0), 0),
        results,
      };

      // Store in localStorage with unique key for this session
      const sessionKey = `midnight-consolidation-session-${timestamp}`;
      localStorage.setItem(sessionKey, JSON.stringify(sessionData));

      console.log(`[ConsolidationLogger] Session results saved to localStorage: ${sessionKey}`);

      // Return formatted JSON string for download
      return JSON.stringify(sessionData, null, 2);
    } catch (error: any) {
      console.error('[ConsolidationLogger] Failed to save session results:', error.message);
      throw error;
    }
  }
}

// Singleton instance
export const consolidationLogger = new ConsolidationLogger();
