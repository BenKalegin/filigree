/**
 * Minimal XML/HTML entity escape for SVG attribute values and text content.
 *
 * Only the five required XML entities. We deliberately don't escape Unicode
 * characters or non-ASCII — SVG is UTF-8 and renderers handle them.
 */

const ESCAPES: ReadonlyMap<string, string> = new Map<string, string>([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
  ["'", '&apos;'],
]);

export const escapeXml = (raw: string): string =>
  raw.replaceAll(/[&<>"']/gu, (ch) => ESCAPES.get(ch) ?? ch);
