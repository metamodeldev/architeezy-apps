/**
 * Authentication UI component.
 *
 * Handles DOM updates, network calls, and event wiring for login/logout. Uses reactive effects to
 * sync UI with auth state.
 *
 * @module auth/component
 * @package
 */

import { BASE_URL } from '../constants.js';
import { t } from '../i18n.js';
import { showToast } from '../notification/index.js';
import { effect } from '../signals/index.js';
import {
  handleAuthSuccess,
  isAuthed,
  setPopup,
  setUserName,
  signOut,
  token,
  userName,
} from './service.js';

// ── UI INITIALIZATION ──────────────────────────────────────────────────────────

/**
 * Initializes reactive DOM updates for auth UI. Sets up effects that automatically update
 * visibility and user name.
 */
export function initAuthUI() {
  // Show/hide auth button and user info based on isAuthed
  effect(() => {
    const authed = isAuthed.value;
    const authBtn = document.getElementById('auth-btn');
    const userInfo = document.getElementById('user-info');
    const signoutBtn = document.getElementById('signout-btn');

    if (authBtn) {
      authBtn.classList.toggle('hidden', authed);
    }
    if (userInfo) {
      userInfo.classList.toggle('visible', authed);
    }
    if (signoutBtn) {
      signoutBtn.classList.toggle('hidden', !authed);
    }
  });

  // Update user name display reactively
  effect(() => {
    const el = document.getElementById('user-name');
    if (el) {
      el.textContent = userName.value;
    }
  });
}

// ── NETWORK ────────────────────────────────────────────────────────────────────

/** Fetches current user profile and updates user name. Non-critical: errors are silently ignored. */
async function fetchCurrentUser() {
  try {
    const r = await fetch(`${BASE_URL}/api/users/current`, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      credentials: 'include',
    });
    if (r.ok) {
      const user = await r.json();
      setUserName(user.name || user.displayName || user.email || user.login || '');
    }
  } catch {
    /* Non-critical: ignore errors */
  }
}

// ── ACTIONS ─────────────────────────────────────────────────────────────────────

/**
 * Opens the Architeezy auth popup window. The popup posts an AUTH_SUCCESS message when login
 * completes.
 */
export function startAuth() {
  const AUTH_URL = `${BASE_URL}/-/auth`;
  const popup = window.open(
    AUTH_URL,
    'architeezy-auth',
    `width=480,height=640,left=${Math.round((screen.width - 480) / 2)},top=${Math.round((screen.height - 640) / 2)}`,
  );
  setPopup(popup);
  if (!popup) {
    showToast(t('popupBlocked'));
  }
}

// ── EVENT WIRING ───────────────────────────────────────────────────────────────

/**
 * Wires auth-related UI event listeners.
 *
 * @param {Function} onReInit - App re-entry point to call after sign-out or login.
 */
export function wireAuthEvents(onReInit) {
  const authBtn = document.getElementById('auth-btn');
  const signoutBtn = document.getElementById('signout-btn');

  if (authBtn) {
    authBtn.addEventListener('click', startAuth);
  }

  if (signoutBtn) {
    signoutBtn.addEventListener('click', makeSignOutHandler(onReInit));
  }

  window.addEventListener('message', handleAuthMessage(onReInit));
}

/**
 * Handler for window postMessage events. Listens for AUTH_SUCCESS from the auth popup.
 *
 * @param {Function} onReInit - App re-entry point to call after sign-out or login.
 * @returns {EventListener} Event handler function.
 */
function handleAuthMessage(onReInit) {
  return async (e) => {
    if (!e.data || e.data.type !== 'AUTH_SUCCESS') {
      return;
    }
    handleAuthSuccess(e.data.token);
    await fetchCurrentUser();
    onReInit();
  };
}

/**
 * Creates the sign-out click handler.
 *
 * @param {Function} onReInit - App re-entry point to call after sign-out.
 * @returns {EventListener} The sign-out event handler.
 */
function makeSignOutHandler(onReInit) {
  return function onSignOut() {
    signOut();
    showToast(t('signedOut'));

    // Clean up URL and localStorage
    const url = new URL(location.href);
    url.searchParams.delete('model');
    // oxlint-disable-next-line unicorn/no-null
    history.replaceState(null, '', url);
    localStorage.removeItem('architeezyGraphModelUrl');

    // Defer to avoid concurrent boots
    setTimeout(onReInit, 0);
  };
}
