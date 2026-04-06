/**
 * UI notifications: loading, errors, toasts.
 *
 * @module ui/notifications
 * @package
 */

// Auto-dismiss timer for the toast notification (owned here, not in global state).
let _toastTimer;

// ── LOADING & ERROR ────────────────────────────────────────────────────────────

/**
 * Shows the full-screen loading overlay with the given message.
 *
 * @param {string} text - Loading message to display.
 */
export function showLoading(text) {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading').classList.remove('hidden');
}

/** Hides the full-screen loading overlay. */
export function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

/**
 * Shows the full-screen error panel (used only when no model is loaded yet). Also hides the loading
 * overlay.
 *
 * @param {string} msg - Error message to display.
 */
export function showError(msg) {
  document.getElementById('error-detail').textContent = msg;
  document.getElementById('error-msg').classList.add('visible');
  document.getElementById('loading').classList.add('hidden');
}

// ── TOAST NOTIFICATIONS ─────────────────────────────────────────────────────────

/**
 * Shows a dismissible toast notification when a model load fails but a previous model is still
 * displayed. Auto-dismisses after 7 s.
 *
 * @param {string} msg - Error message to display in the toast.
 */
export function showToast(msg) {
  clearTimeout(_toastTimer);
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast').classList.add('visible');
  _toastTimer = setTimeout(hideToast, 7000);
}

/** Dismisses the toast notification immediately. */
export function hideToast() {
  clearTimeout(_toastTimer);
  document.getElementById('toast').classList.remove('visible');
}
