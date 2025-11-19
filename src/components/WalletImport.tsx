import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { walletService } from '@/services/walletService';

interface WalletImportProps {
  onImportSuccess: (addresses: any[]) => void;
}

export function WalletImport({ onImportSuccess }: WalletImportProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [addressCount, setAddressCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setError('');

    // Validation
    const words = seedPhrase.trim().split(/\s+/);
    // if (words.length !== 24) {
    //   setError('Seed phrase must be exactly 24 words');
    //   return;
    // }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (addressCount < 1 || addressCount > 200) {
      setError('Address count must be between 1 and 200');
      return;
    }

    setLoading(true);

    try {
      const data = await walletService.import(seedPhrase.trim(), password, addressCount);

      if (!data.success) {
        throw new Error(data.error || 'Failed to import wallet');
      }

      onImportSuccess(data.addresses!);
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet');
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
        <h2 className="text-3xl font-bold text-white">Import Seed Phrase</h2>
        <p className="text-gray-400">
          Enter your 24-word seed phrase to derive addresses for consolidation
        </p>
      </div>

      {/* Main Card with Border */}
      <div className="border-2 border-purple-500/60 rounded-lg p-6 bg-gray-800/90 space-y-6">
        {/* Security Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            <strong>⚠️ Security:</strong> Your seed phrase is encrypted with your password and stored locally.
            It never leaves your device.
          </p>
        </div>

        {/* Seed Phrase Input */}
        <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Seed Phrase (24 words)
        </label>
        <textarea
          value={seedPhrase}
          onChange={(e) => setSeedPhrase(e.target.value)}
          placeholder="word1 word2 word3 ..."
          className="w-full h-32 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          disabled={loading}
        />
        <p className="text-xs text-gray-500">
          {seedPhrase.trim().split(/\s+/).filter(w => w).length} / 24 words
        </p>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Encryption Password
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          disabled={loading}
        />
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Confirm Password
        </label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          disabled={loading}
        />
      </div>

      {/* Address Count */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-300">
            Number of Addresses to Derive: {addressCount}
          </label>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                aria-label="Information about address derivation"
              >
                <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Address Derivation Guide</DialogTitle>
                <DialogDescription>
                  Understanding how many addresses to derive
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm text-gray-300">
                <p>
                  Select the number of addresses based on how many you believe you used during mining.
                </p>
                <div className="space-y-2">
                  <p className="font-semibold text-white">How to choose:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-400">
                    <li>If you used a single address: select <strong className="text-white">1-5</strong></li>
                    <li>For multiple mining sessions: select <strong className="text-white">10-20</strong></li>
                    <li>Heavy mining activity: select <strong className="text-white">20-50</strong></li>
                    <li>Uncertain or extensive use: select <strong className="text-white">50-100</strong></li>
                  </ul>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded p-3">
                  <p className="text-xs text-yellow-400">
                    <strong>Note:</strong> Higher numbers will take longer to scan but ensure all your addresses are found.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <input
          type="range"
          min="1"
          max="200"
          value={addressCount}
          onChange={(e) => setAddressCount(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
          disabled={loading}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1</span>
          <span className={addressCount <= 50 ? 'text-green-400' : addressCount <= 100 ? 'text-yellow-400' : 'text-red-400'}>
            {addressCount <= 50 ? 'Recommended' : addressCount <= 100 ? 'Moderate' : 'Many addresses'}
          </span>
          <span>200</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

        {/* Import Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleImport}
          disabled={loading}
        >
          {loading ? 'Importing...' : 'Import Wallet'}
        </Button>
      </div>
    </div>
  );
}
