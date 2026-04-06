/**
 * DOM rendering and event handling for drill-down mode.
 *
 * @module drill-down/ui
 * @package
 */

import { getAllElements, getAllRelations, getElemMap } from '../model/index.js';
// oxlint-disable-next-line import/no-restricted-imports
import { computeDrillBfs, computeDrillScopeIds } from '../graph/bfs.js';
import {
  clearDrillState,
  getDrillDepth,
  getDrillNodeId,
  getSkipLayoutSave,
  setDrillDepth,
  setDrillNodeId,
  setDrillScopeIds,
  setDrillVisibleIds,
  setSkipLayoutSave,
} from './state.js';
// oxlint-disable-next-line import/no-restricted-imports
import { applyDisplayState, clearFadedClasses } from '../graph/display.js';
// oxlint-disable-next-line import/no-restricted-imports
import { updateStats, stopLayout, applyLayout } from '../graph/controls.js';
// oxlint-disable-next-line import/no-restricted-imports
import { setDrillRootNode } from '../graph/selection.js';
// oxlint-disable-next-line import/no-restricted-imports
import { restoreLayoutState } from '../graph/layout.js';
// oxlint-disable-next-line import/no-restricted-imports
import { getHighlightEnabled, clearHighlightState } from '../highlight/state.js';
import { getActiveElemTypes, getActiveRelTypes } from '../filter/index.js';
import { getContainmentMode } from '../graph/index.js';

// Private state: depth saved before entering drill
let _savedDepthBeforeDrill;
// Cached filter and containment context from event
let _activeElemTypes;
let _activeRelTypes;
let _containmentMode;

// ============ UI RENDERING ============

/**
 * Rebuilds the depth picker buttons (1–5) inside `#depth-picker`.
 *
 * @param {number} drillDepth - The current drill depth to highlight.
 */
export function buildDepthPicker(drillDepth) {
  const picker = document.getElementById('depth-picker');
  if (!picker) {
    return;
  }
  picker.innerHTML = '';
  for (const d of [1, 2, 3, 4, 5]) {
    const btn = document.createElement('button');
    btn.className = `depth-btn${d === drillDepth ? ' active' : ''}`;
    btn.textContent = d;
    btn.dataset.depth = String(d);
    picker.append(btn);
  }
}

/** Restores the drill-root class after graph rebuild. No longer needed - graph listens to drill:entered. */
export function restoreDrillRootStyle() {
  // Graph now listens to drill:entered event and manages drill-root class automatically
  // This function is kept for compatibility but does nothing
}

// ============ EVENT WIRING ============

/**
 * Initializes drill-down module: builds initial depth picker, wires DOM events, and registers
 * global event listeners.
 *
 * Deprecated: module now self-initializes. Kept for backwards compatibility.
 */
export function init() {
  initDrillDown();
}

/**
 * Initializes drill-down module with optional cytoscape reference.
 *
 * @param {Object} [_cy] - Cytoscape instance (for future use in Phase 2).
 */
export function initDrillDown(_cy) {
  buildDepthPicker(getDrillDepth());
  wireDomEvents();
  registerGlobalListeners();
  // Add drill event listeners
  document.addEventListener('drill:entered', onDrillEntered);
  document.addEventListener('drill:exited', onDrillExited);
  // Add graph:nodeDblTap bridge (moved from app.js)
  document.addEventListener('graph:nodeDblTap', (e) => {
    const { nodeId } = e.detail;
    if (getHighlightEnabled()) {
      clearHighlightState();
      clearFadedClasses();
    }
    onNodeDrill(nodeId, {
      activeElemTypes: getActiveElemTypes(),
      activeRelTypes: getActiveRelTypes(),
      containmentMode: getContainmentMode(),
    });
  });
}
function wireDomEvents() {
  const depthPicker = document.getElementById('depth-picker');
  if (depthPicker) {
    depthPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.depth-btn[data-depth]');
      if (!btn) {
        return;
      }
      const newDepth = Number(btn.dataset.depth);
      setDrillDepth(newDepth);
      buildDepthPicker(newDepth);
      handleDepthChange();
    });
  }

  const exitBtn = document.getElementById('drill-exit-btn');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => exitDrill());
  }
}

