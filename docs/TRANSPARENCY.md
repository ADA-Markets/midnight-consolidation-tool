# Midnight Consolidation Tool - Transparency Guide

## How It Works (Simple Explanation)

This tool helps you consolidate Midnight rewards with **maximum transparency**.

### What Makes This Tool Transparent?

**1. All Code is Visible**
- Every file is readable TypeScript/JavaScript
- No compiled binaries or hidden code
- You can audit everything before running

**2. Terminal Window Shows Everything**
- When you click "Consolidate", a terminal window opens
- You see the **exact API call** being made
- You see the **full response** from Midnight servers
- Nothing is hidden in browser dev tools

**3. No Middleman**
- Direct API calls: Your Computer → Midnight API
- No proxy server modifying data
- No third-party services

**4. Same Method as Python Script**
- Uses identical signing (CIP-8 standard)
- Same API endpoints
- Same message format
- Just adds a nice UI on top

---

## File-by-File Explanation

### UI Files (Browser)
- `src/pages/Home.tsx` - Homepage with wallet options
- `src/pages/Consolidate.tsx` - Main consolidation page
- `src/components/WalletConnect.tsx` - Wallet extension connection
- `src/components/WalletConsolidationFlow.tsx` - Consolidation flow for wallet users
- `src/components/WalletImport.tsx` - Seed phrase import

**What they do:** Collect your wallet info, let you select addresses, and prepare for consolidation.

**Network calls:** NONE during consolidation. Only wallet connection uses browser APIs.

### Backend Files (Node.js)
- `terminal-launcher.js` - Small HTTP server (port 3002) that launches terminal windows
- `consolidate-cli.js` - The consolidation script that runs in the terminal

**What they do:**
1. `terminal-launcher.js` - Receives request from browser UI, launches terminal
2. `consolidate-cli.js` - Makes the actual API call to Midnight, shows everything in terminal

**Network calls:** Only `consolidate-cli.js` calls Midnight API (and you see it happen!)

### Signing Files
- `src/lib/wallet/lucid-manager.ts` - Lucid for seed phrase signing
- `src/components/WalletConsolidationFlow.tsx` - MeshJS for wallet extension signing

**What they do:** Sign the message using Cardano standards (CIP-8).

**Message signed:** `"Assign accumulated Scavenger rights to: {destinationAddress}"`

---

## Data Flow (Step by Step)

### 1. Setup (Browser UI)
```
User → Import seed phrase OR connect wallet
     → Select addresses to consolidate
     → Choose destination address
     → Click "Sign & Consolidate"
```

**Data:** Stays in browser (localStorage) or wallet extension.

### 2. Signing (Browser/Wallet)
```
Browser → Signs message with private key (local signing)
        → Message: "Assign accumulated Scavenger rights to: {dest}"
        → Result: Signature (hex string)
```

**Network:** None. Signing happens locally.

### 3. Consolidation (Terminal Window)
```
Browser → Sends signature to terminal-launcher.js
Terminal Launcher → Spawns new CMD window
CMD Window → Runs consolidate-cli.js
consolidate-cli.js → POST https://scavenger.prod.gd.midnighttge.io/donate_to/...
                   → Shows full request URL
                   → Shows full response
                   → Saves result to JSON file
Browser → Polls for result file
        → Displays success/failure
```

**Network:** Only the POST to Midnight API (visible in terminal).

---

## What You See in the Terminal

```bash
================================================================================
           Midnight Reward Consolidation - Terminal View
================================================================================

Source Address:      addr1qxnhqm0w7nj5clf8udgtthxdtkv6k6q93avkg84h79kpt...
Destination Address: addr1qxh98c86f4qgy36cw50nwxrnptc6wmj53v3psmgtc53wn...
Signature:           845846a201276761646472657373583901a7706deef4e54c7d27e350b5...

This terminal shows EXACTLY what is sent to the Midnight API.
All network calls are visible below.

================================================================================

Making consolidation request...

→ POST https://scavenger.prod.gd.midnighttge.io/donate_to/addr1qxh98c86.../addr1qxnhqm0w.../845846a201...

← Response Status: 200
← Response Body:
{
  "solutions_consolidated": 15,
  "message": "Rewards consolidated successfully"
}

================================================================================
✓ SUCCESS - Consolidation Complete!
================================================================================

Solutions Consolidated: 15
Message: Rewards consolidated successfully

Press any key to close this window...
```

**Everything is visible:**
- ✅ Exact URL called
- ✅ HTTP method (POST)
- ✅ Response status code (200)
- ✅ Full response body
- ✅ No hidden data

---

## Comparison with Other Tools

| Tool | Transparency | UX |
|------|-------------|-----|
| **Python Script** | ✅ High - shows all API calls in terminal | ❌ CLI only, technical users |
| **Our Tool** | ✅✅ **Highest** - terminal + readable code | ✅✅ **Best** - GUI + terminal visibility |
| **Browser-Only Tools** | ⚠️ Medium - hidden in dev tools | ✅ Good UI |

---

## Security Checklist

Before using this tool, you can verify:

- [ ] Read `consolidate-cli.js` - confirms API calls
- [ ] Read `terminal-launcher.js` - confirms no data modification
- [ ] Read `WalletConsolidationFlow.tsx` - confirms signing process
- [ ] Check terminal output - see actual API calls
- [ ] Verify signature format - matches Cardano CIP-8 standard
- [ ] Confirm message format - `"Assign accumulated Scavenger rights to: {dest}"`

---

## Questions?

**Q: Why do I need Node.js?**
A: To run the terminal script that shows API calls transparently.

**Q: Could the terminal script lie?**
A: No - you can read `consolidate-cli.js` (only 200 lines). It only makes one HTTPS request and prints exactly what it sends/receives.

**Q: Is this safer than the Python script?**
A: **Same safety** - both use identical API calls and signing. Ours just adds a nice UI.

**Q: What data is sent to external servers?**
A: Only the signed consolidation request to Midnight API (visible in terminal).

**Q: Where is my seed phrase stored?**
A: Encrypted in browser localStorage with your password. Never leaves your machine.

---

## Trust but Verify

This tool is designed to be **fully auditable**. Don't trust us - verify for yourself:

1. Read the code (all files are open source)
2. Watch the terminal output when consolidating
3. Compare our code with the Python script (same logic)
4. Check that we use standard Cardano libraries (Lucid, MeshJS)

**Your security is your responsibility.** We provide transparency - you verify before using.
