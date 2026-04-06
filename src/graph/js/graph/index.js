/**
 * Graph module public API.
 *
 * Cytoscape instance kept internal.
 *
 * @module graph
 */

import { wireContainmentEvents, setContainmentMode, initContainment, getContainmentMode } from './containment.js';
import {
  wireGraphControlEvents,
  wireKeyboardEvents,
} from './controls.js';
import { buildCytoscape, rebuildGraph } from './core.js';
import { initLayout } from './layout.js';
import { getCy, isGraphLoaded } from './cy.js';
import { initTooltips, isTooltipsEnabled, setTooltipsEnabled } from './tooltip.js';

export { computeDrillBfs, computeDrillScopeIds } from './bfs.js';
export {
  applyLayout,
  fitGraph,
  isLayoutRunning,
  panBy,
  resizeCy,
  stopLayout,
  updateStats,
  wireGraphControlEvents,
  wireKeyboardEvents,
  zoomIn,
  zoomOut,
} from './controls.js';
export { bindNodeInteraction } from './events.js';
export { focusCyNode, getSelectedNodeId, hasGraphNode } from './selection.js';
// Display management (consolidated visibility + state)
export {
  applyDisplayState,
  applyFadedClasses,
  clearFadedClasses,
  getGraphSnapshot,
  getVisibleFadedElements,
  getVisibleElements,
} from './display.js';
export { getCy, isGraphLoaded };
export { getContainmentMode, setContainmentMode } from './containment.js';
export { buildCytoscape, rebuildGraph } from './core.js';
export { cyBg } from './styles.js';
export { initTooltips, isTooltipsEnabled, setTooltipsEnabled };
export { getViewportBounds, refreshEdgeLabelBg } from './utils.js';

// ============ INITIALIZATION ============

/**
 * Initializes the graph module: wires DOM events and registers controller event listeners.
 *
 * This function is called automatically on module load.
 */
export function init() {
  // Set up graph control events (zoom buttons, fit, etc.)
  wireGraphControlEvents();
  // Set up keyboard shortcuts
  wireKeyboardEvents();
  // Set up containment mode change events
  wireContainmentEvents((mode) => {
    setContainmentMode(mode);
    document.dispatchEvent(new CustomEvent('graph:containmentChanged', { detail: { mode } }));
  });
  // Initialize controllers
  initLayout();
  initContainment();

  // Build the graph from the loaded model data
  rebuildGraph(getContainmentMode());

  // Initialize tooltips with the new simplified API
  const cy = getCy();
  if (cy) {
    initTooltips(cy, 'architeezyGraphTooltips');
  }
}

