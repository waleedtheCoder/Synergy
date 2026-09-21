/**
 * Detects a file's real type from its magic bytes, independent of whatever
 * MIME type/extension the client claimed. Prevents a malicious file renamed
 * with an allowed extension from passing validation based on declared type
 * alone.
 */
export type DetectedFileType =
  'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf';

function matches(buffer: Buffer, offset: number, signature: number[]): boolean {
  if (buffer.length < offset + signature.length) return false;
  return signature.every((byte, i) => buffer[offset + i] === byte);
}

export function detectFileType(buffer: Buffer): DetectedFileType | null {
  if (matches(buffer, 0, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }
  if (matches(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (
    matches(buffer, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    matches(buffer, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return 'image/gif';
  }
  if (
    matches(buffer, 0, [0x52, 0x49, 0x46, 0x46]) &&
    matches(buffer, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return 'image/webp';
  }
  if (matches(buffer, 0, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return 'application/pdf';
  }
  return null;
}
