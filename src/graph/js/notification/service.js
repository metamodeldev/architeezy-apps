/**
 * Notification state management.
 *
 * @module notification/service
 */

import { signal } from '../signals/index.js';

// `undefined` = hidden; string = visible with that text
// oxlint-disable-next-line unicorn/no-useless-undefined
const _loadingText = signal(undefined);

// `undefined` = no toast; { text, type } = visible toast
// oxlint-disable-next-line unicorn/no-useless-undefined
const _toastMessage = signal(undefined);

/**
 * Shows the loading overlay with the given message.
 *
 * @param {string} [text] - Loading message to display.
 */
export function showLoading(text = '') {
  _loadingText.value = text;
}

/** Hides the loading overlay. */
export function hideLoading() {
  _loadingText.value = undefined;
}

/**
 * Shows a toast notification.
 *
 * @param {string} text - Message to display.
 * @param {'info' | 'error'} [type] - Toast type.
 */
export function showToast(text, type = 'info') {
  _toastMessage.value = { text, type };
}

/** Dismisses the current toast. */
export function clearToast() {
  _toastMessage.value = undefined;
}

export { _loadingText as loadingTextSignal, _toastMessage as toastMessageSignal };
