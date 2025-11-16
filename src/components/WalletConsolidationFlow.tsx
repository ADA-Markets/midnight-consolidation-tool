import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { isValidCardanoAddress } from '@/lib/utils';
import { consolidationService } from '@/services/consolidationService';

interface WalletConsolidationFlowProps {
  connectedAddress: string;
  walletApi: any;
  onBack: () => void;
}

type Step = 'configure' | 'review' | 'signing' | 'result';

export function WalletConsolidationFlow({ connectedAddress, walletApi, onBack }: WalletConsolidationFlowProps) {
  const [step, setStep] = useState<Step>('configure');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sourceAddress = connectedAddress;

  const signatureMessage = `Assign accumulated Scavenger rights to: ${destinationAddress}`;

  const handleConfigure = () => {
    setError('');

    // Validate destination address
    if (!isValidCardanoAddress(destinationAddress)) {
      setError('Invalid destination address');
      return;
    }

    // Check they're different
    if (sourceAddress === destinationAddress) {
      setError('Source and destination addresses must be different');
      return;
    }

    setStep('review');
  };

  const handleSign = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('[WalletFlow] Requesting signature for message:', signatureMessage);
      console.log('[WalletFlow] Source address:', sourceAddress);

      // Convert message to hex format for signing
      const messageHex = Buffer.from(signatureMessage, 'utf8').toString('hex');
      console.log('[WalletFlow] Message as hex:', messageHex);

      // Use Mesh SDK to sign the message (signData expects hex payload)
      const signatureResult = await walletApi.signData(messageHex);

      console.log('[WalletFlow] Signature result:', signatureResult);

      // Extract signature from result (MeshJS returns {signature, key})
      const signature = signatureResult.signature || signatureResult;

      console.log('[WalletFlow] Final signature:', signature);

      setStep('signing');

      // Immediately send to API
      await sendConsolidation(signature);
    } catch (err: any) {
      console.error('[WalletFlow] Signature error:', err);
      setError(err.message || 'Failed to sign message. User may have rejected the signature request.');
      setLoading(false);
    }
  };

  const sendConsolidation = async (sig: string) => {
    try {
      // Launch terminal window with consolidation script
      console.log('[WalletFlow] Launching consolidation in terminal window...');

      // Call Electron/Node backend to spawn terminal
      const response = await fetch('http://localhost:3002/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: sourceAddress,
          dest: destinationAddress,
          signature: sig,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Poll for result file
        const pollResult = setInterval(async () => {
          try {
            const resultResponse = await fetch('http://localhost:3002/result');
            const result = await resultResponse.json();

            if (result.ready) {
              clearInterval(pollResult);
              setResult(result.data);
              setStep('result');
              setLoading(false);
            }
          } catch (e) {
            // Still waiting...
          }
        }, 1000);

        // Timeout after 60 seconds
        setTimeout(() => {
          clearInterval(pollResult);
          setError('Consolidation timed out');
          setLoading(false);
        }, 60000);
      } else {
        throw new Error(data.error || 'Failed to launch consolidation');
      }
    } catch (err: any) {
      console.error('[WalletFlow] Consolidation error:', err);
      setError(err.message || 'Failed to consolidate rewards');
      setLoading(false);
    }
  };

  if (step === 'configure') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Connected Wallet Header */}
        <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-green-400 font-semibold">Wallet Connected</p>
              <p className="text-xs text-gray-400 font-mono">{connectedAddress.slice(0, 20)}...{connectedAddress.slice(-10)}</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Configure Consolidation</h2>
          <p className="text-gray-400">Set up your reward consolidation</p>
        </div>

        {/* Main Content Card */}
        <div className="border-2 border-blue-500/50 rounded-lg p-6 bg-gray-800/90 space-y-6">
          {/* Source Address (locked to connected wallet) */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Source Address (Consolidate FROM)</h3>
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Connected Wallet Address</p>
              <p className="text-sm font-mono text-white break-all">
                {connectedAddress.slice(0, 30)}...{connectedAddress.slice(-15)}
              </p>
            </div>
          </div>

          {/* Destination Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Destination Address (Consolidate TO)
            </label>
            <Input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="addr1..."
              className="font-mono"
            />
            {destinationAddress && !isValidCardanoAddress(destinationAddress) && (
              <p className="text-xs text-red-400">Invalid address format</p>
            )}

            {/* Warning about registration */}
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3 mt-3">
              <p className="text-xs text-yellow-400">
                <strong>⚠️ Important:</strong> Make sure your destination address is registered with the Midnight Scavenger Hunt before consolidating.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={handleConfigure} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Review & Sign</h2>
          <p className="text-gray-400">Verify details and sign with your wallet</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-gray-800 border-2 border-blue-500/50 rounded-lg p-6 space-y-6">
          {/* Summary */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">FROM (Source)</p>
            <p className="text-sm font-mono text-white break-all">{sourceAddress}</p>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 mb-1">TO (Destination)</p>
            <p className="text-sm font-mono text-white break-all">{destinationAddress}</p>
          </div>
          </div>

          {/* Message to Sign */}
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <p className="text-sm text-blue-300 mb-2">
              <strong>Message you will sign:</strong>
            </p>
            <p className="text-sm font-mono text-white bg-gray-900 p-3 rounded">
              {signatureMessage}
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
            <p className="text-sm text-yellow-400">
              ⚠️ Please verify the addresses above are correct. Signing this message will initiate the consolidation process.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" onClick={() => setStep('configure')} className="flex-1" disabled={loading}>
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={handleSign} className="flex-1" disabled={loading}>
              {loading ? 'Signing...' : 'Sign & Consolidate'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'signing') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-4xl">⏳</div>
          <h2 className="text-2xl font-bold text-white">Processing...</h2>
          <p className="text-gray-400">Sending consolidation request to Midnight API</p>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const isSuccess = result?.success;

    const handleDownloadResults = () => {
      // Create a downloadable JSON file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `midnight-consolidation-${timestamp}.json`;

      const dataStr = JSON.stringify(result, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">{isSuccess ? '✓' : '✗'}</div>
          <h2 className="text-3xl font-bold text-white">
            {isSuccess ? 'Consolidation Complete!' : 'Consolidation Failed'}
          </h2>
          <p className="text-gray-400">
            {isSuccess ? result.message : result?.error || 'An error occurred'}
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-gray-800 border-2 border-blue-500/50 rounded-lg p-6 space-y-6">
          {/* Result Details */}
          {isSuccess && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Solutions Consolidated</span>
              <span className="text-white font-semibold">{result.solutionsConsolidated || 0}</span>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-400 mb-1">From</p>
              <p className="text-sm font-mono text-white break-all">{sourceAddress}</p>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-400 mb-1">To</p>
              <p className="text-sm font-mono text-white break-all">{destinationAddress}</p>
            </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" onClick={onBack} className="flex-1">
              Done
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleDownloadResults}
              className="flex-1"
            >
              Download Results
            </Button>
            {!isSuccess && (
              <Button variant="primary" size="lg" onClick={() => setStep('configure')} className="flex-1">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
