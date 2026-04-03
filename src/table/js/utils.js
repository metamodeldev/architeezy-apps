// ── HELPERS ────────────────────────────────────────────────────────────────

import { BASE, PALETTE, UUID_RE } from './constants.js';

export function isUUID(v) {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    // oxlint-disable-next-line no-bitwise
    h = Math.trunc((h * 33) ^ s.codePointAt(i));
  }
  return Math.abs(h); // Unsigned — prevents negative indices
}

export function elemColor(typ) {
  return PALETTE[hashStr(typ) % PALETTE.length];
}

export function relColor(typ) {
  return PALETTE[(hashStr(typ) + 7) % PALETTE.length];
}

export function escHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

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
