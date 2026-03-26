// ── HELPERS ────────────────────────────────────────────────────────────────

import { BASE, PALETTE, UUID_RE } from './constants.js';

/**
 * Returns true if `v` is a string that looks like a UUID or UUID-like identifier.
 *
 * @param {unknown} v - The value to test.
 * @returns {boolean} True if the value is a UUID-like string.
 */
export function isUUID(v) {
  return typeof v === 'string' && UUID_RE.test(v);
}

/**
 * Fast deterministic string hash (djb2 variant).
 *
 * @param {string} s - The string to hash.
 * @returns {number} Unsigned 32-bit integer.
 */
export function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    // oxlint-disable-next-line no-bitwise
    h = Math.trunc((h * 33) ^ s.codePointAt(i));
  }
  return Math.abs(h); // Unsigned — prevents negative palette indices
}

/**
 * Maps an element type name to a palette color deterministically.
 *
 * @param {string} typ - Element type name.
 * @returns {string} CSS color string.
 */
export function elemColor(typ) {
  return PALETTE[hashStr(typ) % PALETTE.length];
}

/**
 * Maps a relationship type name to a palette color deterministically. Uses a different offset from
 * `elemColor` so types shared between elements and relationships get distinct colors.
 *
 * @param {string} typ - Relationship type name.
 * @returns {string} CSS color string.
 */
export function relColor(typ) {
  return PALETTE[(hashStr(typ) + 7) % PALETTE.length];
}

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
 * Derives a short human-readable label from a model's `contentType` string. Extracts the metamodel
 * segment (e.g. "ARCHIMATE") or the fragment identifier.
 *
 * @param {string | undefined} contentType - The model's MIME-type-like content type.
 * @returns {string} Short label, or "?" when no recognisable pattern is found.
 */
export function modelTypeLabel(contentType) {
  if (!contentType) {
    return '?';
  }
  const m = contentType.match(/\/metamodel\/([^/]+)\//);
  if (m) {
    return m[1].toUpperCase();
  }
  const hash = contentType.split('#')[1];
  return hash ? hash.replace(/Model$/, '') : '?';
}

/**
 * Resolves the content fetch URL for a model object returned by the API. Prefers the
 * `_links.content` HAL link; falls back to constructing the canonical API path from the model's
 * slug fields.
 *
 * @param {object} model - A model object from the API model list.
 * @returns {string | undefined} The content URL, or undefined if it cannot be
 * resolved.
 */
export function modelContentUrl(model) {
  const links = model._links?.content;
  if (Array.isArray(links) && links[0]?.href) {
    return links[0].href.replaceAll(/\{[^}]*\}/g, '');
  }
  if (links?.href) {
    return links.href.replaceAll(/\{[^}]*\}/g, '');
  }
  const { scopeSlug, projectSlug, projectVersion, slug } = model;
  if (scopeSlug && projectSlug && projectVersion && slug) {
    return `${BASE}/api/models/${scopeSlug}/${projectSlug}/${projectVersion}/${slug}/content?format=json`;
  }
}
