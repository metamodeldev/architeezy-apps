/**
 * HighlightService - Reactive service for highlight mode state management.
 *
 * Manages the highlight-enabled flag. The highlighted node is tracked by `selectedNodeId` from the
 * selection module — graph computations use it when highlight mode is on.
 *
 * @module highlight/service
 * @package
 */

import { signal } from '../signals/index.js';

// ── PRIVATE SIGNALS ─────────────────────────────────────────────────────────────

/** @type {import('../signals').Signal<boolean>} */
const _highlightEnabled = signal(false);

// ── PUBLIC READERS ─────────────────────────────────────────────────────────────

/**
 * Whether highlight mode is currently enabled.
 *
 * @returns {boolean} True if highlight mode is enabled.
 */
export function getHighlightEnabled() {
  return _highlightEnabled.value;
}

// ── PUBLIC ACTIONS ─────────────────────────────────────────────────────────────

/**
 * Enables or disables highlight mode.
 *
 * @param {boolean} enabled - True to enable, false to disable.
 */
export function setHighlightEnabled(enabled) {
  _highlightEnabled.value = enabled;
}

// ── PERSISTENCE ───────────────────────────────────────────────────────────────

/**
 * Loads highlight state from localStorage. Call during service initialization.
 *
 * @returns {void}
 */
export function loadHighlightStateFromStorage() {
  const saved = localStorage.getItem('architeezyGraphHighlightEnabled') === 'true';
  _highlightEnabled.value = saved;
}

/**
 * Saves current highlight state to localStorage. Call after changing enabled state.
 *
 * @returns {void}
 */
export function saveHighlightStateToStorage() {
  localStorage.setItem('architeezyGraphHighlightEnabled', _highlightEnabled.value);
}

// ── INITIALIZATION ─────────────────────────────────────────────────────────────

/**
 * Initializes highlight service state from persistent storage.
 *
 * @returns {void}
 */
export function initializeHighlightService() {
  loadHighlightStateFromStorage();
}
