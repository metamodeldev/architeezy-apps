// ── UI UTILITIES ───────────────────────────────────────────────────────────

import { cyBg } from './graph.js';
import { state } from './state.js';

/**
 * Shows the full-screen loading overlay with the given message.
 *
 * @param {string} text - Loading message to display.
 */
export function showLoading(text) {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading').style.display = 'flex';
}

/** Hides the full-screen loading overlay. */
export function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

/**
 * Shows the full-screen error panel (used only when no model is loaded yet). Also hides the loading
 * overlay.
 *
 * @param {string} msg - Error message to display.
 */
export function showError(msg) {
  document.getElementById('error-detail').textContent = msg;
  document.getElementById('error-msg').style.display = 'flex';
  document.getElementById('loading').style.display = 'none';
}

/**
 * Shows a dismissible toast notification when a model load fails but a previous model is still
 * displayed. Auto-dismisses after 7 s.
 *
 * @param {string} msg - Error message to display in the toast.
 */
export function showToast(msg) {
  clearTimeout(state.toastTimer);
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast').classList.add('visible');
  state.toastTimer = setTimeout(hideToast, 7000);
}

/** Dismisses the toast notification immediately. */
export function hideToast() {
  clearTimeout(state.toastTimer);
  document.getElementById('toast').classList.remove('visible');
}

// ── SIDEBAR TOGGLE ─────────────────────────────────────────────────────────

/**
 * Toggles the collapsed state of a sidebar section and updates its chevron icon.
 *
 * @param {string} id - The `id` attribute of the section element to toggle.
 */
export function toggleSection(id) {
  const collapsed = document.getElementById(id).classList.toggle('collapsed');
  document.getElementById(`icon-${id}`).textContent = collapsed ? '▶' : '▼';
}

// ── VIEW SWITCHING ─────────────────────────────────────────────────────────

/**
 * Switches between the graph and table views. Updates tab button active states and element
 * visibility.
 *
 * @param {'graph' | 'table'} view - Target view.
 * @param {Function | null} afterSwitch - Optional callback invoked after switching to table view.
 */
export function switchView(view, afterSwitch) {
  state.currentView = view;
  const g = view === 'graph';
  document.getElementById('tab-graph').classList.toggle('active', g);
  document.getElementById('tab-table').classList.toggle('active', !g);
  document.getElementById('cy').style.display = g ? 'block' : 'none';
  document.getElementById('cy-controls').style.display = g ? 'flex' : 'none';
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
  if (state.cy) {
    requestAnimationFrame(() =>
      state.cy.style().selector('edge').style('text-background-color', cyBg()).update(),
    );
  }
}