/** Registers global event listeners (for model:loaded, etc.). */
function registerGlobalListeners() {
  // Listen for connection drill requests from detail panel
  document.addEventListener('detail:connectionDrill', (e) => {
    const { targetId, activeElemTypes, activeRelTypes, containmentMode } = e.detail;
    _activeElemTypes = activeElemTypes;
    _activeRelTypes = activeRelTypes;
    _containmentMode = containmentMode;
    onNodeDrill(targetId);
  });
}

// ============ DRILL ACTIONS ============

/**
 * Enters drill mode on the specified node.
 *
 * @param {string} nodeId - The node ID to drill into.
 * @param {Object} [options] - Optional parameters.
 * @param {boolean} [options.skipUrlSync] - If true, URL will not be updated.
 */
export function onNodeDrill(nodeId, options = {}) {
  // Accept context from caller (navigation/loader). If not provided, use current filter state.
  if (options.activeElemTypes !== undefined) {
    _activeElemTypes = options.activeElemTypes;
    _activeRelTypes = options.activeRelTypes;
    _containmentMode = options.containmentMode;
  } else {
    // Default to currently active filter types and containment mode
    _activeElemTypes = getActiveElemTypes();
    _activeRelTypes = getActiveRelTypes();
    _containmentMode = getContainmentMode();
  }

  // Save layout state before entering (unless skipping for URL deep link)
  if (!getDrillNodeId() && !getSkipLayoutSave()) {
    document.dispatchEvent(new CustomEvent('layout:saveStateRequest'));
  }
  setSkipLayoutSave(false);

  // Save current depth for highlight restoration on exit
  _savedDepthBeforeDrill = getDrillDepth();
  setDrillNodeId(nodeId);

  // Update UI
  const elem = getElemMap()[nodeId];
  const label = elem?.name ?? nodeId;

  const crumbSep = document.getElementById('crumb-entity-sep');
  const drillLabel = document.getElementById('drill-label');
  const settingsDepthRow = document.getElementById('settings-depth-row');

  if (crumbSep) {
    crumbSep.classList.remove('hidden');
  }
  if (drillLabel) {
    drillLabel.textContent = label;
  }
  if (drillLabel) {
    drillLabel.classList.remove('hidden');
  }
  if (settingsDepthRow) {
    settingsDepthRow.classList.remove('hidden');
  }

  buildDepthPicker(getDrillDepth());

  // Apply drill visibility
  applyDrill();

  // Request layout (graph will handle)
  document.dispatchEvent(
    new CustomEvent('layout:request', { detail: { preserveViewport: false } }),
  );

  if (!options.skipUrlSync) {
    document.dispatchEvent(new CustomEvent('routing:sync', { detail: { push: true } }));
  }
}

/**
 * Exits drill mode.
 *
 * @param {Object} [options] - Optional parameters.
 * @param {boolean} [options.skipUrlSync] - If true, URL will not be updated.
 */
export function exitDrill(options = {}) {
  // Restore previous depth for highlight
  if (_savedDepthBeforeDrill !== undefined) {
    setDrillDepth(_savedDepthBeforeDrill);
    _savedDepthBeforeDrill = undefined;
    buildDepthPicker(getDrillDepth());
  }

  // Clear drill state
  clearDrillRootNodes(); // Will be handled by graph event
  clearDrillState();

  // Update UI
  const crumbSep = document.getElementById('crumb-entity-sep');
  const drillLabel = document.getElementById('drill-label');
  const settingsDepthRow = document.getElementById('settings-depth-row');

  if (crumbSep) {
    crumbSep.classList.add('hidden');
  }
  if (drillLabel) {
    drillLabel.classList.add('hidden');
  }
  if (settingsDepthRow) {
    settingsDepthRow.classList.add('hidden');
  }

  // Notify exit
  document.dispatchEvent(new CustomEvent('drill:exited'));

  // Re-apply filter's full visibility (graph:drillExited listeners will handle)
  // No need to dispatch graph:applyVisibility; filter listens to graph:drillExited

  if (!options.skipUrlSync) {
    document.dispatchEvent(new CustomEvent('routing:sync'));
  }
}

