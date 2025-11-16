
import { useState, useEffect } from 'react';
import { BrowserWallet } from '@meshsdk/core';

interface WalletConnectProps {
  onConnectSuccess: (address: string, wallet: BrowserWallet) => void;
}

interface WalletInfo {
  name: string;
  icon: string;
}

export function WalletConnect({ onConnectSuccess }: WalletConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  // Check for available wallets on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wallets = BrowserWallet.getInstalledWallets();
      setAvailableWallets(wallets.map(w => ({
        name: w.name,
        icon: w.icon,
      })));
    }
  }, []);

  const connectWallet = async (walletName: string) => {
    setError('');
    setLoading(true);

    try {
      console.log('[WalletConnect] Connecting to wallet:', walletName);

      // Connect using Mesh SDK
      const wallet = await BrowserWallet.enable(walletName);

      console.log('[WalletConnect] Wallet connected, getting address...');

      // Try multiple methods to get the address
      let address: string | undefined;

      try {
        // First try getUsedAddresses (for wallets with transaction history)
        const usedAddresses = await wallet.getUsedAddresses();
        console.log('[WalletConnect] Used addresses:', usedAddresses);
        address = usedAddresses[0];
      } catch (e) {
        console.log('[WalletConnect] No used addresses, trying unused addresses...');
      }

      if (!address) {
        try {
          // If no used addresses, try getUnusedAddresses
          const unusedAddresses = await wallet.getUnusedAddresses();
          console.log('[WalletConnect] Unused addresses:', unusedAddresses);
          address = unusedAddresses[0];
        } catch (e) {
          console.log('[WalletConnect] No unused addresses, trying change address...');
        }
      }

      if (!address) {
        try {
          // Last resort: try getChangeAddress
          address = await wallet.getChangeAddress();
          console.log('[WalletConnect] Change address:', address);
        } catch (e) {
          console.log('[WalletConnect] No change address available');
        }
      }

      if (!address) {
        throw new Error('Could not retrieve any address from wallet. Please ensure your wallet is unlocked and has at least one address.');
      }

      console.log('[WalletConnect] Successfully got address:', address);

      onConnectSuccess(address, wallet);
    } catch (err: any) {
      console.error('[WalletConnect] Error:', err);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to connect wallet. Please try again.';

      if (err.message?.includes('User declined') || err.message?.includes('cancelled')) {
        errorMessage = 'Connection cancelled. Please try again when ready.';
      } else if (err.message?.includes('enable')) {
        errorMessage = `Could not connect to ${walletName}. Please make sure the wallet is unlocked and try again.`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back to Home Link */}
      <div className="flex justify-start">
        <a
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </a>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Connect Wallet</h2>
        <p className="text-gray-400">
          Connect your Cardano browser wallet to consolidate rewards
        </p>
      </div>

      {/* Main Card with Border */}
      <div className="border-2 border-blue-500/60 rounded-lg p-6 bg-gray-800/90 space-y-6">
        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            <strong>ℹ️ Note:</strong> This will connect your wallet and use your primary address.
            You can choose to consolidate from this address or enter a different address from your wallet.
          </p>
        </div>

        {/* Available Wallets */}
      {availableWallets.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Available Wallets</h3>
          <div className="grid gap-3">
            {availableWallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => connectWallet(wallet.name)}
                disabled={loading}
                className="flex items-center justify-between p-4 bg-gray-700 border-2 border-gray-600 hover:border-blue-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white">
                    {wallet.icon ? (
                      <img src={wallet.icon} alt={wallet.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-xl font-bold text-gray-800 capitalize">{wallet.name[0]}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white capitalize">{wallet.name}</p>
                    <p className="text-xs text-gray-400">Cardano Wallet</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6 text-center">
          <p className="text-yellow-400 mb-4">
            ⚠️ No Cardano wallets detected
          </p>
          <p className="text-sm text-gray-300 mb-4">
            Please install a Cardano browser wallet extension:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a
              href="https://namiwallet.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Nami Wallet
            </a>
            <a
              href="https://eternl.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Eternl Wallet
            </a>
            <a
              href="https://www.lace.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Lace Wallet
            </a>
            <a
              href="https://flint-wallet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Flint Wallet
            </a>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-400">Connecting to wallet...</p>
          </div>
        )}
      </div>
    </div>
  );
}
