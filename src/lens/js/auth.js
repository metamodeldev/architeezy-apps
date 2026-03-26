// ── AUTH ───────────────────────────────────────────────────────────────────

import { AUTH_URL, BASE } from './constants.js';
import { t } from './i18n.js';

let authToken; // Bearer token; kept in memory only
let cookieAuthed = false; // True when /api/users/current succeeds without a token (same-domain cookie session)
let authPopup;

/**
 * Returns true when the user has an active session (token or cookie).
 *
 * @returns {boolean} True if the user is authenticated.
 */
export function isAuthed() {
  return cookieAuthed || Boolean(authToken);
}

/**
 * Probes whether the browser has a valid session cookie (same-domain hosting). Called once at
 * startup before we know if a token is needed. Sets `cookieAuthed` and updates the auth UI if a
 * session is found.
 */
export async function probeAuth() {
  try {
    const r = await fetch(`${BASE}/api/users/current`, {
      credentials: 'include',
    });
    if (r.ok) {
      const user = await r.json();
      cookieAuthed = true;
      document.getElementById('user-name').textContent =
        user.name || user.displayName || user.email || user.login || '';
    }
  } catch {
    /* Offline or CORS — treat as anonymous */
  }
  updateAuthUI();
}

/** Syncs the auth-related header elements to the current session state. */
export function updateAuthUI() {
  const authed = cookieAuthed || Boolean(authToken);
  document.getElementById('auth-btn').style.display = authed ? 'none' : '';
  document.getElementById('user-info').style.display = authed ? '' : 'none';
  // Sign-out button only shown for token auth; cookie sessions are managed server-side
  document.getElementById('signout-btn').style.display = !cookieAuthed && authToken ? '' : 'none';
}

/**
 * Opens the Architeezy auth popup window. The popup posts an AUTH_SUCCESS message back to this
 * window when login completes.
 */
export function startAuth() {
  authPopup = window.open(
    AUTH_URL,
    'architeezy-auth',
    `width=480,height=640,left=${Math.round((screen.width - 480) / 2)},top=${Math.round((screen.height - 640) / 2)}`,
  );
}

/**
 * Fetches the current user profile and updates the display name in the header. Non-critical:
 * silently ignored on failure.
 */
export async function fetchCurrentUser() {
  try {
    const r = await apiFetch(`${BASE}/api/users/current`);
    if (!r.ok) {
      return;
    }
    const user = await r.json();
    document.getElementById('user-name').textContent =
      user.name || user.displayName || user.email || user.login || '';
  } catch {
    /* Non-critical */
  }
  updateAuthUI();
}

/**
 * Clears the in-memory token and resets the header user name. The caller (app.js) re-runs init()
 * afterwards to reload with anonymous access.
 */
export function signOut() {
  authToken = undefined;
  document.getElementById('user-name').textContent = '';
  updateAuthUI();
}

/**
 * Fetch wrapper that always sends credentials and attaches the Bearer token when present. Clears
 * the token and throws on HTTP 401 so the caller can prompt the user to sign in.
 *
 * @param {string} url - The URL to fetch.
 * @returns {Promise<Response>} The fetch response.
 */
export async function apiFetch(url) {
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const r = await fetch(url, { headers, credentials: 'include' });
  if (r.status === 401) {
    authToken = undefined;
    updateAuthUI();
    throw new Error(t('authRequired'));
  }
  return r;
}

/**
 * Handles the AUTH_SUCCESS postMessage from the auth popup. Stores the token in memory and closes
 * the popup window.
 *
 * @param {string} token - The Bearer access token received from the auth popup.
 */
export function handleAuthSuccess(token) {
  authToken = token;
  if (authPopup) {
    authPopup.close();
    authPopup = undefined;
  }
}
