/**
 * URL state management service.
 *
 * @module router
 */

import { signal } from '../signals/index.js';

// ── PRIVATE STATE ─────────────────────────────────────────────────────────────

/** @type {{ value: Record<string, string | number | boolean> }} */
const _params = signal({});

/** Параметры последней popstate-навигации. undefined до первого события (boot). */
export const navParams = signal();

// ── URL UPDATE HELPERS ────────────────────────────────────────────────────────

/**
 * Replaces the current URL's query parameters with the provided updates.
 *
 * @param {Object<string, string | number | boolean | undefined>} updates - Key-value pairs to
 *   update. Undefined values cause the parameter to be removed.
 */
export function replaceParams(updates) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  // oxlint-disable-next-line unicorn/no-null
  history.replaceState(null, '', url.toString());
}

/**
 * Creates a new history entry and updates URL parameters.
 *
 * @param {Object<string, string | number | boolean | undefined>} updates - Key-value pairs to
 *   update. Undefined values cause the parameter to be removed.
 */
export function pushState(updates) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  // oxlint-disable-next-line unicorn/no-null
  history.pushState(null, '', url.toString());
}

/**
 * Synchronises the URL with the current application state.
 *
 * @param {Object} [options] - Options object.
 * @param {boolean} [options.push] - If true, creates a new history entry. Defaults to false.
 */
export function syncUrl({ push = false } = {}) {
  if (push) {
    // oxlint-disable-next-line unicorn/no-null
    history.pushState(null, '', location.href);
  }
}

/**
 * Converts a URLSearchParams object to a plain object.
 *
 * @param {URLSearchParams} urlParams - The URLSearchParams to convert.
 * @returns {Object<string, string>} The plain object representation.
 */
export function objectFromParams(urlParams) {
  const obj = {};
  for (const [key, value] of urlParams) {
    obj[key] = value;
  }
  return obj;
}

// Export params signal for external reactive access
export const params = _params;

/**
 * Initialises the router: reads current URL params into `params` and registers the popstate
 * listener that publishes `navParams` on back/forward navigation.
 */
export function initRouter() {
  params.value = objectFromParams(new URLSearchParams(location.search));
  globalThis.addEventListener('popstate', () => {
    const p = objectFromParams(new URLSearchParams(location.search));
    params.value = p;
    navParams.value = p;
  });
}
