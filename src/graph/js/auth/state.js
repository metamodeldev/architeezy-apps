/**
 * Authentication state management.
 *
 * Token, cookie auth, error display.
 *
 * @module auth/state
 * @package
 */

import {
  BASE_URL,
  getAuthToken,
  getCookieAuthed,
  isAuthed,
  setAuthToken,
  setCookieAuthed,
} from '../api.js';

export const AUTH_URL = `${BASE_URL}/-/auth`;

// Re-export core auth functions from api.js
export { getAuthToken, getCookieAuthed, isAuthed, setAuthToken, setCookieAuthed };

// ── POPUP STATE ───────────────────────────────────────────────────────────────

let _authPopup; // Reference to the auth popup window

/**
 * Handles the AUTH_SUCCESS postMessage from the auth popup. Stores the token in memory and closes
 * the popup window.
 *
 * @param {string} token - The Bearer access token received from the auth popup.
 */
export function handleAuthSuccess(token) {
  setAuthToken(token);
  if (_authPopup) {
    _authPopup.close();
    _authPopup = undefined;
  }
}

/**
 * Sets the auth popup window reference.
 *
 * @param {Window | null} popup - The popup window reference.
 */
export function setAuthPopup(popup) {
  _authPopup = popup;
}

// ── ERROR STATE ───────────────────────────────────────────────────────────────

let _authErrorShown = false;

/**
 * Sets whether an auth error was shown during load.
 *
 * @param {boolean} value - True if an error was shown.
 */
export function setAuthErrorShown(value) {
  _authErrorShown = value;
}

/**
 * Returns true if an auth error was shown.
 *
 * @returns {boolean} True if an auth error was shown.
 */
export function isAuthErrorShown() {
  return _authErrorShown;
}
