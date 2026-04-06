/**
 * Reactive search service using signals.
 *
 * Manages global search query state with reactive primitives. Provides computed query value and
 * actions to mutate it.
 *
 * @module search/service
 * @package
 */

import { signal } from '../signals/index.js';

// ── PRIVATE STATE ─────────────────────────────────────────────────────────────

const _query = signal('');

// ── PUBLIC STATE ──────────────────────────────────────────────────────────────

export const query = _query.asReadonly();

// ── ACTIONS ───────────────────────────────────────────────────────────────────

/**
 * Sets the search query (trimmed).
 *
 * @param {string} q - The search query string.
 */
export function setQuery(q) {
  _query.value = q.trim();
}

/** Clears the search query. */
export function clearQuery() {
  _query.value = '';
}
