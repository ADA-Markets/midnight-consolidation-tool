
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { isValidCardanoAddress, estimateConsolidationDuration } from '@/lib/utils';
import { getLastDestinationAddress, setLastDestinationAddress } from '@/lib/storage/preferences';

interface Address {
  index: number;
  bech32: string;
  publicKeyHex: string;
}

interface ConsolidationFormProps {
  addresses: Address[];
  selectedIndices: number[];
  onStartConsolidation: (
    destinationAddress: string,
    destinationMode: 'wallet' | 'custom',
    destinationIndex?: number,
    password?: string,
    sessionLabel?: string
  ) => void;
  onBack: () => void;
}

export function ConsolidationForm({ addresses, selectedIndices, onStartConsolidation, onBack }: ConsolidationFormProps) {
  const [mode, setMode] = useState<'wallet' | 'custom'>('wallet');
  const [selectedDestIndex, setSelectedDestIndex] = useState(0);
  const [customAddress, setCustomAddress] = useState('');
  const [password, setPassword] = useState('');
  const [sessionLabel, setSessionLabel] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const sourceCount = selectedIndices.length;
  const estimatedDuration = estimateConsolidationDuration(sourceCount);

  useEffect(() => {
    const savedAddress = getLastDestinationAddress();
    if (savedAddress) {
      setMode('custom');
      setCustomAddress(savedAddress);
    }
  }, []);

  const handleStart = () => {
    setError('');

    // Validate password
    if (!password) {
      setError('Password is required');
      return;
    }

    // Validate destination address
    let destinationAddress: string;
    let destinationIndex: number | undefined;

    if (mode === 'wallet') {
      destinationAddress = addresses[selectedDestIndex].bech32;
      destinationIndex = selectedDestIndex;
    } else {
      destinationAddress = customAddress.trim();
      if (!isValidCardanoAddress(destinationAddress)) {
        setError('Invalid Cardano address. Must start with "addr1"');
        return;
      }
    }

    // Validate confirmation
    if (!confirmed) {
      setError('Please verify all addresses are correct before proceeding');
      return;
    }

    const label = sessionLabel.trim() || undefined;
    if (mode === 'custom') {
      setLastDestinationAddress(destinationAddress);
    }

    onStartConsolidation(destinationAddress, mode, destinationIndex, password, label);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Configure Consolidation</h2>
        <p className="text-gray-400">
          Select where to consolidate your rewards
        </p>
      </div>

      {/* Source Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Source</h3>
        <p className="text-lg text-white">
          Consolidating from <span className="font-bold text-purple-400">{sourceCount}</span> addresses
        </p>
      </div>

      {/* Destination Mode */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Destination</h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('wallet')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              mode === 'wallet'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <p className="font-semibold text-white">Your Wallet</p>
              <p className="text-xs text-gray-400 mt-1">Select from your addresses</p>
            </div>
          </button>

          <button
            onClick={() => setMode('custom')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              mode === 'custom'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="text-center">
              <p className="font-semibold text-white">Custom Address</p>
              <p className="text-xs text-gray-400 mt-1">Enter any Cardano address</p>
            </div>
          </button>
        </div>
      </div>

      {/* Destination Selection */}
      {mode === 'wallet' ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Select Destination Address
          </label>
          <select
            value={selectedDestIndex}
            onChange={(e) => setSelectedDestIndex(parseInt(e.target.value))}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {addresses.map((addr) => (
              <option key={addr.index} value={addr.index}>
                #{addr.index} - {addr.bech32.slice(0, 20)}...{addr.bech32.slice(-10)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Destination Address
          </label>
          <Input
            type="text"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder="addr1..."
            className="font-mono"
          />
          {customAddress && !isValidCardanoAddress(customAddress) && (
            <p className="text-xs text-red-400">Invalid address format</p>
          )}
        </div>
      )}

      {/* Registration Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
        <p className="text-xs text-yellow-400">
          <strong>⚠️ Important:</strong> Make sure your destination address is registered with the Midnight Scavenger Hunt before consolidating.
        </p>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Wallet Password
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your wallet password"
        />
        <p className="text-xs text-gray-500">
          Required to sign consolidation messages
        </p>
      </div>

      {/* Session Label */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Session Label (optional)
        </label>
        <Input
          type="text"
          value={sessionLabel}
          onChange={(e) => setSessionLabel(e.target.value)}
          placeholder="e.g., Pi Wallet Rewards"
        />
        <p className="text-xs text-gray-500">
          Used to name the log folder that is saved to your computer for this consolidation.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Source Addresses</p>
            <p className="text-white font-semibold">{sourceCount}</p>
          </div>
          <div>
            <p className="text-gray-500">Estimated Duration</p>
            <p className="text-white font-semibold">~{estimatedDuration}</p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-700">
          <p className="text-gray-500 text-xs">Destination</p>
          <p className="text-white font-mono text-sm break-all">
            {mode === 'wallet' ? addresses[selectedDestIndex].bech32 : customAddress || 'Not set'}
          </p>
        </div>
      </div>

      {/* Confirmation */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-blue-300">
            I have verified all addresses are correct and understand I am responsible for this consolidation
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="ghost" size="lg" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button variant="primary" size="lg" onClick={handleStart} className="flex-1">
          Start Consolidation
        </Button>
      </div>
    </div>
  );
}
