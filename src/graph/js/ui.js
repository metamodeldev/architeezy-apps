// ── UI UTILITIES ───────────────────────────────────────────────────────────

import { cyBg, refreshEdgeLabelBg } from './graph.js';
import { getLegendEnabled, setLegendEnabled } from './legend.js';

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
  const section = document.getElementById(id);
  const collapsed = section.classList.toggle('collapsed');
  // Update button's aria-expanded attribute
  const toggleBtn = document.querySelector(`.sidebar-toggle-btn[data-section="${id}"]`);
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', !collapsed);
  }
  const icon = document.getElementById(`icon-${id}`);
  if (icon) {
    icon.classList.toggle('rotated', collapsed);
  }
  // Persist panel collapsed state
  try {
    localStorage.setItem(`architeezyGraphPanel_${id}_collapsed`, collapsed);
  } catch {
    // Storage unavailable — ignore
  }
}

/** Toggles the collapsed state of the entire left sidebar. */
export function toggleSidebar() {
  const sidebar = document.getElementById('graph-sidebar');
  const btn = document.getElementById('sidebar-collapse-btn');
  const collapsed = sidebar.classList.toggle('collapsed');
  btn.textContent = collapsed ? '›' : '‹';
  btn.title = collapsed ? 'Show sidebar' : 'Hide sidebar';
  btn.setAttribute('aria-expanded', !collapsed);
  // Persist sidebar collapsed state
  try {
    localStorage.setItem('architeezyGraphSidebarCollapsed', collapsed);
  } catch {
    // Storage unavailable — ignore
  }
}

// ── SIDEBAR STATE RESTORATION ─────────────────────────────────────────────

/** Restores sidebar collapsed state from localStorage. */
export function restoreSidebarState() {
  try {
    const stored = localStorage.getItem('architeezyGraphSidebarCollapsed');
    const collapsed = stored === 'true';
    const sidebar = document.getElementById('graph-sidebar');
    const btn = document.getElementById('sidebar-collapse-btn');
    if (collapsed) {
      sidebar.classList.add('collapsed');
      btn.textContent = '›';
      btn.title = 'Show sidebar';
      btn.setAttribute('aria-expanded', 'false');
    } else {
      sidebar.classList.remove('collapsed');
      btn.textContent = '‹';
      btn.title = 'Hide sidebar';
      btn.setAttribute('aria-expanded', 'true');
    }
  } catch {
    // Storage unavailable — default to expanded
    const sidebar = document.getElementById('graph-sidebar');
    const btn = document.getElementById('sidebar-collapse-btn');
    sidebar.classList.remove('collapsed');
    btn.textContent = '‹';
    btn.title = 'Hide sidebar';
    btn.setAttribute('aria-expanded', 'true');
  }
}

/** Restores individual panel collapsed states from localStorage. */
export function restorePanelStates() {
  const panels = ['sec-elem', 'sec-rel', 'sec-detail', 'sec-settings'];
  for (const id of panels) {
    try {
      const stored = localStorage.getItem(`architeezyGraphPanel_${id}_collapsed`);
      const collapsed = stored === 'true';
      const section = document.getElementById(id);
      const icon = document.getElementById(`icon-${id}`);
      const toggleBtn = document.querySelector(`.sidebar-toggle-btn[data-section="${id}"]`);
      if (collapsed) {
        section.classList.add('collapsed');
        if (icon) {
          icon.classList.add('rotated');
        }
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      } else {
        section.classList.remove('collapsed');
        if (icon) {
          icon.classList.remove('rotated');
        }
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      }
    } catch {
      // Default to expanded
      const section = document.getElementById(id);
      const icon = document.getElementById(`icon-${id}`);
      const toggleBtn = document.querySelector(`.sidebar-toggle-btn[data-section="${id}"]`);
      section.classList.remove('collapsed');
      if (icon) {
        icon.classList.remove('rotated');
      }
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    }
  }
}

/** Restores both sidebar and panel states. */
export function restoreSidebarAndPanelState() {
  restoreSidebarState();
  restorePanelStates();
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
 * visibility. The legend is only visible in graph view.
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

  // Legend: only visible in graph view and only if legend is enabled
  const legendEl = document.getElementById('graph-legend');
  if (!legendEl) {
    // No legend element in DOM - skip
  } else if (g) {
    // Switching to graph: restore legend to its enabled state (and rebuild content if needed)
    const enabled = getLegendEnabled();
    setLegendEnabled(enabled);
  } else {
    // Switching to table: hide legend (but don't change the enabled state)
    legendEl.classList.add('hidden');
  }

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
  // Validate theme: fall back to 'system' for any unrecognized value
  const validThemes = ['dark', 'light', 'system'];
  const resolvedTheme = validThemes.includes(theme) ? theme : 'system';

  document.documentElement.dataset.theme = resolvedTheme;
  localStorage.setItem('architeezyTheme', resolvedTheme);
  for (const b of document.querySelectorAll('.theme-btn')) {
    b.classList.toggle('active', b.id === `theme-btn-${resolvedTheme}`);
  }
  refreshEdgeLabelBg(cyBg);
}
