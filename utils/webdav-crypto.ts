import { readBackup, toBackup, type SyncData } from './backup';

const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

interface EncryptedSyncFile {
  anubis: 2;
  encryption: {
    algorithm: 'AES-GCM';
    kdf: 'PBKDF2-SHA-256';
    iterations: number;
    salt: string;
    iv: string;
    ciphertext: string;
  };
}

export class EncryptedFileError extends Error {
  constructor(readonly reason: 'encrypted' | 'passphrase' | 'file') {
    super(reason);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function encode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decode(value: unknown, expectedLength?: number): Uint8Array {
  if (typeof value !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new EncryptedFileError('file');
  }
  const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  if (expectedLength !== undefined && bytes.length !== expectedLength) throw new EncryptedFileError('file');
  return bytes;
}

async function keyFor(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt), iterations: ITERATIONS }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function encryptedFile(value: unknown): value is EncryptedSyncFile {
  if (!isRecord(value) || value.anubis !== 2 || !isRecord(value.encryption)) return false;
  const encryption = value.encryption;
  return encryption.algorithm === 'AES-GCM' && encryption.kdf === 'PBKDF2-SHA-256' && encryption.iterations === ITERATIONS;
}

export function isEncryptedSyncFile(text: string): boolean {
  try {
    const value: unknown = JSON.parse(text);
    return isRecord(value) && value.anubis === 2;
  } catch {
    return false;
  }
}

export async function encryptSyncData(data: SyncData, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await keyFor(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(toBackup(data)));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const file: EncryptedSyncFile = {
    anubis: 2,
    encryption: {
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2-SHA-256',
      iterations: ITERATIONS,
      salt: encode(salt),
      iv: encode(iv),
      ciphertext: encode(new Uint8Array(ciphertext)),
    },
  };
  return JSON.stringify(file, null, 2);
}

export async function decryptSyncData(text: string, passphrase?: string): Promise<SyncData> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new EncryptedFileError('file');
  }
  if (!isRecord(value) || value.anubis !== 2) return readBackup(text);
  if (!passphrase) throw new EncryptedFileError('encrypted');
  if (!encryptedFile(value)) throw new EncryptedFileError('file');
  const { salt, iv, ciphertext } = value.encryption;
  const key = await keyFor(passphrase, decode(salt, SALT_BYTES));
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(decode(iv, IV_BYTES)) }, key, new Uint8Array(decode(ciphertext)));
    return readBackup(new TextDecoder().decode(plaintext));
  } catch (error) {
    if (error instanceof EncryptedFileError) throw error;
    throw new EncryptedFileError('passphrase');
  }
}
