# Midnight Consolidation Tool

> ⚠️ **Still under testing - Feedback welcome!** Please report any issues on GitHub.

A simple tool to consolidate your Midnight Scavenger Hunt rewards from multiple addresses into one.

**APPLICATION BY:** [PAUL](https://x.com/cwpaulm) & [PADDY](https://x.com/PoolShamrock)

## 🚀 Quick Start (3 Simple Steps)

1. **Download** the code from GitHub
2. **Double-click** `setup.cmd` on Windows **or** run `./setup.sh` on macOS/Linux (first time takes a minute to install)
3. **Browser opens** automatically at http://localhost:3000


### ⚠️ Before You Start

**IMPORTANT:** Make sure your destination address is registered with the [Midnight Scavenger Hunt](https://scavenger.prod.gd.midnighttge.io/) before consolidating rewards. Unregistered addresses cannot receive consolidated rewards.

### For Developers

If you want to modify the code:
1. Run `setup.cmd` on Windows (or `./setup.sh` on macOS/Linux)
2. Browser opens at http://localhost:3000 with live reload
3. Edit code and see changes instantly

## 📋 Scripts Available

### `setup.cmd` / `setup.sh` - Main Entry Point
- Installs dependencies if needed
- Starts terminal launcher (port 3002)
- Starts Vite dev server (port 3000)
- Opens browser automatically
- **Use this to start the application**

### `build-and-serve.cmd` - Production Build
- Builds optimized static files to `dist/` folder
- Starts terminal launcher + static file server
- **All source files are auditable before building**

### `serve-only.cmd` - Quick Launch (After Building)
- Serves pre-built files from `dist/`
- Faster startup (no rebuild needed)

## 🎯 Key Features

- **Import 24-word seed phrase** - Derive up to 200 addresses
- **Connect browser wallet** - Use Nami, Eternl, Lace, or other Cardano wallets
- **Batch consolidation** - Consolidate rewards from multiple addresses
- **Local storage** - All data stored in browser (localStorage)
- **Full audit trail** - Track all consolidations
- **100% local** - No data leaves your machine

## 🛡️ How Terminal Consolidation Works

**Maximum Transparency - See Every API Call!**

Unlike browser-based tools that hide network requests, this tool shows you **exactly** what's happening:

**The solution:**
1. **Browser UI** - Set up your wallet, select addresses, review details
2. **Click "Consolidate"** - A new terminal window opens
3. **Terminal shows everything** - Raw API calls, responses, status codes
4. **No hidden requests** - Every byte sent/received is visible
5. **Direct API calls** - No proxy, no middleman, just Node.js → Midnight API

**Example Terminal Output:**
```
================================================================================
           Midnight Reward Consolidation - Terminal View
================================================================================

Source Address:      addr1qx...mt7fjr
Destination Address: addr1qx...893a95

→ POST https://scavenger.prod.gd.midnighttge.io/donate_to/...

← Response Status: 200
← Response Body:
{
  "solutions_consolidated": 15,
  "message": "Rewards consolidated successfully"
}

✓ SUCCESS - Consolidation Complete!
================================================================================
```

**Why this is MORE transparent:**
- ✅ You see the **exact URL** being called
- ✅ You see the **full response** from Midnight API
- ✅ No proxy server to audit
- ✅ Terminal can't hide anything - it's all text output
- ✅ Same as running `curl` manually, but automated

## 🔐 Security & Transparency

### Why This Approach is Most Transparent:

1. **All source code visible** - Every `.tsx`, `.ts` file is readable before you build
2. **Build process is open** - You run `npm run build` yourself and watch it happen
3. **No black box** - Unlike Electron apps, nothing is hidden in executables
4. **Auditable** - Security researchers can review every line of code
5. **Reproducible builds** - Build it yourself, verify the output

### Security Features:

- ✅ Runs on `localhost` only (no hosted server)
- ✅ Seed phrases encrypted with AES-256
- ✅ All signing happens locally
- ✅ No telemetry or tracking
- ✅ Open source (MIT License)
- ✅ No data sent to external servers

## 🛠 Tech Stack

- **Vite** - Modern build tool (replaced Next.js for simplicity)
- **React** - UI framework
- **TypeScript** - Type safety
- **Lucid-Cardano** - Wallet derivation and signing
- **MeshJS** - Browser wallet integration
- **Tailwind CSS** - Styling
- **localStorage** - Browser-based data persistence

## 📁 Project Structure

```
midnight-consolidation-tool/
├── src/
│   ├── components/        # React components
│   ├── lib/              # Core libraries (Lucid, encryption, etc.)
│   ├── services/         # Service layer (wallet, consolidation)
│   ├── pages/            # Page components
│   ├── App.tsx           # Root component with routing
│   └── main.tsx          # Entry point
├── dist/                 # Built files (after running build)
├── setup.cmd            # Development mode launcher
├── build-and-serve.cmd  # Production build & serve
├── serve-only.cmd       # Serve pre-built files
└── vite.config.ts       # Vite configuration
```

## 🧑‍💻 Development

### Prerequisites

- Node.js 20.x or later
- npm (comes with Node.js)

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Opens at http://localhost:3000 with hot-reloading.

### Production Build

```bash
npm run build
```

Creates optimized static files in `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally.

## 📖 How to Use

### Option 1: Import Your Seed Phrase

1. Click "Import Seed Phrase"
2. Enter your 24-word seed phrase
3. Set a password to encrypt it
4. Choose how many addresses to check (20-200)
5. Select which addresses to consolidate
6. Enter your registered destination address
7. Click "Start Consolidation"

### Option 2: Connect Your Wallet

1. Click "Connect Wallet"
2. Choose your wallet (Nami, Eternl, Lace, etc.)
3. Approve the connection
4. Enter your registered destination address
5. Sign the message in your wallet
6. Done!

**Remember:** Your destination address MUST be registered with the Midnight Scavenger Hunt!

## ⚠️ Important Disclaimers

**READ CAREFULLY BEFORE USING:**

### Use at Your Own Risk

This tool is provided **AS-IS** with **ABSOLUTELY NO WARRANTY OR GUARANTEE** of any kind. By using this tool, you acknowledge and accept:

- ✋ **You are solely responsible** for reviewing and verifying the source code yourself
- ✋ **You must be comfortable** with what the code does before running it
- ✋ **Everything runs on your local machine** - You control the environment
- ✋ **No support is guaranteed** - This is community-built software
- ✋ **Consolidation is irreversible** - Once sent, rewards cannot be un-consolidated
- ✋ **You are responsible for**:
  - Securing your seed phrase and passwords
  - Verifying destination addresses are correct and registered
  - Testing with small amounts first (if possible)
  - Maintaining your own records and backups
  - Understanding what the code does before executing it

### Your Responsibility

**Before using this tool:**
1. Read through the source code if you have concerns
2. Test in a safe environment if possible
3. Verify your destination address is registered with the Midnight Scavenger Hunt
4. Double-check all addresses before proceeding
5. Understand that the authors provide this tool as-is with no liability

**By using this tool, you agree that you:**
- Have reviewed the code to your satisfaction
- Accept all risks associated with consolidating rewards
- Will not hold the authors responsible for any issues, losses, or errors
- Understand this is experimental software

**If you are not comfortable with these terms, do not use this tool.**

## 📜 License

MIT License - See LICENSE file for details

## 🙋 Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/midnight-consolidation-tool/issues)
- Documentation: Read this README and inline code comments

## 🎓 How It Works

### Seed Phrase Method:
1. Your 24-word seed phrase is encrypted with AES-256 using your password
2. Encrypted seed is stored in browser localStorage
3. Addresses are derived using Lucid-Cardano (BIP32/BIP44)
4. Each consolidation signs a message with the source address private key
5. Signed message is sent to Midnight API to trigger consolidation

### Wallet Connection Method:
1. Browser wallet extension is connected via MeshJS
2. You provide source addresses manually
3. Wallet signs consolidation messages
4. Signed messages sent to Midnight API

### Data Storage:
- **Wallet data**: Stored in browser localStorage
- **Consolidation history**: Stored in browser localStorage
- **No server-side storage**: Everything is local to your machine

## 🔄 Updating

To update to a new version:
1. Download new source code
2. Run `build-and-serve.cmd` again
3. Your wallet data and history persist (stored in browser)

Or for developers:
```bash
git pull
npm install
npm run build
```

## 🧹 Clearing Data

To clear all wallet and consolidation data:
1. Open browser Developer Tools (F12)
2. Go to Application > Storage > Local Storage
3. Delete entries starting with `midnight_`

Or use the "Clear Wallet" button in the app (preserves consolidation history).

---

**Ready to consolidate your Midnight rewards securely? Run `build-and-serve.cmd` to get started!** 🚀
