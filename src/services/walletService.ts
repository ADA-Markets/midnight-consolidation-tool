/**
 * Client-side wallet service
 * Replaces Next.js API routes with direct calls to wallet manager
 */

import { LucidWalletManager } from '@/lib/wallet/lucid-manager';

const walletManager = new LucidWalletManager();

export interface WalletImportResult {
  success: boolean;
  addresses?: any[];
  count?: number;
  error?: string;
}

export interface DeriveMoreResult {
  success: boolean;
  addresses?: any[];
  count?: number;
  error?: string;
}

export interface ClearWalletResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const walletService = {
  async import(seedPhrase: string, password: string, addressCount?: number): Promise<WalletImportResult> {
    try {
      if (!seedPhrase || !password) {
        return { success: false, error: 'Missing required fields: seedPhrase, password' };
      }

      const count = addressCount || 20;

      if (count < 1 || count > 200) {
        return { success: false, error: 'Address count must be between 1 and 200' };
      }

      const walletInfo = await walletManager.importWallet(seedPhrase.trim(), password, count);

      return {
        success: true,
        addresses: walletInfo.addresses,
        count: walletInfo.addresses.length,
      };
    } catch (error: any) {
      console.error('[Wallet Service] Import wallet error:', error);
      return { success: false, error: error.message || 'Failed to import wallet' };
    }
  },

  async deriveMore(password: string, startIndex: number, count: number): Promise<DeriveMoreResult> {
    try {
      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      if (typeof startIndex !== 'number' || typeof count !== 'number') {
        return { success: false, error: 'startIndex and count must be numbers' };
      }

      if (count < 1 || count > 200) {
        return { success: false, error: 'Count must be between 1 and 200' };
      }

      console.log(`[Wallet Service] Deriving ${count} more addresses starting from index ${startIndex}`);

      // Load existing wallet
      await walletManager.loadWallet(password);

      // Derive new addresses
      const newAddresses = await walletManager.deriveAdditionalAddresses(startIndex, count);

      return {
        success: true,
        addresses: newAddresses,
        count: newAddresses.length,
      };
    } catch (error: any) {
      console.error('[Wallet Service] Derive more addresses error:', error);
      return { success: false, error: error.message || 'Failed to derive addresses' };
    }
  },

  async clear(): Promise<ClearWalletResult> {
    try {
      console.log('[Wallet Service] Clearing wallet...');

      // Clear wallet data
      walletManager.clearWallet();

      return {
        success: true,
        message: 'Wallet cleared successfully',
      };
    } catch (error: any) {
      console.error('[Wallet Service] Clear wallet error:', error);
      return { success: false, error: error.message || 'Failed to clear wallet' };
    }
  },

  async load(password: string) {
    try {
      await walletManager.loadWallet(password);
      return { success: true };
    } catch (error: any) {
      console.error('[Wallet Service] Load wallet error:', error);
      return { success: false, error: error.message || 'Failed to load wallet' };
    }
  },

  async status() {
    try {
      const hasWallet = walletManager.hasWallet();
      return { success: true, hasWallet };
    } catch (error: any) {
      console.error('[Wallet Service] Status error:', error);
      return { success: false, error: error.message };
    }
  },

  async batchSign(password: string, addresses: Array<{ sourceAddressIndex: number; sourceAddress: string; destinationAddress: string }>) {
    try {
      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      // Load wallet
      await walletManager.loadWallet(password);

      const signatures = [];
      for (const addr of addresses) {
        try {
          const signature = await walletManager.makeDonationSignature(
            addr.sourceAddressIndex,
            addr.sourceAddress,
            addr.destinationAddress
          );
          signatures.push({
            sourceAddressIndex: addr.sourceAddressIndex,
            sourceAddress: addr.sourceAddress,
            signature,
          });
        } catch (error: any) {
          console.error(`[Wallet Service] Failed to sign for address ${addr.sourceAddress}:`, error.message);
          signatures.push({
            sourceAddressIndex: addr.sourceAddressIndex,
            sourceAddress: addr.sourceAddress,
            error: error.message,
          });
        }
      }

      return { success: true, signatures };
    } catch (error: any) {
      console.error('[Wallet Service] Batch sign error:', error);
      return { success: false, error: error.message || 'Failed to sign messages' };
    }
  },
};