/** Handles depth change from picker. */
function handleDepthChange() {
  if (getDrillNodeId()) {
    applyDrill();
    document.dispatchEvent(
      new CustomEvent('drill:depthChanged', { detail: { depth: getDrillDepth() } }),
    );
    document.dispatchEvent(
      new CustomEvent('layout:request', { detail: { preserveViewport: false } }),
    );
    document.dispatchEvent(new CustomEvent('routing:sync'));
  }
}

/**
 * Computes drill visibility and dispatches graph:nodeDrilled (or updates state and notifies). This
 * is separated to allow reuse.
 */
export function applyDrill() {
  const drillNodeId = getDrillNodeId();
  const drillDepth = getDrillDepth();
  if (!drillNodeId) {
    return;
  }

  const nodes = getAllElements();
  const edges = getAllRelations();
  const activeElemTypes = _activeElemTypes;
  const activeRelTypes = _activeRelTypes;
  const containmentMode = _containmentMode;

  // Compute visible nodes with BFS
  const { visibleIds: visible, nodeDepth } = computeDrillBfs({
    rootId: drillNodeId,
    drillDepth,
    nodes,
    edges,
    activeElemTypes,
    activeRelTypes,
    containmentMode,
  });

  setDrillVisibleIds(visible);

  // Compute scope (all nodes within drill radius) for filter dims
  const scopeIds = computeDrillScopeIds({
    rootId: drillNodeId,
    drillDepth,
    nodes,
    edges,
    activeRelTypes,
    containmentMode,
  });
  setDrillScopeIds(scopeIds);

  // Dispatch event for graph to apply display state
  document.dispatchEvent(
    new CustomEvent('drill:entered', {
      detail: {
        nodeId: drillNodeId,
        depth: drillDepth,
        visibleNodeIds: visible,
        nodeDepth: Object.fromEntries(nodeDepth), // Plain object for event
        activeRelTypes: [...activeRelTypes],
        containmentMode,
        scopeIds, // Include drill scope for filter dimming
      },
    }),
  );

  // Dispatch generic state change after a short delay to allow graph to apply
  // (graph will also dispatch graph:stateChange after applying)
  // Not needed here.
}

// Clear drill root class helper; now handled by graph via event
function clearDrillRootNodes() {
  document.dispatchEvent(new CustomEvent('graph:clearDrillRoots'));
}

// Restore drill root style after graph rebuild: graph will handle upon model:loaded if drillNodeId set
// So nothing needed here.

// ============ EVENT HANDLERS ============

/**
 * Handler for drill:entered event. Applies drill visibility to the graph.
 *
 * @param {CustomEvent} e - The event object containing drill parameters.
 */
function onDrillEntered(e) {
  const { nodeId, depth, visibleNodeIds, nodeDepth, activeRelTypes } = e.detail;

  // Ensure only one node has the drill-root class
  setDrillRootNode(nodeId);

  applyDisplayState({
    visibleNodeIds,
    isEdgeVisible: (srcId, tgtId, type, isContainment) => {
      if (!visibleNodeIds.has(srcId) || !visibleNodeIds.has(tgtId)) {
        return false;
      }
      if (!activeRelTypes.includes(type) && !isContainment) {
        return false;
      }
      const dSrc = nodeDepth[srcId] ?? depth;
      const dTgt = nodeDepth[tgtId] ?? depth;
      return Math.min(dSrc, dTgt) < depth;
    },
    forceVisibleId: nodeId,
  });

  updateStats(getAllElements(), getAllRelations());
  document.dispatchEvent(new CustomEvent('graph:visibilityApplied'));
}

/** Handler for drill:exited event. Reverts to filter visibility and restores layout state. */
function onDrillExited() {
  stopLayout();
  const restored = restoreLayoutState();
  if (!restored) {
    applyLayout();
  }
  // Filter will apply its own visibility and then dispatch graph:visibilityApplied
}
