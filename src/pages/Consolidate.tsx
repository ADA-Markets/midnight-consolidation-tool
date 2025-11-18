import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WalletImport } from '@/components/WalletImport';
import { WalletConnect } from '@/components/WalletConnect';
import { WalletConsolidationFlow } from '@/components/WalletConsolidationFlow';
import { AddressTable } from '@/components/AddressTable';
import { ConsolidationForm } from '@/components/ConsolidationForm';
import { ProgressModal } from '@/components/ProgressModal';
import { ResultsModal } from '@/components/ResultsModal';
import { PasswordModal } from '@/components/PasswordModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ConsolidationOrchestrator, ConsolidationProgress, ConsolidationResult } from '@/lib/consolidation/orchestrator';
import { walletService } from '@/services/walletService';
import { consolidationService } from '@/services/consolidationService';

type Step = 'import' | 'addresses' | 'configure' | 'consolidating' | 'results' | 'wallet-flow';
type Mode = 'seed' | 'wallet';

interface Address {
  index: number;
  bech32: string;
  publicKeyHex: string;
  consolidated?: boolean;
  consolidatedTo?: string;
}

export default function ConsolidatePage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('seed');
  const [step, setStep] = useState<Step>('import');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [progress, setProgress] = useState<ConsolidationProgress | null>(null);
  const [results, setResults] = useState<ConsolidationResult[]>([]);
  const [orchestrator] = useState(() => new ConsolidationOrchestrator());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deriveMoreCount, setDeriveMoreCount] = useState(20);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState({ title: '', message: '', details: '' });
  const [connectedAddress, setConnectedAddress] = useState('');
  const [walletApi, setWalletApi] = useState<any>(null);

  // Read mode from URL params
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'wallet') {
      setMode('wallet');
    } else {
      setMode('seed');
    }
  }, [searchParams]);

  const handleImportSuccess = (importedAddresses: Address[]) => {
    setAddresses(importedAddresses);
    setSelectedIndices(importedAddresses.map(a => a.index));
    setStep('addresses');
  };

  const handleWalletConnectSuccess = (address: string, wallet: any) => {
    setConnectedAddress(address);
    setWalletApi(wallet);
    setStep('wallet-flow');
  };

  const handleWalletBack = () => {
    setStep('import');
    setConnectedAddress('');
    setWalletApi(null);
  };

  const handleProceedToConfig = (selectedAddressIndices: number[]) => {
    setSelectedIndices(selectedAddressIndices);
    setStep('configure');
  };

  const handleBack = () => {
    setStep('addresses');
  };

  const handleStartConsolidation = async (
    destinationAddress: string,
    destinationMode: 'wallet' | 'custom',
    destinationIndex?: number,
    password?: string,
    sessionLabel?: string
  ) => {
    if (!password) {
      alert('Password is required');
      return;
    }

    setStep('consolidating');

    const sourceAddresses = addresses.filter(a => selectedIndices.includes(a.index));

    try {
      const consolidationResults = await orchestrator.consolidate({
        sourceAddresses,
        destinationAddress,
        destinationMode,
        destinationIndex,
        password,
        sessionLabel,
        onProgress: (progressUpdate) => {
          setProgress(progressUpdate);
        },
      });

      setResults(consolidationResults);

      // Auto-save session results
      try {
        await consolidationService.saveSession(
          consolidationResults,
          new Date().toISOString().replace(/[:.]/g, '-')
        );
      } catch (saveError) {
        console.error('Failed to auto-save session results:', saveError);
      }

      setStep('results');
    } catch (error: any) {
      alert(`Consolidation failed: ${error.message}`);
      setStep('configure');
    }
  };

  const handleStopConsolidation = () => {
    orchestrator.stop();
  };

  const handleCloseResults = () => {
    // Update addresses to mark which ones were consolidated
    const updatedAddresses = addresses.map(addr => {
      const result = results.find(r => r.sourceIndex === addr.index);
      if (result && result.success) {
        return {
          ...addr,
          consolidated: true,
          consolidatedTo: result.success ? 'Destination' : undefined,
        };
      }
      return addr;
    });
    setAddresses(updatedAddresses);
    setStep('addresses');
  };

  const handleDeriveMore = (count: number) => {
    if (mode !== 'seed') {
      alert('Deriving more addresses only works with seed phrase import');
      return;
    }
    setDeriveMoreCount(count);
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    setShowPasswordModal(false);

    try {
      const currentMaxIndex = Math.max(...addresses.map(a => a.index), -1);
      const startIndex = currentMaxIndex + 1;

      const data = await walletService.deriveMore(password, startIndex, deriveMoreCount);

      if (!data.success) {
        alert(`Failed to derive addresses: ${data.error}`);
        return;
      }

      // Add new addresses to existing list
      const newAddresses: Address[] = data.addresses!.map((addr: any) => ({
        index: addr.index,
        bech32: addr.bech32,
        publicKeyHex: addr.publicKeyHex,
      }));

      setAddresses([...addresses, ...newAddresses]);
      setSelectedIndices([...selectedIndices, ...newAddresses.map(a => a.index)]);

      // Show confirmation
      setConfirmationData({
        title: 'Addresses Derived Successfully',
        message: `${newAddresses.length} new addresses have been derived`,
        details: `You now have a total of ${addresses.length + newAddresses.length} addresses`,
      });
      setShowConfirmation(true);
    } catch (error: any) {
      alert(`Error deriving addresses: ${error.message}`);
    }
  };

  const handleClearWallet = async () => {
    const confirmed = confirm(
      'Are you sure you want to clear your wallet? This will remove the encrypted seed phrase and all derived addresses from storage. This action cannot be undone.\n\nNote: Consolidation history will be preserved.'
    );

    if (!confirmed) return;

    try {
      const data = await walletService.clear();

      if (!data.success) {
        alert(`Failed to clear wallet: ${data.error}`);
        return;
      }

      // Clear local state and redirect to home
      setAddresses([]);
      setSelectedIndices([]);
      setStep('import');

      setConfirmationData({
        title: 'Wallet Cleared',
        message: 'Your wallet has been successfully cleared',
        details: 'All wallet data has been removed from this device',
      });
      setShowConfirmation(true);
    } catch (error: any) {
      alert(`Error clearing wallet: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      {step === 'import' && mode === 'seed' && (
        <WalletImport onImportSuccess={handleImportSuccess} />
      )}

      {step === 'import' && mode === 'wallet' && (
        <WalletConnect onConnectSuccess={handleWalletConnectSuccess} />
      )}

      {step === 'wallet-flow' && (
        <WalletConsolidationFlow
          connectedAddress={connectedAddress}
          walletApi={walletApi}
          onBack={handleWalletBack}
        />
      )}

      {step === 'addresses' && (
        <AddressTable
          addresses={addresses}
          onProceed={handleProceedToConfig}
          onDeriveMore={mode === 'seed' ? handleDeriveMore : undefined}
          onClearWallet={mode === 'seed' ? handleClearWallet : undefined}
        />
      )}

      {step === 'configure' && (
        <ConsolidationForm
          addresses={addresses}
          selectedIndices={selectedIndices}
          onStartConsolidation={handleStartConsolidation}
          onBack={handleBack}
        />
      )}

      {step === 'consolidating' && progress && (
        <ProgressModal
          progress={progress}
          onStop={handleStopConsolidation}
        />
      )}

      {step === 'results' && (
        <ResultsModal
          results={results}
          onClose={handleCloseResults}
        />
      )}

      <PasswordModal
        isOpen={showPasswordModal}
        title="Derive More Addresses"
        message="Enter your wallet password to derive more addresses"
        onConfirm={handlePasswordConfirm}
        onCancel={() => setShowPasswordModal(false)}
      />

      <ConfirmationModal
        isOpen={showConfirmation}
        title={confirmationData.title}
        message={confirmationData.message}
        details={confirmationData.details}
        onClose={() => setShowConfirmation(false)}
      />
    </main>
  );
}
