/**
 * Consolidation Orchestrator
 * Handles the entire consolidation workflow on the client side
 */

export interface ConsolidationProgress {
  current: number;
  total: number;
  successful: number;
  failed: number;
  currentAddress: string;
  status: 'signing' | 'consolidating' | 'completed' | 'stopped';
  recentResults: ConsolidationResult[];
  totalSolutionsConsolidated: number;
  logs: string[];
}

export interface ConsolidationResult {
  sourceAddress: string;
  sourceIndex: number;
  success: boolean;
  solutionsConsolidated?: number;
  error?: string;
  alreadyDonated?: boolean;
  skipped?: boolean;
  apiResponse?: any;
}

export interface ConsolidationConfig {
  sourceAddresses: Array<{ index: number; bech32: string }>;
  destinationAddress: string;
  destinationMode: 'wallet' | 'custom';
  destinationIndex?: number;
  password: string;
  sessionLabel?: string;
  onProgress: (progress: ConsolidationProgress) => void;
}

export class ConsolidationOrchestrator {
  private stopped = false;
  private progress: ConsolidationProgress = {
    current: 0,
    total: 0,
    successful: 0,
    failed: 0,
    currentAddress: '',
    status: 'signing',
    recentResults: [],
    totalSolutionsConsolidated: 0,
    logs: [],
  };

  private addLog(message: string): void {
    this.progress.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    // Keep only last 50 logs
    if (this.progress.logs.length > 50) {
      this.progress.logs = this.progress.logs.slice(-50);
    }
  }

  /**
   * Stop the consolidation process
   */
  stop(): void {
    this.stopped = true;
  }

  /**
   * Main consolidation workflow
   */
  async consolidate(config: ConsolidationConfig): Promise<ConsolidationResult[]> {
    const { sourceAddresses, destinationAddress, destinationMode, destinationIndex, password, sessionLabel, onProgress } = config;

    this.stopped = false;
    this.progress = {
      current: 0,
      total: sourceAddresses.length,
      successful: 0,
      failed: 0,
      currentAddress: '',
      status: 'signing',
      recentResults: [],
      totalSolutionsConsolidated: 0,
      logs: [],
    };

    const results: ConsolidationResult[] = [];

    // Phase 1: Batch sign all messages
    this.addLog(`Starting consolidation for ${sourceAddresses.length} addresses`);
    this.addLog(`Destination: ${destinationAddress.slice(0, 20)}...`);
    onProgress({ ...this.progress });

    const signatures = await this.batchSignMessages(
      sourceAddresses,
      destinationAddress,
      password,
      onProgress
    );

    if (this.stopped) {
      this.progress.status = 'stopped';
      onProgress({ ...this.progress });
      return results;
    }

    // Phase 2: Batch consolidation (all in one terminal window)
    this.progress.status = 'consolidating';
    this.progress.current = 0;
    onProgress({ ...this.progress });

    // Prepare batch array with signatures
    const addressBatch: Array<{ sourceAddress: string; signature: string; sourceIndex: number }> = [];

    for (let i = 0; i < sourceAddresses.length; i++) {
      const addr = sourceAddresses[i];

      // Skip if source address matches destination address
      if (addr.bech32 === destinationAddress) {
        const result: ConsolidationResult = {
          sourceAddress: addr.bech32,
          sourceIndex: addr.index,
          success: false,
          skipped: true,
          error: 'Source address matches destination - skipped',
        };
        results.push(result);
        continue;
      }

      const signature = signatures.get(addr.index);

      if (!signature) {
        // Failed to sign this address
        const result: ConsolidationResult = {
          sourceAddress: addr.bech32,
          sourceIndex: addr.index,
          success: false,
          error: 'Failed to sign message',
        };
        results.push(result);
        this.progress.failed++;
        continue;
      }

      addressBatch.push({
        sourceAddress: addr.bech32,
        signature: signature,
        sourceIndex: addr.index,
      });
    }

    // Make batch API call if we have addresses to consolidate
    if (addressBatch.length > 0 && !this.stopped) {
      this.addLog(`Batch consolidating ${addressBatch.length} addresses in one window...`);
      this.progress.currentAddress = `Batch consolidating ${addressBatch.length} addresses...`;
      onProgress({ ...this.progress });

      const batchResult = await this.consolidateBatch(
        destinationAddress,
        addressBatch,
        sessionLabel
      );

      // Process batch results
      if (batchResult.success && batchResult.results) {
        for (const result of batchResult.results) {
          results.push(result);

          if (result.success) {
            this.progress.successful++;
            this.addLog(`✓ Address #${result.sourceIndex}: ${result.solutionsConsolidated || 0} solutions`);
            if (result.solutionsConsolidated) {
              this.progress.totalSolutionsConsolidated += result.solutionsConsolidated;
            }
          } else if (result.skipped || result.alreadyDonated) {
            this.progress.successful++;
            this.addLog(`⚠ Address #${result.sourceIndex}: Already donated`);
          } else {
            this.progress.failed++;
            this.addLog(`✗ Address #${result.sourceIndex}: ${result.error || 'Failed'}`);
          }

          this.addRecentResult(result);
        }
      } else {
        // Batch failed entirely
        this.addLog(`✗ Batch consolidation failed: ${batchResult.error}`);
        for (const item of addressBatch) {
          const result: ConsolidationResult = {
            sourceAddress: item.sourceAddress,
            sourceIndex: item.sourceIndex,
            success: false,
            error: batchResult.error || 'Batch consolidation failed',
          };
          results.push(result);
          this.progress.failed++;
          this.addRecentResult(result);
        }
      }
    }

    this.progress.current = sourceAddresses.length;
    this.progress.status = this.stopped ? 'stopped' : 'completed';
    this.addLog(`Consolidation ${this.stopped ? 'stopped' : 'completed'}: ${this.progress.successful} successful, ${this.progress.failed} failed`);
    onProgress({ ...this.progress });

    return results;
  }

