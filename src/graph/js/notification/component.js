/**
 * Notification component.
 *
 * Subscribes to NotificationService signals and updates loading overlay and toast DOM. Call init()
 * once during app boot after the DOM is ready.
 *
 * @module notification/component
 */

import { effect } from '../signals/index.js';
import { clearToast, loadingTextSignal, toastMessageSignal } from './service.js';

let _toastTimer;

/** Initializes notification effects and wires the toast dismiss button. */
export function init() {
  // Loading overlay
  effect(() => {
    const text = loadingTextSignal.value;
    const loadingEl = document.getElementById('loading');
    if (!loadingEl) {
      return;
    }
    const textEl = document.getElementById('loading-text');
    if (textEl) {
      textEl.textContent = text ?? '';
    }
    loadingEl.classList.toggle('hidden', text === undefined);
  });

  // Toast notification with auto-dismiss
  effect(() => {
    const toast = toastMessageSignal.value;
    clearTimeout(_toastTimer);
    const toastEl = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    if (!toastEl || !msgEl) {
      return;
    }
    if (toast !== undefined) {
      msgEl.textContent = toast.text;
      toastEl.classList.add('visible');
      _toastTimer = setTimeout(clearToast, 7000);
    } else {
      toastEl.classList.remove('visible');
    }
  });

  document.getElementById('toast-close')?.addEventListener('click', clearToast);
}
