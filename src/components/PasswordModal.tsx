
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface PasswordModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export function PasswordModal({ isOpen, title, message, onConfirm, onCancel }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    onConfirm(password);
    setPassword('');
    setError('');
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400">{message}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your wallet password"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
