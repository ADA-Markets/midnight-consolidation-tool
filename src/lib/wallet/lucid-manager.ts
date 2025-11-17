import { Lucid, toHex } from 'lucid-cardano';
import { encrypt, decrypt, EncryptedData } from './encryption';

// Storage keys for localStorage
const SEED_STORAGE_KEY = 'midnight-wallet-seed-encrypted';
const ADDRESSES_STORAGE_KEY = 'midnight-wallet-addresses';

export interface DerivedAddress {
  index: number;
  bech32: string;
  publicKeyHex: string;
}

export interface WalletInfo {
  seedPhrase: string;
  addresses: DerivedAddress[];
}

export class LucidWalletManager {
  private mnemonic: string | null = null;
  private derivedAddresses: DerivedAddress[] = [];

  /**
   * Generate a new wallet with 24-word seed phrase
   */
  async generateWallet(password: string, count: number = 20): Promise<WalletInfo> {
    // Generate 24-word mnemonic using Lucid
    const tempLucid = await Lucid.new(undefined, 'Mainnet');
    this.mnemonic = tempLucid.utils.generateSeedPhrase();
    const words = this.mnemonic.split(' ');

    if (words.length !== 24) {
      throw new Error('Failed to generate 24-word mnemonic');
    }

    // Derive addresses
    await this.deriveAddresses(count);

    // Encrypt and save seed to localStorage
    const encryptedData = await encrypt(this.mnemonic, password);
    localStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(encryptedData));

