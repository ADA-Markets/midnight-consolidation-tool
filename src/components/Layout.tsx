import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isQuitting, setIsQuitting] = useState(false);
  const location = useLocation();

  const handleQuit = async () => {
    if (!confirm('Are you sure you want to quit? This will close all terminal windows and stop the application.')) {
      return;
    }

    setIsQuitting(true);

    try {
      // Call terminal launcher shutdown endpoint
      await fetch('http://localhost:3002/shutdown', {
        method: 'POST',
      });

      // Show goodbye message
      setTimeout(() => {
        alert('Application shutdown complete. You can now close this browser tab.');
      }, 1000);
    } catch (error) {
      console.error('Shutdown error:', error);
      alert('Application has been stopped. You can now close this browser tab.');
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Midnight Consolidation Tool By Paul & Paddy
            </h1>
          </Link>

          {!isHomePage && (
            <Link
              to="/"
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              ← Home
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>Open source • No telemetry • Runs locally</span>
              <a href="#" className="hover:text-purple-400 transition-colors">GitHub</a>
            </div>

            {/* Quit Button */}
            <button
              onClick={handleQuit}
              disabled={isQuitting}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            >
              {isQuitting ? 'Shutting down...' : 'Quit Application'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
