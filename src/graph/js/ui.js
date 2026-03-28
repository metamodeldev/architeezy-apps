// ── UI UTILITIES ───────────────────────────────────────────────────────────

import { cyBg, refreshEdgeLabelBg } from './graph.js';

/**
 * Escapes `s` for safe insertion into HTML attribute values and text content.
 *
 * @param {unknown} s - Value to escape; non-strings are coerced via String().
 * @returns {string} HTML-escaped string.
 */
export function escHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Auto-dismiss timer for the toast notification (owned here, not in global state).
let _toastTimer;

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

// ── SIDEBAR TOGGLE ─────────────────────────────────────────────────────────

/**
 * Toggles the collapsed state of a sidebar section with animation and rotates its chevron icon.
 *
 * @param {string} id - The `id` attribute of the section element to toggle.
 */
export function toggleSection(id) {
  const collapsed = document.getElementById(id).classList.toggle('collapsed');
  document.getElementById(`icon-${id}`)?.classList.toggle('rotated', collapsed);
}

/** Toggles the collapsed state of the entire left sidebar. */
export function toggleSidebar() {
  const sidebar = document.getElementById('graph-sidebar');
  const btn = document.getElementById('sidebar-collapse-btn');
  const collapsed = sidebar.classList.toggle('collapsed');
  btn.textContent = collapsed ? '›' : '‹';
  btn.title = collapsed ? 'Show sidebar' : 'Hide sidebar';
}

// ── VIEW SWITCHING ─────────────────────────────────────────────────────────

// Current active view — owned here so other modules call getCurrentView() instead of state.
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
 * Switches between the graph and table views. Updates tab button active states and element
 * visibility.
 *
 * @param {'graph' | 'table'} view - Target view.
 * @param {Function | null} afterSwitch - Optional callback invoked after switching to table view.
 */
export function switchView(view, afterSwitch) {
  _currentView = view;
  const g = view === 'graph';
  document.getElementById('tab-graph').classList.toggle('active', g);
  document.getElementById('tab-table').classList.toggle('active', !g);
  document.getElementById('cy').classList.toggle('hidden', !g);
  document.getElementById('cy-controls').classList.toggle('hidden', !g);
  document.getElementById('table-view').classList.toggle('visible', !g);
  if (!g && afterSwitch) {
    afterSwitch();
  }
}

// ── THEME ──────────────────────────────────────────────────────────────────

/**
 * Applies a colour theme globally and persists the choice to localStorage. Also refreshes the
 * Cytoscape edge label background to match the new canvas colour.
 *
 * @param {'dark' | 'light' | 'system'} theme - Theme name.
 */
export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('architeezyTheme', theme);
  for (const b of document.querySelectorAll('.theme-btn')) {
    b.classList.toggle('active', b.id === `theme-btn-${theme}`);
  }
  refreshEdgeLabelBg(cyBg);
}
