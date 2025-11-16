
import { useState } from 'react';
import { truncateAddress, copyToClipboard, downloadJSON, downloadCSV } from '@/lib/utils';
import { Button } from './ui/button';

interface Address {
  index: number;
  bech32: string;
  publicKeyHex: string;
  consolidated?: boolean;
  consolidatedTo?: string;
}

interface AddressTableProps {
  addresses: Address[];
  onProceed: (selectedIndices: number[]) => void;
  onDeriveMore?: (count: number) => void;
  onClearWallet?: () => void;
}

export function AddressTable({ addresses, onProceed, onDeriveMore, onClearWallet }: AddressTableProps) {
  const [selectedAddresses, setSelectedAddresses] = useState<Set<number>>(
    new Set(addresses.map(a => a.index))
  );
  const [copied, setCopied] = useState<number | null>(null);
  const [deriveCount, setDeriveCount] = useState<number>(20);
  const [showDeriveInput, setShowDeriveInput] = useState(false);

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedAddresses);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedAddresses(newSelected);
  };

  const handleCopy = async (address: string, index: number) => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(index);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleExportJSON = () => {
    downloadJSON(addresses, 'addresses.json');
  };

  const handleExportCSV = () => {
    const csvData = addresses.map(addr => ({
      index: addr.index,
      address: addr.bech32,
      publicKey: addr.publicKeyHex,
    }));
    downloadCSV(csvData, 'addresses.csv');
  };

  const handleDeriveMore = () => {
    if (onDeriveMore && deriveCount > 0) {
      onDeriveMore(deriveCount);
      setShowDeriveInput(false);
    }
  };

  const selectedCount = selectedAddresses.size;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Your Addresses</h2>
        <p className="text-gray-400">
          {addresses.length} addresses derived • {selectedCount} selected for consolidation
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {onDeriveMore && !showDeriveInput && (
            <Button variant="ghost" size="sm" onClick={() => setShowDeriveInput(true)}>
              + Derive More Addresses
            </Button>
          )}
          {onDeriveMore && showDeriveInput && (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                max="200"
                value={deriveCount}
                onChange={(e) => setDeriveCount(parseInt(e.target.value) || 20)}
                className="w-24 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Count"
              />
              <Button variant="ghost" size="sm" onClick={handleDeriveMore}>
                Derive
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeriveInput(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportJSON}>
            Export JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportCSV}>
            Export CSV
          </Button>
          {onClearWallet && (
            <Button variant="danger" size="sm" onClick={onClearWallet}>
              Clear Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Address Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gray-900 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedCount === addresses.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAddresses(new Set(addresses.map(a => a.index)));
                      } else {
                        setSelectedAddresses(new Set());
                      }
                    }}
                    className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {addresses.map((addr) => (
                <tr
                  key={addr.index}
                  className={selectedAddresses.has(addr.index) ? 'bg-purple-500/10' : 'hover:bg-gray-700/50'}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAddresses.has(addr.index)}
                      onChange={() => handleToggle(addr.index)}
                      className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {addr.index}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-white">
                    <span title={addr.bech32}>{truncateAddress(addr.bech32)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {addr.consolidated ? (
                      <span className="text-green-400" title={`Consolidated to: ${addr.consolidatedTo}`}>
                        ✓ Consolidated
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(addr.bech32, addr.index)}
                    >
                      {copied === addr.index ? '✓ Copied' : 'Copy'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning if none selected */}
      {selectedCount === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <p className="text-sm text-yellow-400">
            ⚠️ No addresses selected. Please select at least one address to consolidate.
          </p>
        </div>
      )}

      {/* Proceed Button */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={() => onProceed(Array.from(selectedAddresses))}
          disabled={selectedCount === 0}
        >
          Proceed to Consolidation ({selectedCount} addresses)
        </Button>
      </div>
    </div>
  );
}
