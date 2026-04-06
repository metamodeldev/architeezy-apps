/**
 * HighlightPanelComponent — Highlight mode UI component.
 *
 * @module highlight/component
 * @package
 */

import { setSelectedNodeId } from '../selection/index.js';
import {
  getHighlightEnabled,
  initializeHighlightService,
  saveHighlightStateToStorage,
  setHighlightEnabled,
} from './service.js';

// ============ DOM EVENTS ============

/** Wires the highlight mode toggle switch. */
export function wireHighlightEvents() {
  const highlightToggle = document.getElementById('highlight-toggle');
  if (!highlightToggle) {
    return;
  }

  highlightToggle.checked = getHighlightEnabled();

  highlightToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    setHighlightEnabled(enabled);
    saveHighlightStateToStorage();

    if (!enabled) {
      // Clear selected node so graph computations stop applying highlight fading.
      setSelectedNodeId(undefined);
    }
    // When enabling: selectedNodeId already holds the last tapped node — no action needed.
  });
}

// ============ INITIALIZATION ============

/**
 * Initializes the highlight component.
 *
 * @param {any} _cy - Cytoscape instance (currently unused, for future compatibility).
 */
export function initHighlightComponent(_cy) {
  wireHighlightEvents();
  initializeHighlightService();
}

/**
 * Entry point called from app.js.
 *
 * @param {any} [cy] - Cytoscape instance (unused).
 */
export function init(cy) {
  initHighlightComponent(cy);
}
