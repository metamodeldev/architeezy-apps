/**
 * View state management.
 *
 * Owns the current view signal (graph ↔ table) and localStorage helpers previously scattered across
 * ui/state.js. DOM switching lives in view/component.js.
 *
 * @module view/service
 */

import { signal } from '../signals/index.js';

// ── CURRENT VIEW ──────────────────────────────────────────────────────────────

const _currentView = signal('graph'); // 'graph' | 'table'
export const [currentView, setCurrentView] = _currentView.asPair();

// ── THEME PERSISTENCE ─────────────────────────────────────────────────────────

/**
 * Returns the stored theme preference.
 *
 * @returns {'dark' | 'light' | 'system'} Stored theme name.
 */
export function getStoredTheme() {
  try {
    return localStorage.getItem('architeezyTheme') || 'system';
  } catch {
    return 'system';
  }
}

/**
 * Persists the theme preference to localStorage.
 *
 * @param {'dark' | 'light' | 'system'} theme - Theme name to persist.
 */
export function setStoredTheme(theme) {
  try {
    localStorage.setItem('architeezyTheme', theme);
  } catch {
    // Ignore storage errors
  }
}

// ── SIDEBAR PERSISTENCE ───────────────────────────────────────────────────────

/**
 * Returns whether the sidebar is stored as collapsed.
 *
 * @returns {boolean} True if sidebar is collapsed.
 */
export function getSidebarCollapsed() {
  try {
    return localStorage.getItem('architeezyGraphSidebarCollapsed') === 'true';
  } catch {
    return false;
  }
}

/**
 * Persists the sidebar collapsed state.
 *
 * @param {boolean} collapsed - Whether the sidebar is collapsed.
 */
export function setSidebarCollapsed(collapsed) {
  try {
    localStorage.setItem('architeezyGraphSidebarCollapsed', String(collapsed));
  } catch {
    // Ignore
  }
}

// ── PANEL PERSISTENCE ─────────────────────────────────────────────────────────

/**
 * Returns whether a sidebar panel is stored as collapsed.
 *
 * @param {string} panelId - Panel ID, e.g. 'sec-elem', 'sec-rel', 'sec-detail', 'sec-settings'.
 * @returns {boolean} True if the panel is collapsed.
 */
export function getPanelCollapsed(panelId) {
  try {
    return localStorage.getItem(`architeezyGraphPanel_${panelId}_collapsed`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persists a sidebar panel's collapsed state.
 *
 * @param {string} panelId - Panel ID to persist state for.
 * @param {boolean} collapsed - Whether the panel is collapsed.
 */
export function setPanelCollapsed(panelId, collapsed) {
  try {
    localStorage.setItem(`architeezyGraphPanel_${panelId}_collapsed`, String(collapsed));
  } catch {
    // Ignore
  }
}
