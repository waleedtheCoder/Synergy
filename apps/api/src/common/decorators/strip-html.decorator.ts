import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Defense-in-depth for free-text fields that get rendered back to other
 * users (chat messages, feed comments, profile bios, portfolio text).
 * React already escapes these on output, so this isn't closing an active
 * XSS hole — it's a second layer in case a future feature renders raw HTML,
 * or a non-React API consumer displays this data unescaped.
 *
 * Strips every tag rather than allow-listing a "safe" subset: these fields
 * are plain text, not a rich-text editor, so there's no legitimate markup
 * to preserve.
 */
export function StripHtml(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim()
      : value,
  );
}
