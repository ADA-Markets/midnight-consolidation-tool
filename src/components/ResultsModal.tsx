
import { ConsolidationResult } from '@/lib/consolidation/orchestrator';
import { truncateAddress, downloadJSON, downloadCSV } from '@/lib/utils';
import { Button } from './ui/button';

interface ResultsModalProps {
  results: ConsolidationResult[];
  onClose: () => void;
  onRetryFailed?: () => void;
}

export function ResultsModal({ results, onClose, onRetryFailed }: ResultsModalProps) {
  const successful = results.filter(r => r.success && !r.alreadyDonated && !r.skipped).length;
  const skipped = results.filter(r => r.alreadyDonated || r.skipped).length;
  const failed = results.filter(r => !r.success && !r.alreadyDonated && !r.skipped).length;
  const totalSolutions = results.reduce((sum, r) => sum + (r.solutionsConsolidated || 0), 0);
  const failedResults = results.filter(r => !r.success && !r.alreadyDonated && !r.skipped);

  const handleExportJSON = () => {
    downloadJSON(results, `consolidation-results-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleExportCSV = () => {
    const csvData = results.map(r => ({
      sourceAddress: r.sourceAddress,
      sourceIndex: r.sourceIndex,
      success: r.success || r.alreadyDonated,
      solutionsConsolidated: r.solutionsConsolidated || 0,
      error: r.error || '',
      alreadyDonated: r.alreadyDonated || false,
    }));
    downloadCSV(csvData, `consolidation-results-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Consolidation Results</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Total Addresses</p>
              <p className="text-3xl font-bold text-white">{results.length}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Successful</p>
              <p className="text-3xl font-bold text-green-400">{successful}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Skipped</p>
              <p className="text-3xl font-bold text-yellow-400">{skipped}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Failed</p>
              <p className="text-3xl font-bold text-red-400">{failed}</p>
            </div>
          </div>

          {/* Total Solutions */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">Total Solutions Consolidated</p>
                <p className="text-2xl font-bold text-purple-400">{totalSolutions.toLocaleString()}</p>
              </div>
              {totalSolutions > 0 && (
                <div className="text-4xl">🎉</div>
              )}
            </div>
          </div>

          {/* Failed Addresses */}
          {failedResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Failed Addresses</h3>
                {onRetryFailed && (
                  <Button variant="secondary" size="sm" onClick={onRetryFailed}>
                    Retry Failed ({failedResults.length})
                  </Button>
                )}
              </div>
              <div className="bg-gray-900 rounded-lg divide-y divide-gray-800 max-h-64 overflow-y-auto">
                {failedResults.map((result, i) => (
                  <div key={i} className="p-3 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-sm text-white">
                        {truncateAddress(result.sourceAddress, 12, 10)}
                      </span>
                      <span className="text-xs text-gray-500">#{result.sourceIndex}</span>
                    </div>
                    <p className="text-xs text-red-400">{result.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {failed === 0 && successful > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-lg font-semibold text-green-400">
                ✓ All addresses consolidated successfully!
              </p>
            </div>
          )}

          {/* All Skipped Message */}
          {failed === 0 && successful === 0 && skipped > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <p className="text-lg font-semibold text-yellow-400">
                ⚠ All addresses already donated to this destination
              </p>
              <p className="text-sm text-gray-400 mt-1">
                These addresses have already been consolidated. To consolidate to a different address, choose a new destination.
              </p>
            </div>
          )}

          {/* Export Options */}
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" size="sm" onClick={handleExportJSON}>
              Download JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportCSV}>
              Download CSV
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <Button variant="primary" size="lg" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
