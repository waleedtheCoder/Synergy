import { randomBytes } from 'crypto';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function uniqueSlug(base: string): string {
  const suffix = randomBytes(3).toString('hex');
  const slugBase = slugify(base) || 'professional';
  return `${slugBase}-${suffix}`;
}
