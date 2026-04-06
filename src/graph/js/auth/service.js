/**
 * Authentication service using reactive signals.
 *
 * Manages auth state (token, cookie auth, user name, errors) with reactive primitives. Provides API
 * for other modules to read and mutate auth state.
 *
 * @module auth/service
 * @package
 */

import { BASE_URL } from '../constants.js';
import { computed, signal } from '../signals/index.js';

// ── SIGNALS ─────────────────────────────────────────────────────────────────────

const _token = signal();
const _cookieAuthed = signal(false);
const _userName = signal('');
const _errorShown = signal(false);
const _popup = signal();

// ── READERS ──────────────────────────────────────────────────────────────────────

export const [token, setToken] = _token.asPair();
export const [cookieAuthed, setCookieAuthed] = _cookieAuthed.asPair();
export const [userName, setUserName] = _userName.asPair();
export const [errorShown, setErrorShown] = _errorShown.asPair();
export const [popup, setPopup] = _popup.asPair();

// ── COMPUTED ───────────────────────────────────────────────────────────────────

/** Computed: true when user has an active session (cookie or token). */
export const isAuthed = computed(() => _cookieAuthed.value || Boolean(_token.value));

// ── ACTIONS ─────────────────────────────────────────────────────────────────────

/**
 * Handles successful auth: stores token and closes popup if present.
 *
 * @param {string} newToken - The authentication token.
 */
export function handleAuthSuccess(newToken) {
  setToken(newToken);
  if (_popup.value) {
    _popup.value.close();
    _popup.value = undefined;
  }
}

/** Probes for existing session via cookie (/api/users/current). Called once at startup. */
export async function probe() {
  try {
    const r = await fetch(`${BASE_URL}/api/users/current`, { credentials: 'include' });
    if (r.ok) {
      const user = await r.json();
      setCookieAuthed(true);
      setUserName(user.name || user.displayName || user.email || user.login || '');
    }
  } catch {
    /* Offline / CORS — ignore */
  }
}

/** Signs out: clears token and user name. Caller should re-initialize the app afterwards. */
export function signOut() {
  setToken(undefined);
  setCookieAuthed(false);
  setUserName('');
  _popup.value = undefined;
}
