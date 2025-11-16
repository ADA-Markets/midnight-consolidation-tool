export interface EncryptedData {
  iv: string;
  salt: string;
  ciphertext: string;
}

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;

/**
 * Derive a key from passphrase using PBKDF2 (Web Crypto API)
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with passphrase using AES-256-GCM
 */
export async function encrypt(plaintext: string, passphrase: string): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    iv: Array.from(new Uint8Array(iv))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    salt: Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
    ciphertext: Array.from(new Uint8Array(ciphertextBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  };
}

/**
 * Decrypt ciphertext with passphrase using AES-256-GCM
 */
export async function decrypt(encrypted: EncryptedData, passphrase: string): Promise<string> {
  const salt = new Uint8Array(
    encrypted.salt.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const iv = new Uint8Array(
    encrypted.iv.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const ciphertext = new Uint8Array(
    encrypted.ciphertext.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const key = await deriveKey(passphrase, salt);

  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}
