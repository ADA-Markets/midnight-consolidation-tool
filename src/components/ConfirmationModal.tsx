
import { Button } from './ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
}

export function ConfirmationModal({ isOpen, title, message, details, onClose }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6 space-y-4">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-gray-400 mt-2">{message}</p>
          {details && (
            <p className="text-sm text-gray-500 mt-2">{details}</p>
          )}
        </div>

        <Button variant="primary" onClick={onClose} className="w-full">
          OK
        </Button>
      </div>
    </div>
  );
}
