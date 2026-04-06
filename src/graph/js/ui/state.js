/**
 * Centralized UI state management.
 *
 * View, sidebar, panel, theme.
 *
 * @module ui/state
 * @package
 */

// Current active view — 'graph' or 'table'
let _currentView = 'graph';

/**
 * Returns the currently active view.
 *
 * @returns {'graph' | 'table'} The currently active view name.
 */
export function getCurrentView() {
  return _currentView;
}

/**
 * Sets the current view and updates the state variable. Used by switchView; external modules should
 * call switchView() instead.
 *
 * @param {'graph' | 'table'} view - Target view.
 */
export function _setCurrentView(view) {
  _currentView = view;
}

/**
 * Theme persistence helpers.
 *
 * @returns {'dark' | 'light' | 'system'} Resolved theme.
 */
export function getStoredTheme() {
  try {
    return localStorage.getItem('architeezyTheme') || 'system';
  } catch {
    return 'system';
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem('architeezyTheme', theme);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Sidebar collapsed state persistence.
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

export function setSidebarCollapsed(collapsed) {
  try {
    localStorage.setItem('architeezyGraphSidebarCollapsed', String(collapsed));
  } catch {
    // Ignore
  }
}

/**
 * Panel collapsed state persistence.
 *
 * @param {string} panelId - Panel ID (e.g., 'sec-elem', 'sec-rel', 'sec-detail', 'sec-settings').
 * @returns {boolean} True if panel is collapsed.
 */
export function getPanelCollapsed(panelId) {
  try {
    return localStorage.getItem(`architeezyGraphPanel_${panelId}_collapsed`) === 'true';
  } catch {
    return false;
  }
}

export function setPanelCollapsed(panelId, collapsed) {
  try {
    localStorage.setItem(`architeezyGraphPanel_${panelId}_collapsed`, String(collapsed));
  } catch {
    // Ignore
  }
}
