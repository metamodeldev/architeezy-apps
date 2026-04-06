/**
 * Event wiring for highlight mode.
 *
 * Node tap handlers and toggle switch.
 *
 * @module highlight/ui
 * @package
 */

import { getDrillNodeId } from '../drill-down/index.js';
import {
  bindNodeInteraction,
  clearFadedClasses,
  getSelectedNodeId,
  isGraphLoaded,
} from '../graph/index.js';
import { applyHighlight } from './apply.js';
import {
  clearHighlightState,
  getHighlightEnabled,
  getHighlightNodeId,
  setHighlightEnabled,
  setHighlightNodeId,
} from './state.js';

/**
 * Registers tap/select handlers on graph nodes to trigger highlight when enabled. Call this after
 * each graph rebuild.
 */
export function bindHighlightEvents() {
  bindNodeInteraction((nodeId) => {
    if (!getHighlightEnabled() || getDrillNodeId()) {
      return;
    }
    setHighlightNodeId(nodeId);
    applyHighlight();
  });
}

/** Wires the highlight mode toggle switch. */
export function wireHighlightEvents() {
  const highlightToggle = document.getElementById('highlight-toggle');
  const savedHighlightEnabled = localStorage.getItem('architeezyGraphHighlightEnabled') === 'true';
  highlightToggle.checked = savedHighlightEnabled;
  setHighlightEnabled(savedHighlightEnabled);

  highlightToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    setHighlightEnabled(enabled);
    localStorage.setItem('architeezyGraphHighlightEnabled', enabled);
    if (enabled) {
      let currentHighlightId = getHighlightNodeId();
      if (!currentHighlightId && !getDrillNodeId()) {
        const selectedId = getSelectedNodeId();
        if (selectedId) {
          currentHighlightId = selectedId;
          setHighlightNodeId(currentHighlightId);
        }
      }
      if (currentHighlightId && !getDrillNodeId()) {
        applyHighlight();
      }
    } else {
      clearHighlightState();
      document.dispatchEvent(new CustomEvent('highlight:cleared'));
      clearFadedClasses();
    }
    document.dispatchEvent(new CustomEvent('routing:sync'));
  });

  document.addEventListener('graph:canvasTap', () => {
    if (getHighlightEnabled() && !getDrillNodeId()) {
      clearHighlightState();
      document.dispatchEvent(new CustomEvent('highlight:cleared'));
      clearFadedClasses();
    }
  });
}

/** Initializes highlight module: wires DOM events, registers global event listeners.
 * @deprecated Module now self-initializes via initHighlight().
 */
export function init() {
  // Backward compatibility: delegate to initHighlight
  initHighlight();
}

/** Initializes highlight module.
 * @param {any} _cy - Cytoscape instance (may be used in future)
 */
export function initHighlight(_cy) {
  wireHighlightEvents();
  document.addEventListener('model:contentLoaded', bindHighlightEvents);
  document.addEventListener('graph:containmentChanged', bindHighlightEvents);
  // If the graph is already loaded (initial load), bind highlight events immediately
  if (isGraphLoaded()) {
    bindHighlightEvents();
  }
}
