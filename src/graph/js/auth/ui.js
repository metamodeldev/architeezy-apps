/**
 * Authentication UI.
 *
 * DOM rendering, network calls, event wiring for login/logout.
 *
 * @module auth/ui
 * @package
 */

import { BASE_URL } from '../api.js';
import { t } from '../i18n.js';
import {
  AUTH_URL,
  getAuthToken,
  getCookieAuthed,
  isAuthed,
  setCookieAuthed,
  setAuthErrorShown,
  setAuthToken,
  setAuthPopup,
  handleAuthSuccess,
} from './state.js';

// ── AUTH SUCCESS MESSAGE HANDLING ───────────────────────────────────────────────

let _onInit = null;
let _pendingAuthSuccess = false;

/**
 * Handles AUTH_SUCCESS postMessage from the auth popup. Stores the token, updates UI,
 * fetches user profile, dispatches auth:signOut, and invokes the app re-entry point.
 * If the app hasn't called init() yet (and thus _onInit is not set), the re-entry
 * is deferred until init() is called.
 */
function handleAuthSuccessMessage(e) {
  if (!e.data || e.data.type !== 'AUTH_SUCCESS') {
    return;
  }
  handleAuthSuccess(e.data.token);
  // Immediately update UI to reflect authentication state
  updateAuthUI();
  fetchCurrentUser();
  document.dispatchEvent(new CustomEvent('auth:signOut'));

  if (_onInit) {
    // Defer reinitialization to avoid concurrent boots
    setTimeout(() => _onInit(), 0);
  } else {
    _pendingAuthSuccess = true;
  }
}

// Attach the message listener as early as possible (module evaluation) - only in browser
if (typeof window !== 'undefined') {
  window.addEventListener('message', handleAuthSuccessMessage);
}

// ── DOM SYNC ─────────────────────────────────────────────────────────────────

/** Syncs the auth-related header elements to the current session state. */
export function updateAuthUI() {
  const authed = isAuthed();
  const authBtn = document.getElementById('auth-btn');
  const userInfo = document.getElementById('user-info');
  const signoutBtn = document.getElementById('signout-btn');
  if (authBtn) authBtn.classList.toggle('hidden', authed);
  if (userInfo) userInfo.classList.toggle('visible', authed);
  if (signoutBtn) signoutBtn.classList.toggle('hidden', getCookieAuthed() || !getAuthToken());
}

// ── NETWORK ──────────────────────────────────────────────────────────────────

/**
 * Probes whether the browser has a valid session cookie (same-domain hosting). Called once at
 * startup. Sets cookieAuthed and updates the auth UI if a session is found.
 */
export async function probeAuth() {
  try {
    const r = await fetch(`${BASE_URL}/api/users/current`, { credentials: 'include' });
    if (r.ok) {
      const user = await r.json();
      setCookieAuthed(true);
      document.getElementById('user-name').textContent =
        user.name || user.displayName || user.email || user.login || '';
    }
  } catch {
    /* Offline or CORS — treat as anonymous */
  }
  updateAuthUI();
}

/**
 * Fetches the current user profile and updates the display name in the header. Non-critical:
 * silently ignored on failure.
 */
export async function fetchCurrentUser() {
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const r = await fetch(`${BASE_URL}/api/users/current`, { headers, credentials: 'include' });
    if (r.ok) {
      const user = await r.json();
      document.getElementById('user-name').textContent =
        user.name || user.displayName || user.email || user.login || '';
    }
  } catch {
    /* Non-critical */
  }
  updateAuthUI();
}

// ── ACTIONS ──────────────────────────────────────────────────────────────────

/**
 * Opens the Architeezy auth popup window. The popup posts an AUTH_SUCCESS message back to this
 * window when login completes.
 */
export function startAuth() {
  const popup = window.open(
    AUTH_URL,
    'architeezy-auth',
    `width=480,height=640,left=${Math.round((screen.width - 480) / 2)},top=${Math.round((screen.height - 640) / 2)}`,
  );
  setAuthPopup(popup);
  if (!popup) {
    document.dispatchEvent(new CustomEvent('toast:show', { detail: { message: t('popupBlocked') } }));
  }
}

/**
 * Clears the in-memory token and resets the header user name. The caller re-runs init() afterwards
 * to reload with anonymous access.
 */
export function signOut() {
  setAuthToken(undefined);
  document.getElementById('user-name').textContent = '';
  updateAuthUI();
}

// ── EVENTS ───────────────────────────────────────────────────────────────────

/**
 * Wires auth-related UI click events:
 *
 * - Login button click
 * - Sign-out button click
 *
 * The AUTH_SUCCESS message listener is installed at module top-level.
 *
 * @param {Function} onInit - App re-entry point to call after sign-out or login.
 */
export function wireAuthEvents(onInit) {
  document.getElementById('auth-btn').addEventListener('click', startAuth);
  document.getElementById('signout-btn').addEventListener('click', makeSignOutHandler(onInit));
}

/**
 * Initializes auth module: wires auth-related UI events. The onInit callback is called after
 * sign-out or successful login. If an AUTH_SUCCESS message arrived before init() was called,
 * the callback is invoked immediately.
 *
 * @param {Function} onInit - App re-entry point.
 */
export function init(onInit) {
  wireAuthEvents(onInit);
  document.addEventListener('auth:errorShown', () => setAuthErrorShown(true));
  // If an auth success happened before init, trigger reinit now.
  if (_pendingAuthSuccess) {
    _pendingAuthSuccess = false;
    // Invoke asynchronously to avoid stack issues
    setTimeout(() => onInit(), 0);
  }
  _onInit = onInit;
}

function makeSignOutHandler(reinit) {
  return function onSignOut() {
    signOut();
    document.dispatchEvent(new CustomEvent('auth:signOut'));
    document.dispatchEvent(new CustomEvent('toast:show', { detail: { message: t('signedOut') } }));

    const url = new URL(location.href);
    url.searchParams.delete('model');
    history.replaceState(undefined, '', url);
    localStorage.removeItem('architeezyGraphModelUrl');

    // Defer reinitialization to avoid concurrent boots
    setTimeout(reinit, 0);
  };
}
