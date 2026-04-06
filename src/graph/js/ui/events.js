/**
 * Event wiring for UI controls.
 *
 * Legend, sidebar, tabs, theme, filter, table.
 *
 * @module ui/events
 * @package
 */

import { resizeCy } from '../graph/index.js';
import { syncUrl } from '../routing/index.js';
import { hideLoading, hideToast, showLoading, showToast } from './notifications.js';
import { toggleSection, toggleSidebar } from './sidebar.js';
import { setTheme } from './theme.js';
import { switchView } from './view.js';


// ── SIDEBAR ────────────────────────────────────────────────────────────────────

/** Wires sidebar toggle buttons and bulk select actions. */
export function wireSidebarEvents() {
  document.querySelector('aside').addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.sidebar-toggle-btn[data-section]');
    if (toggleBtn) {
      toggleSection(toggleBtn.dataset.section);
      return;
    }
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) {
      return;
    }
    if (actionBtn.dataset.action === 'select-all' || actionBtn.dataset.action === 'select-none') {
      const kind = actionBtn.dataset.kind; // 'elem' or 'rel'
      const select = actionBtn.dataset.action === 'select-all';
      // Dispatch event — filter/ui.js handles it
      document.dispatchEvent(new CustomEvent('filter:selectAll', { detail: { kind, select } }));
    }
  });

  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleSidebar);
  }
}

// ── TAB GROUPS ─────────────────────────────────────────────────────────────────

/** Wires the graph/table view tab group. */
export function wireTabGroupEvents() {
  document.querySelector('.tab-group').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn[data-view]');
    if (!btn) {
      return;
    }
    const view = btn.dataset.view; // 'graph' or 'table'
    if (view === 'graph') {
      switchView('graph');
      resizeCy();
    } else {
      switchView('table');
    }
    document.dispatchEvent(new CustomEvent('search:apply'));
    syncUrl({ push: true });
  });
}

// ── THEME ──────────────────────────────────────────────────────────────────────

/** Wires theme toggle buttons. */
export function wireThemeEvents() {
  for (const btn of document.querySelectorAll('.theme-btn')) {
    const theme = btn.id.replace('theme-btn-', '');
    if (['dark', 'light', 'system'].includes(theme)) {
      btn.addEventListener('click', () => {
        setTheme(theme);
      });
    }
  }
}


// ── TOAST ───────────────────────────────────────────────────────────────────────

/** Wires the toast close button. */
export function wireToastEvents() {
  const toastClose = document.getElementById('toast-close');
  if (toastClose) {
    toastClose.addEventListener('click', () => hideToast());
  }

  // Listen for toast:show events from model loader and other modules
  document.addEventListener('toast:show', (e) => {
    showToast(e.detail.message);
  });
}

// ── RETRY BUTTON ───────────────────────────────────────────────────────────────

/**
 * Wires the retry button to re-run app initialization.
 *
 * @param {Function} onRetry - The initialization function to call.
 */
export function wireRetryButtonEvents(onRetry) {
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', onRetry);
  }
}

// ── VIEW SWITCH REQUEST ────────────────────────────────────────────────────────

/**
 * Handles view:switchRequest events (dispatched by table/focusNode, etc.).
 *
 * @param {CustomEvent} e - Event with detail: { view: 'graph' | 'table' }
 */
function handleViewSwitchRequest(e) {
  const { view } = e.detail;
  if (view === 'graph') {
    switchView('graph');
    resizeCy();
  } else if (view === 'table') {
    switchView('table');
  }
}

// ── MODEL STATE EVENTS ────────────────────────────────────────────────────────

/** Handles model:empty event — shows empty state DOM. */
function handleModelEmpty() {
  // Graph view may be hidden if not initialized, but table-view should remain accessible
  // (empty table will show no rows). Do not add 'hidden' to #table-view. Also ensure any
  // stray 'hidden' class is removed.
  document.getElementById('cy')?.classList.add('hidden');
  document.getElementById('table-view')?.classList.remove('hidden');
  const emptyMsg = document.getElementById('empty-state-message');
  if (emptyMsg) {
    emptyMsg.classList.remove('hidden');
  } else {
    const msg = document.createElement('div');
    msg.className = 'empty-state-message';
    msg.id = 'empty-state-message';
    document.querySelector('main').append(msg);
  }
}

/** Handles model:loaded event — hides empty state DOM and ensures views are visible. */
function handleModelLoaded() {
  const emptyMsg = document.getElementById('empty-state-message');
  if (emptyMsg) {
    emptyMsg.classList.add('hidden');
  }
  // Ensure views are not left with 'hidden' class from any previous state
  document.getElementById('cy')?.classList.remove('hidden');
  document.getElementById('table-view')?.classList.remove('hidden');
}

// ── INIT ──────────────────────────────────────────────────────────────────────

/**
 * Initializes UI event module: wires all global events and DOM listeners.
 *
 * @param {Function} onRetry - App re-init callback for retry button.
 */
export function init(onRetry) {
  wireSidebarEvents();
  wireTabGroupEvents();
  wireThemeEvents();
  wireToastEvents();
  if (onRetry) {
    wireRetryButtonEvents(onRetry);
  }
  document.addEventListener('view:switchRequest', handleViewSwitchRequest);
  document.addEventListener('model:empty', handleModelEmpty);
  document.addEventListener('model:contentLoaded', handleModelLoaded);

  // Loading events from model loader
  document.addEventListener('loading:show', (e) => {
    showLoading(e.detail.message);
  });
  document.addEventListener('loading:hide', () => {
    hideLoading();
  });
}