  /**
   * Batch sign all donation messages
   */
  private async batchSignMessages(
    addresses: Array<{ index: number; bech32: string }>,
    destinationAddress: string,
    password: string,
    onProgress: (progress: ConsolidationProgress) => void
  ): Promise<Map<number, string>> {
    const signatureMap = new Map<number, string>();

    // Filter out destination address from signing
    const addressesToSign = addresses.filter(addr => addr.bech32 !== destinationAddress);

    if (addressesToSign.length === 0) {
      return signatureMap;
    }

    try {
      // Load wallet with password
      const { LucidWalletManager } = await import('../wallet/lucid-manager');
      const walletManager = new LucidWalletManager();
      await walletManager.loadWallet(password);

      // Batch sign all addresses
      const addressIndices = addressesToSign.map(addr => addr.index);
      const signatures = await walletManager.batchSignDonations(addressIndices, destinationAddress);

      return signatures;
    } catch (error: any) {
      console.error('[Orchestrator] Batch signing failed:', error);
      throw new Error(`Failed to sign messages: ${error.message}`);
    }
  }

  /**
   * Consolidate multiple addresses in a single batch (one terminal window)
   */
  private async consolidateBatch(
    destinationAddress: string,
    addressBatch: Array<{ sourceAddress: string; signature: string; sourceIndex: number }>,
    sessionLabel?: string
  ): Promise<{ success: boolean; results?: ConsolidationResult[]; error?: string; summary?: any }> {
    try {
      // Import consolidation service dynamically to avoid circular dependencies
      const { consolidationService } = await import('../../services/consolidationService');

      const result = await consolidationService.donateBatch(destinationAddress, addressBatch, sessionLabel);

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error during batch consolidation',
      };
    }
  }

  /**
   * Add result to recent results (keep last 5)
   */
  private addRecentResult(result: ConsolidationResult): void {
    this.progress.recentResults.unshift(result);
    if (this.progress.recentResults.length > 5) {
      this.progress.recentResults.pop();
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
