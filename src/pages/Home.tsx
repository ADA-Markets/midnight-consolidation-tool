import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-3xl w-full space-y-10">
      {/* Subtitle */}
      <div className="text-center space-y-2">
        <p className="text-lg text-gray-300">
          Consolidate mining rewards from multiple addresses safely
        </p>
      </div>

        {/* Wallet Options - Two Clean Columns */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Import Seed Phrase Column */}
          <div className="bg-gray-800 border-2 border-purple-500/50 rounded-lg p-8 hover:border-purple-500 transition-colors h-full flex flex-col">
            <div className="flex-1 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-white">Import Seed Phrase</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Derive up to 200 addresses from your 24-word seed phrase
                </p>
              </div>
            </div>
            <Link
              to="/consolidate?mode=seed"
              className="mt-6 w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-center"
            >
              Get Started
            </Link>
          </div>

          {/* Connect Wallet Column */}
          <div className="bg-gray-800 border-2 border-blue-500/50 rounded-lg p-8 hover:border-blue-500 transition-colors h-full flex flex-col">
            <div className="flex-1 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-white">Connect Wallet</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Use Nami, Eternl, Lace, or other browser wallets
                </p>
              </div>
            </div>
            <Link
              to="/consolidate?mode=wallet"
              className="mt-6 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-center"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Disclaimer - Full Width Below */}
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-400 mb-3">⚠️ Important Disclaimer</h2>
          <div className="text-sm text-gray-300 space-y-2">
            <p>This tool is provided AS-IS with NO warranty or guarantee.</p>
            <p className="font-semibold">YOU ARE SOLELY RESPONSIBLE FOR:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-400">
              <li>Securing your seed phrase</li>
              <li>Verifying all transactions independently</li>
              <li>Maintaining your own records</li>
            </ul>
            <p className="font-semibold text-yellow-400 mt-3">
              Always double-check addresses before proceeding.
            </p>
          </div>
        </div>

    </div>
  );
}
