
import { ConsolidationProgress } from '@/lib/consolidation/orchestrator';
import { truncateAddress } from '@/lib/utils';
import { Button } from './ui/button';

interface ProgressModalProps {
  progress: ConsolidationProgress;
  onStop: () => void;
}

export function ProgressModal({ progress, onStop }: ProgressModalProps) {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">
            {progress.status === 'signing' ? 'Signing Messages...' : 'Consolidating Addresses...'}
          </h2>
          <p className="text-gray-400 mt-1">
            {progress.status === 'signing'
              ? 'Preparing signatures for all addresses'
              : 'Sending rewards to destination address'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-white font-semibold">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">{percentage.toFixed(1)}%</p>
        </div>

        {/* Stats */}
        {progress.status === 'consolidating' && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Successful</p>
              <p className="text-2xl font-bold text-green-400">{progress.successful}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-red-400">{progress.failed}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Remaining</p>
              <p className="text-2xl font-bold text-blue-400">{progress.total - progress.current}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Solutions</p>
              <p className="text-2xl font-bold text-purple-400">{progress.totalSolutionsConsolidated}</p>
            </div>
          </div>
        )}

        {/* Current Address */}
        {progress.currentAddress && progress.status === 'consolidating' && (
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Current Address</p>
            <p className="text-sm font-mono text-white">{truncateAddress(progress.currentAddress, 15, 15)}</p>
          </div>
        )}

        {/* Live Logs */}
        {progress.logs.length > 0 && progress.status === 'consolidating' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Consolidation Log</p>
            <div className="bg-gray-900 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
              {progress.logs.map((log, i) => (
                <div key={i} className="text-gray-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stop Button */}
        {progress.status !== 'completed' && progress.status !== 'stopped' && (
          <div className="flex justify-center pt-2">
            <Button variant="danger" size="lg" onClick={onStop}>
              Stop Consolidation
            </Button>
          </div>
        )}

        {/* Completion Message */}
        {(progress.status === 'completed' || progress.status === 'stopped') && (
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {progress.status === 'completed' ? '✓ Consolidation Complete!' : '⚠ Consolidation Stopped'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
