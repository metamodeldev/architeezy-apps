/**
 * API client with authentication support.
 *
 * Centralizes auth token state by reading from AuthService.
 *
 * @module api
 * @package
 */

import { token, isAuthed as _isAuthed } from './auth/index.js';
import { t } from './i18n.js';

// ── HTTP CLIENT ───────────────────────────────────────────────────────────────

/**
 * Fetch wrapper that always sends credentials and attaches the Bearer token when present. Clears
 * the token and throws on HTTP 401 so the caller can prompt the user to sign in.
 *
 * @param {string} url - The URL to fetch.
 * @returns {Promise<Response>} The fetch response promise.
 */
export async function apiFetch(url) {
  const headers = token.value ? { Authorization: `Bearer ${token.value}` } : {};
  const r = await fetch(url, { headers, credentials: 'include' });
  if (r.status === 401) {
    // Clear token directly (avoid circular import by dynamic import if needed)
    // Since setToken is synchronous, we can import it directly
    const { setToken } = await import('./auth/service.js');
    setToken(undefined);
    throw new Error(t('authRequired'));
  }
  return r;
}
