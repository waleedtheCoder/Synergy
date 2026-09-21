import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

export function generateRawToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const AES_ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a value at rest (e.g. a TOTP secret) using AES-256-GCM.
 * `key` must be a 32-byte value — pass it hex-encoded (64 hex chars).
 * Output packs iv + authTag + ciphertext into one hex string so a single
 * DB column can store it.
 */
export function encryptField(plainText: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv(AES_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('hex');
}

export function decryptField(encryptedHex: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const data = Buffer.from(encryptedHex, 'hex');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = createDecipheriv(AES_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}