    // Save derived addresses to localStorage
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(this.derivedAddresses));

    return {
      seedPhrase: this.mnemonic,
      addresses: this.derivedAddresses,
    };
  }

  /**
   * Import existing wallet from seed phrase
   */
  async importWallet(seedPhrase: string, password: string, count: number = 20): Promise<WalletInfo> {
    // Validate mnemonic
    const words = seedPhrase.trim().split(/\s+/);
    const validLengths = [12, 15, 18, 21, 24];
    if (!validLengths.includes(words.length)) {
      throw new Error('Seed phrase must be 12, 15, 18, 21, or 24 words');
    }

    this.mnemonic = seedPhrase.trim();

    // Derive addresses
    await this.deriveAddresses(count);

    // Encrypt and save seed to localStorage
    const encryptedData = await encrypt(this.mnemonic, password);
    localStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(encryptedData));

    // Save derived addresses to localStorage
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(this.derivedAddresses));

    return {
      seedPhrase: this.mnemonic,
      addresses: this.derivedAddresses,
    };
  }

  /**
   * Load existing wallet from localStorage
   */
  async loadWallet(password: string): Promise<DerivedAddress[]> {
    const storedSeed = localStorage.getItem(SEED_STORAGE_KEY);
    if (!storedSeed) {
      throw new Error('No wallet found. Please import a seed phrase first.');
    }

    const encryptedData: EncryptedData = JSON.parse(storedSeed);

    try {
      this.mnemonic = await decrypt(encryptedData, password);
    } catch (err) {
      throw new Error('Failed to decrypt wallet. Incorrect password?');
    }

    // Load derived addresses
    const storedAddresses = localStorage.getItem(ADDRESSES_STORAGE_KEY);
    if (!storedAddresses) {
      throw new Error('Derived addresses not found. Wallet may be corrupted.');
    }

    this.derivedAddresses = JSON.parse(storedAddresses);
    return this.derivedAddresses;
  }

  /**
   * Check if wallet exists
   */
  walletExists(): boolean {
    return localStorage.getItem(SEED_STORAGE_KEY) !== null;
  }

  /**
   * Clear/forget wallet - removes all saved wallet data
   */
  clearWallet(): void {
    try {
      // Remove encrypted seed from localStorage
      localStorage.removeItem(SEED_STORAGE_KEY);
      console.log('[Wallet] Removed encrypted seed from localStorage');

      // Remove derived addresses from localStorage
      localStorage.removeItem(ADDRESSES_STORAGE_KEY);
      console.log('[Wallet] Removed derived addresses from localStorage');

      // Clear in-memory data
      this.mnemonic = null;
      this.derivedAddresses = [];

      console.log('[Wallet] Wallet data cleared successfully');
    } catch (error: any) {
      console.error('[Wallet] Error clearing wallet:', error.message);
      throw new Error(`Failed to clear wallet: ${error.message}`);
    }
  }

  /**
   * Derive addresses from mnemonic
   */
  private async deriveAddresses(count: number): Promise<void> {
    if (!this.mnemonic) {
      throw new Error('Mnemonic not loaded');
    }

    this.derivedAddresses = [];

    for (let i = 0; i < count; i++) {
      try {
        const { address, pubKeyHex } = await this.deriveAddressAtIndex(i);

        this.derivedAddresses.push({
          index: i,
          bech32: address,
          publicKeyHex: pubKeyHex,
        });
      } catch (err: any) {
        console.error(`Failed to derive address at index ${i}:`, err.message);
        throw err;
      }
    }
  }

  /**
   * Derive a single address at specific index
   */
  private async deriveAddressAtIndex(index: number): Promise<{ address: string; pubKeyHex: string }> {
    if (!this.mnemonic) {
      throw new Error('Mnemonic not loaded');
    }

    const lucid = await Lucid.new(undefined, 'Mainnet');
    lucid.selectWalletFromSeed(this.mnemonic, {
      accountIndex: index,
    });

    const address = await lucid.wallet.address();

    // Get public key by signing a test message
    const testPayload = toHex(Buffer.from('test', 'utf8'));
    const signedMessage = await lucid.wallet.signMessage(address, testPayload);

    // Extract 32-byte public key from COSE_Key structure
    const coseKey = signedMessage.key;
    const pubKeyHex = coseKey.slice(-64);

    if (!pubKeyHex || pubKeyHex.length !== 64) {
      throw new Error(`Failed to extract valid public key for index ${index}`);
    }

    return { address, pubKeyHex };
  }

  /**
   * Sign a message with specific address
   */
  async signMessage(addressIndex: number, message: string): Promise<string> {
    if (!this.mnemonic) {
      throw new Error('Mnemonic not loaded');
    }

    const addr = this.derivedAddresses.find(a => a.index === addressIndex);
    if (!addr) {
      throw new Error(`Address not found for index ${addressIndex}`);
    }

    const lucid = await Lucid.new(undefined, 'Mainnet');
    lucid.selectWalletFromSeed(this.mnemonic, {
      accountIndex: addressIndex,
    });

    const payload = toHex(Buffer.from(message, 'utf8'));
    const signedMessage = await lucid.wallet.signMessage(addr.bech32, payload);

    return signedMessage.signature;
  }

  /**
   * Get all derived addresses
   */
  getDerivedAddresses(): DerivedAddress[] {
    return this.derivedAddresses;
  }

  /**
   * Get public key for specific address index
   */
  getPubKeyHex(index: number): string {
    const addr = this.derivedAddresses.find(a => a.index === index);
    if (!addr) {
      throw new Error(`Address not found for index ${index}`);
    }
    return addr.publicKeyHex;
  }

  /**
   * Create donation signature for consolidating rewards
   * Signs the message: "Assign accumulated Scavenger rights to: {destinationAddress}"
   */
  async makeDonationSignature(addressIndex: number, sourceAddress: string, destinationAddress: string): Promise<string> {
    if (!this.mnemonic) {
      throw new Error('Mnemonic not loaded');
    }

    const addr = this.derivedAddresses.find(a => a.index === addressIndex);
    if (!addr) {
      throw new Error(`Address not found for index ${addressIndex}`);
    }

    if (addr.bech32 !== sourceAddress) {
      throw new Error(`Address mismatch: expected ${addr.bech32}, got ${sourceAddress}`);
    }

    const lucid = await Lucid.new(undefined, 'Mainnet');
    lucid.selectWalletFromSeed(this.mnemonic, {
      accountIndex: addressIndex,
    });

    const message = `Assign accumulated Scavenger rights to: ${destinationAddress}`;
    const payload = toHex(Buffer.from(message, 'utf8'));
    const signedMessage = await lucid.wallet.signMessage(sourceAddress, payload);

    return signedMessage.signature;
  }

  /**
   * Sign messages for multiple addresses (batch signing)
   */
  async batchSignDonations(
    addressIndices: number[],
    destinationAddress: string
  ): Promise<Map<number, string>> {
    const signatures = new Map<number, string>();

    for (const index of addressIndices) {
      const addr = this.derivedAddresses.find(a => a.index === index);
      if (!addr) {
        throw new Error(`Address not found for index ${index}`);
      }

      const signature = await this.makeDonationSignature(index, addr.bech32, destinationAddress);
      signatures.set(index, signature);
    }

    return signatures;
  }

  /**
   * Derive additional addresses from existing wallet
   */
  async deriveAdditionalAddresses(startIndex: number, count: number): Promise<DerivedAddress[]> {
    if (!this.mnemonic) {
      throw new Error('Mnemonic not loaded. Please load wallet first.');
    }

    const newAddresses: DerivedAddress[] = [];

    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      try {
        const { address, pubKeyHex } = await this.deriveAddressAtIndex(index);

        const newAddr: DerivedAddress = {
          index,
          bech32: address,
          publicKeyHex: pubKeyHex,
        };

        newAddresses.push(newAddr);
        this.derivedAddresses.push(newAddr);
      } catch (err: any) {
        console.error(`Failed to derive address at index ${index}:`, err.message);
        throw err;
      }
    }

    // Save updated derived addresses to localStorage
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(this.derivedAddresses));

    return newAddresses;
  }
}
