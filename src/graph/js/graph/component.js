/**
 * GraphComponent - Mounts and manages the Cytoscape graph instance.
 *
 * Handles: - Mounting Cytoscape to the DOM container - Subscribing to GraphService display state
 * changes and applying them - Setting up node interaction handlers (tap, double-tap) - Lifecycle
 * (mount/unmount)
 *
 * @module graph/component
 * @package
 */

import { onNodeDrill } from '../drill/index.js';
import { getActiveRelTypes } from '../filter/index.js';
import { getElements, getRelations } from '../model/index.js';
import { setSelectedEdgeId, setSelectedNodeId } from '../selection/index.js';
import { effect } from '../signals/index.js';
import { updateStats } from './controls.js';
import { destroyCy, getCy } from './cy.js';
import { applyDisplayState, applyFadedClasses } from './display.js';
import { updateLegend } from './legend.js';
import { displayState } from './service.js';

// ── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * Mounts the graph component.
 *
 * Sets up reactive display updates and node interaction handlers. Should be called once during app
 * initialization after GraphService is initialized.
 *
 * @returns {Object} Disposable controller with dispose() method.
 */
export function mountGraphComponent() {
  // Track the last cy instance to wire node interactions only when cy is (re)created.
  // This allows mountGraphComponent() to be called safely at boot before cy exists.
  let lastCy;

  const disposeDisplay = effect(() => {
    const state = displayState.value;
    const cy = getCy();
    if (cy) {
      if (cy !== lastCy) {
        lastCy = cy;
        setupNodeInteractions();
      }
      applyGraphDisplayStateToCy(state);
      updateLegend();
      updateStats(getElements(), getRelations());
    }
  });

  return {
    dispose() {
      disposeDisplay();
      destroyCy();
    },
  };
}

// ── INTERNAL HELPERS ───────────────────────────────────────────────────────────

/**
 * Applies the given display state to the Cytoscape instance.
 *
 * @param {object} state - Display state
 * @param {Set<string>} state.visibleIds - Set of visible node IDs
 * @param {Set<string>} state.fadedIds - Set of faded node IDs
 */
function applyGraphDisplayStateToCy(state) {
  const { visibleIds, fadedIds } = state;
  const cy = getCy();
  if (!cy) {
    return;
  }

  // Edge visibility predicate: visible if both endpoints visible and relationship type active (or containment)
  /**
   * Determines if an edge should be visible.
   *
   * @param {string} srcId - Source node ID.
   * @param {string} tgtId - Target node ID.
   * @param {string} type - Relationship type.
   * @param {boolean} isContainment - Whether the edge represents a containment relationship.
   * @returns {boolean} True if the edge should be visible.
   */
  function isEdgeVisible(srcId, tgtId, type, isContainment) {
    const activeRelTypes = getActiveRelTypes();
    return (
      visibleIds.has(srcId) && visibleIds.has(tgtId) && (activeRelTypes.has(type) || isContainment)
    );
  }

  // Apply node/edge visibility
  applyDisplayState({
    visibleNodeIds: visibleIds,
    isEdgeVisible,
  });

  // Apply fading classes
  applyFadedClasses(
    (nodeId) => fadedIds.has(nodeId),
    (srcId, tgtId) => fadedIds.has(srcId) && fadedIds.has(tgtId),
  );
}

/**
 * Sets up node interaction event handlers on the current Cytoscape instance.
 *
 * Wires node tap, double-tap, and canvas tap events. Called each time a new cy instance is created.
 */
function setupNodeInteractions() {
  const cy = getCy();
  if (!cy) {
    return;
  }

  // Node single tap: update selected node signal, clear edge selection
  cy.on('tap', 'node', (e) => {
    setSelectedEdgeId(undefined);
    setSelectedNodeId(e.target.id());
  });

  // Edge tap: update selected edge signal, clear node selection
  cy.on('tap', 'edge', (e) => {
    setSelectedNodeId(undefined);
    setSelectedEdgeId(e.target.id());
  });

  // Node double tap: update selection and start drill-down
  cy.on('dbltap', 'node', (e) => {
    const nodeId = e.target.id();
    setSelectedEdgeId(undefined);
    setSelectedNodeId(nodeId);
    onNodeDrill(nodeId);
  });

  // Canvas tap: clear selection (graph fading clears automatically via selectedNodeId → undefined)
  cy.on('tap', (e) => {
    if (e.target === cy) {
      setSelectedNodeId(undefined);
      setSelectedEdgeId(undefined);
    }
  });
}
