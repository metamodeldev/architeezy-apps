// ── HELPERS ────────────────────────────────────────────────────────────────

import { UUID_RE, PALETTE, BASE } from "./constants.js";

/**
 * Returns true if `v` is a string that looks like a UUID or UUID-like identifier.
 *
 * @param {unknown} v
 * @returns {boolean}
 */
export function isUUID(v) {
  return typeof v === "string" && UUID_RE.test(v);
}

/**
 * Fast deterministic string hash (djb2 variant).
 *
 * @param {string} s
 * @returns {number} Unsigned 32-bit integer.
 */
export function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
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
 * Maps a relationship type name to a palette color deterministically.
 * Uses a different offset from `elemColor` so types shared between elements
 * and relationships get distinct colors.
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
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Derives a short human-readable label from a model's `contentType` string.
 * Extracts the metamodel segment (e.g. "ARCHIMATE") or the fragment identifier.
 *
 * @param {string|undefined} contentType - The model's MIME-type-like content type.
 * @returns {string} Short label, or "?" when no recognisable pattern is found.
 */
export function modelTypeLabel(contentType) {
  if (!contentType) return "?";
  const m = contentType.match(/\/metamodel\/([^/]+)\//);
  if (m) return m[1].toUpperCase();
  const hash = contentType.split("#")[1];
  return hash ? hash.replace(/Model$/, "") : "?";
}

/**
 * Resolves the content fetch URL for a model object returned by the API.
 * Prefers the `_links.content` HAL link; falls back to constructing the
 * canonical API path from the model's slug fields.
 *
 * @param {object} model - A model object from the API model list.
 * @returns {string|null} The content URL, or null if it cannot be resolved.
 */
export function modelContentUrl(model) {
  const links = model._links?.content;
  if (Array.isArray(links) && links[0]?.href)
    return links[0].href.replace(/\{[^}]*\}/g, "");
  if (links?.href) return links.href.replace(/\{[^}]*\}/g, "");
  const { scopeSlug, projectSlug, projectVersion, slug } = model;
  if (scopeSlug && projectSlug && projectVersion && slug)
    return `${BASE}/api/models/${scopeSlug}/${projectSlug}/${projectVersion}/${slug}/content?format=json`;
  return null;
}
