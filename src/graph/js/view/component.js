/**
 * View component.
 *
 * Owns DOM switching between graph and table views, and wires the tab group buttons. Full DOM
 * switching logic moved here from ui/view.js (Phase 4).
 *
 * @module view/component
 */

import {
  applyLayout,
  getCy,
  getLegendEnabled,
  isLayoutApplied,
  markLayoutApplied,
  resizeCy,
  setLegendEnabled,
} from '../graph/index.js';
import { pushState as pushRouterState } from '../router/index.js';
import { selectedNodeId } from '../selection/index.js';
import { currentView, setCurrentView } from './service.js';

// ── VIEW SWITCHING ────────────────────────────────────────────────────────────

/**
 * Switches between the graph and table views. Updates tab button active states and element
 * visibility. The legend is only visible in graph view.
 *
 * @param {'graph' | 'table'} view - Target view.
 * @param {Function | null} [afterSwitch] - Optional callback invoked after switching to table view.
 * @param {boolean} [push] - If true, creates a new history entry (pushState). Defaults to false.
 */
export function switchView(view, afterSwitch, push = false) {
  if (push) {
    pushRouterState({ view: view === 'graph' ? undefined : 'table' });
  }

  setCurrentView(view);
  const g = view === 'graph';

  document.getElementById('tab-graph').classList.toggle('active', g);
  document.getElementById('tab-table').classList.toggle('active', !g);
  document.getElementById('cy').classList.toggle('hidden', !g);
  document.getElementById('cy-controls').classList.toggle('hidden', !g);
  const tableView = document.getElementById('table-view');
  if (tableView) {
    tableView.classList.remove('hidden');
    tableView.classList.toggle('visible', !g);
  }

  if (g) {
    requestAnimationFrame(() => {
      const cy = getCy();
      if (cy) {
        cy.resize();
        if (!isLayoutApplied()) {
          markLayoutApplied();
          applyLayout();
        }
        const id = selectedNodeId.value;
        if (id) {
          cy.$id(id).select();
        }
      }
    });
  }

  const legendEl = document.getElementById('graph-legend');
  if (legendEl) {
    if (g) {
      setLegendEnabled(getLegendEnabled());
    } else {
      legendEl.classList.add('hidden');
    }
  }

  if (!g && afterSwitch) {
    afterSwitch();
  }
}

export { currentView };

// ── URL RESTORE ───────────────────────────────────────────────────────────────

/**
 * Applies view state from URL parameters.
 *
 * @param {string | undefined} view - View name from URL ('table', 'graph', or undefined).
 */
export function restoreFromUrl(view = 'graph') {
  if (view !== currentView.value) {
    switchView(view);
    if (view === 'graph') {
      resizeCy();
    }
  }
}

// ── EVENT WIRING ──────────────────────────────────────────────────────────────

/** Wires the graph/table view tab group. */
export function wireTabGroupEvents() {
  document.querySelector('.tab-group').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn[data-view]');
    if (!btn) {
      return;
    }
    const view = btn.dataset.view;
    if (view === 'graph') {
      switchView('graph', undefined, true);
      resizeCy();
    } else {
      switchView('table', undefined, true);
    }
  });
}

// ── MODEL STATE HANDLERS ──────────────────────────────────────────────────────

/** Handles empty model state — shows empty state DOM. */
export function handleModelEmpty() {
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

/** Handles model loaded — hides empty state DOM and restores the correct view. */
export function handleModelLoaded() {
  const emptyMsg = document.getElementById('empty-state-message');
  if (emptyMsg) {
    emptyMsg.classList.add('hidden');
  }
  switchView(currentView.value);
}
