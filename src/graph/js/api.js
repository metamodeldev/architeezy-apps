/**
 * API client with authentication support.
 *
 * Centralizes auth token state.
 *
 * @module api
 * @package
 */

import { t } from './i18n.js';

export const BASE_URL = 'https://architeezy.com';

// ── AUTH TOKEN STATE ───────────────────────────────────────────────────────────

let _authToken; // Bearer token; kept in memory only
let _cookieAuthed = false; // True when /api/users/current succeeds without a token

/**
 * Returns true when the user has an active session (token or cookie).
 *
 * @returns {boolean} True if authenticated.
 */
export function isAuthed() {
  return _cookieAuthed || Boolean(_authToken);
}

/**
 * Returns the current Bearer token (if any).
 *
 * @returns {string | undefined} The Bearer token or undefined.
 */
export function getAuthToken() {
  return _authToken;
}

/**
 * Sets the Bearer token.
 *
 * @param {string | undefined} token - The Bearer token or undefined to clear.
 */
export function setAuthToken(token) {
  _authToken = token;
}

/**
 * Returns whether a session cookie is present (set after successful /api/users/current).
 *
 * @returns {boolean} True if cookie-authed.
 */
export function getCookieAuthed() {
  return _cookieAuthed;
}

/**
 * Sets the cookie-authed flag.
 *
 * @param {boolean} value - True if cookie-authenticated.
 */
export function setCookieAuthed(value) {
  _cookieAuthed = value;
}

// ── HTTP CLIENT ───────────────────────────────────────────────────────────────

/**
 * Fetch wrapper that always sends credentials and attaches the Bearer token when present. Clears
 * the token and throws on HTTP 401 so the caller can prompt the user to sign in.
 *
 * @param {string} url - The URL to fetch.
 * @returns {Promise<Response>} The fetch response promise.
 */
export async function apiFetch(url) {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const r = await fetch(url, { headers, credentials: 'include' });
  if (r.status === 401) {
    setAuthToken(undefined);
    throw new Error(t('authRequired'));
  }
  return r;
}
