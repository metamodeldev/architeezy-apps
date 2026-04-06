/**
 * Helper utilities.
 *
 * @module utils
 * @package
 */

/**
 * Escapes `s` for safe insertion into HTML attribute values and text content.
 *
 * @param {unknown} s - Value to escape; non-strings are coerced via String().
 * @returns {string} HTML-escaped string.
 */
export function escHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Regular expression to match UUID or UUID-like identifiers. Matches: - Standard UUIDs:
 * a1b2c3d4-0000-0000-0000-000000000001 - Short hex ids: abc123def (8+ hex characters) - UUIDs with
 * dashes: 12345678-1234-1234-1234-123456789012
 */
const UUID_RE = /^[0-9a-f]{8,}(-[0-9a-f]+)*$/i;

/**
 * Returns true if `v` is a string that looks like a UUID or UUID-like identifier.
 *
 * @param {unknown} v - The value to test.
 * @returns {boolean} True if the value is a UUID-like string.
 */
export function isUUID(v) {
  return typeof v === 'string' && UUID_RE.test(v);
}
