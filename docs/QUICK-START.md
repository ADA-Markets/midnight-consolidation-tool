# Quick Start Guide

## 🚀 Running the Tool (Simple!)

### Step 1: Install Node.js (One-Time Setup)
Download and install from: https://nodejs.org/

### Step 2: Run Setup
Double-click: **`setup.cmd`**

That's it! The tool will:
1. Install dependencies (first time only)
2. Start the application
3. Open your browser

---

## 📂 Files You Need to Know About

### Main Files
- **`setup.cmd`** - Double-click this to start the app
- **`consolidate-cli.js`** - The terminal script (shows API calls)
- **`terminal-launcher.js`** - Launches terminal windows
- **`TRANSPARENCY.md`** - Read this for full transparency details

### You Can Safely Ignore
- `node_modules/` - Dependencies (auto-installed)
- `dist/` - Built files (auto-generated)
- `src/` - Source code (read if you want to audit)

---

## 🎯 How to Use

### Option 1: Import Seed Phrase
1. Click "Import Seed Phrase"
2. Enter your 24-word seed phrase
3. Create a password
4. Select addresses to consolidate
5. Choose destination
6. **A terminal window opens** showing the API call
7. Done!

### Option 2: Connect Wallet
1. Click "Connect Wallet"
2. Choose your wallet (Eternl, Nami, Lace, etc.)
3. Enter source address
4. Enter destination address
5. Sign the message in your wallet
6. **A terminal window opens** showing the API call
7. Done!

---

## 🪟 What the Terminal Window Shows

When you consolidate, a **new terminal window** opens showing:

```
Source Address:      addr1qx...
Destination Address: addr1qx...

→ POST https://scavenger.prod.gd.midnighttge.io/donate_to/...

← Response Status: 200
← Response Body:
{
  "solutions_consolidated": 15,
  "message": "Rewards consolidated successfully"
}

✓ SUCCESS!
```

**This is 100% transparent** - you see exactly what's sent to Midnight servers!

---

## ⚠️ Important Notes

1. **Keep 2 windows open:**
   - Main terminal (shows "Vite dev server")
   - Terminal Launcher (minimized window)

2. **Don't close terminals early:**
   - Wait for consolidation to complete
   - Terminal shows "Press any key to close"

3. **Your data stays local:**
   - Seed phrases encrypted in browser
   - Never sent to any server
   - Only consolidation request goes to Midnight API (you see it in terminal!)

---

## 🔒 Security

**Want to audit the code?**
1. Read `consolidate-cli.js` - 200 lines showing API calls
2. Read `terminal-launcher.js` - 130 lines launching terminals
3. Read `TRANSPARENCY.md` - Full security explanation

**Still not sure?**
- Compare with Python script (same API calls)
- Watch terminal output (every request is visible)
- All source code is readable TypeScript/JavaScript

---

## ❓ Troubleshooting

**Problem: Port 3000 or 3002 already in use**
- Close other apps using these ports
- Or restart your computer

**Problem: Terminal launcher won't start**
- Check Node.js is installed: `node --version`
- Make sure port 3002 is free

**Problem: Browser shows "Connection refused"**
- Wait a few seconds for servers to start
- Refresh the page (F5)

---

## 📞 Need Help?

Check `README.md` for detailed documentation or `TRANSPARENCY.md` for security details.
