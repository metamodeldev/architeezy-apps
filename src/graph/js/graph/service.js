/**
 * GraphService — Orchestrator: reactive effects + public API.
 *
 * Delegates construction to builder.js, DOM operations to display.js, and pure visibility math to
 * visibility.js.
 *
 * @module graph/service
 * @package
 */

import { consumeSkipLayoutSave, drillDepth, drillNodeId } from '../drill/index.js';
import {
  computeVisRelCounts,
  getActiveElemTypes,
  getActiveRelTypes,
  setScopeElemCounts,
  setVisRelCounts,
  showAllElem,
} from '../filter/index.js';
import { getHighlightEnabled } from '../highlight/index.js';
import { getElemMap, getElements, getRelations, getStatus } from '../model/index.js';
import { elemColor, relColor } from '../palette.js';
import { selectedNodeId, setSelectedNodeId } from '../selection/index.js';
import { computed, effect, signal } from '../signals/index.js';
import { createCytoscapeInstance } from './builder.js';
import { getContainmentMode } from './containment.js';
import { applyLayout, stopLayout, updateStats } from './controls.js';
import { destroyCy, getCy, isGraphLoaded, setCy } from './cy.js';
import {
  applyDisplayState,
  applyFadedClasses,
  clearDrillRootNodes,
  setDrillRootNode,
} from './display.js';
import { bindCyEvents, setupPointerInteractions } from './events.js';
import { clearSavedLayoutState, restoreLayoutState, saveLayoutState } from './layout.js';
import { bindTooltipEvents } from './tooltip.js';
import {
  computeDrillBfs,
  computeDrillScopeIds,
  computeFadedNodeIds,
  computeVisibleNodeIds,
} from './visibility.js';

// ============ DRILL COMPUTED ============

/** Set of all node IDs reachable from drill root (ignores elem type filter). */
export const drillScopeIds = computed(() => {
  const nodeId = drillNodeId.value;
  if (!nodeId) {
    return;
  }
  return computeDrillScopeIds({
    rootId: nodeId,
    drillDepth: drillDepth.value,
    nodes: getElements(),
    edges: getRelations(),
    activeRelTypes: getActiveRelTypes(),
    containmentMode: getContainmentMode(),
  });
});

/** Set of visible node IDs within drill (intersection with elem type filter). */
export const drillVisibleIds = computed(() => {
  const nodeId = drillNodeId.value;
  if (!nodeId) {
    return;
  }
  return computeDrillBfs({
    rootId: nodeId,
    drillDepth: drillDepth.value,
    nodes: getElements(),
    edges: getRelations(),
    activeElemTypes: getActiveElemTypes(),
    activeRelTypes: getActiveRelTypes(),
    containmentMode: getContainmentMode(),
  }).visibleIds;
});

// ============ SCOPE METRICS (written into filter via setters) ============

/**
 * Counts of elements per type within the current drill scope. `undefined` when not in drill mode.
 * Pushed into filter/service.js via setScopeElemCounts so filter doesn't need to import graph.
 */
const _scopeElemCounts = computed(() => {
  const scopeIds = drillScopeIds.value;
  if (!scopeIds) {
    return;
  }
  const counts = {};
  for (const e of getElements()) {
    if (scopeIds.has(e.id)) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
  }
  return counts;
});

/**
 * Counts of visible relationships per type, respecting drill scope and active elem types. Pushed
 * into filter/service.js via setVisRelCounts.
 */
const _visRelCounts = computed(() =>
  computeVisRelCounts({
    allRelations: getRelations(),
    elemMap: getElemMap(),
    activeElemTypes: getActiveElemTypes(),
    drillVisibleIds: drillVisibleIds.value,
  }),
);

// ============ PRIVATE COMPUTED ============

/** Set of node IDs that are currently visible (passed through filters). */
const _visibleNodeIds = computed(() => {
  const allElements = getElements();
  const activeElemTypes = getActiveElemTypes();
  const showAll = showAllElem.value;
  const drillNodeIdVal = drillNodeId.value;
  const drillScopeIdsVal = drillScopeIds.value ?? new Set();
  const highlightEnabled = getHighlightEnabled();
  // Use selectedNodeId as highlight anchor only when highlight is on and not in drill mode.
  const highlightNodeId = highlightEnabled && !drillNodeIdVal ? selectedNodeId.value : undefined;

  return computeVisibleNodeIds({
    allElements,
    activeElemTypes,
    showAll,
    drillNodeId: drillNodeIdVal,
    drillScopeIds: drillScopeIdsVal,
    highlightEnabled,
    highlightNodeId,
  });
});

/** Set of node IDs that should be faded (de-emphasized). */
const _fadedIds = computed(() => {
  const finalVisible = _visibleNodeIds.value;
  const allElements = getElements();
  const activeElemTypes = getActiveElemTypes();
  const drillNodeIdVal = drillNodeId.value;
  const drillDepthVal = drillDepth.value;
  const drillScopeIdsVal = drillScopeIds.value ?? new Set();
  const highlightEnabled = getHighlightEnabled();
  const highlightNodeId = highlightEnabled && !drillNodeIdVal ? selectedNodeId.value : undefined;

  let highlightReachableIds;
  if (highlightEnabled && highlightNodeId) {
    if (drillNodeIdVal) {
      highlightReachableIds = drillVisibleIds.value ?? new Set();
    } else {
      const { visibleIds } = computeDrillBfs({
        rootId: highlightNodeId,
        drillDepth: drillDepthVal,
        nodes: allElements,
        edges: getRelations(),
        activeElemTypes,
        activeRelTypes: getActiveRelTypes(),
        containmentMode: getContainmentMode(),
      });
      highlightReachableIds = visibleIds;
    }
  }

  return computeFadedNodeIds({
    visibleNodeIds: finalVisible,
    highlightEnabled,
    highlightNodeId,
    highlightReachableIds,
    drillNodeId: drillNodeIdVal,
    drillScopeIds: drillScopeIdsVal,
  });
});

/** True once the first Cytoscape graph has been built */
const _isGraphBuilt = signal(false);

// ============ COMPUTED STATE ============

/**
 * The set of element IDs that are currently "visible" based on filters. Excludes elements of
 * inactive types, unless "Show all" is enabled.
 */
export const visibleElementIds = computed(() => {
  const elements = getElements();
  const showAll = showAllElem.value;
  const activeTypes = getActiveElemTypes();

  if (showAll) {
    return new Set(elements.map((e) => e.id));
  }

  return new Set(elements.filter((e) => activeTypes.has(e.type)).map((e) => e.id));
});

/** Combined display state for the graph renderer. Aggregates visibility, fading, and drill scope. */
export const displayState = computed(() => ({
  visibleIds: _visibleNodeIds.value,
  fadedIds: _fadedIds.value,
  drillScope: drillScopeIds.value ?? new Set(),
}));

// ============ EFFECTS (AUTO-UPDATES) ============

const _effects = [];

// ============ ACTIONS ============

/**
 * Rebuilds the Cytoscape graph from current model data.
 *
 * @param {string} containmentMode - Containment mode read from the effect to avoid dangling read.
 */
export function rebuildGraph(containmentMode) {
  const elements = getElements();
  const relations = getRelations();

  if (elements.length === 0) {
    return;
  }

  _isGraphBuilt.value = false;

  buildCytoscape({
    elements,
    relations,
    containmentMode,
  });
}

/** Applies the current display state to the Cytoscape instance. */
export function applyGraphDisplayState() {
  const { visibleIds, fadedIds } = displayState.value;
  const cy = getCy();
  if (!cy) {
    return;
  }

  function isEdgeVisible(srcId, tgtId, type, isContainment) {
    const activeTypes = getActiveRelTypes();
    return (
      visibleIds.has(srcId) && visibleIds.has(tgtId) && (activeTypes.has(type) || isContainment)
    );
  }

  applyDisplayState({
    visibleNodeIds: visibleIds,
    isEdgeVisible,
  });

  applyFadedClasses(
    (nodeId) => fadedIds.has(nodeId),
    (srcId, tgtId) => fadedIds.has(srcId) && fadedIds.has(tgtId),
  );
}

/** Refreshes the graph display without rebuilding. */
export function refreshGraphDisplay() {
  applyGraphDisplayState();
}

// ============ LOW-LEVEL BUILDER ============

/**
 * Builds a new Cytoscape graph instance.
 *
 * @param {Object} params - Configuration object for graph building.
 * @param {Object[]} params.elements - Model elements for nodes.
 * @param {Object[]} params.relations - Model relations for edges.
 * @param {Function} [params.elemColorFn] - Color function for elements.
 * @param {Function} [params.relColorFn] - Color function for relations.
 * @param {string} params.containmentMode - 'edge' or 'compound'.
 * @param {Function} [params.onNodeTap] - Tap handler for nodes.
 * @param {Function} [params.onNodeDblTap] - Double-tap handler for nodes.
 * @param {Function} [params.onCanvasTap] - Click handler for canvas.
 */
export function buildCytoscape({
  elements,
  relations,
  onNodeTap,
  onNodeDblTap,
  onCanvasTap,
  elemColorFn = elemColor,
  relColorFn = relColor,
  containmentMode,
}) {
  if (getCy()) {
    destroyCy();
  }
  clearSavedLayoutState();

  const container = document.getElementById('cy');
  if (!container) {
    console.error('buildCytoscape: container #cy not found');
    return;
  }

  const cy = createCytoscapeInstance({
    container,
    elements,
    relations,
    elemColorFn,
    relColorFn,
    containmentMode,
  });

  setCy(cy);
  bindCyEvents(cy, onNodeTap, onNodeDblTap, onCanvasTap);
  setupPointerInteractions();
  bindTooltipEvents(cy);

  updateStats(elements, relations);
  _isGraphBuilt.value = true;
}

// ============ PRIVATE EFFECT FACTORIES ============

function setupDrillTransitionEffect() {
  let prevDrillNodeId;
  let prevLoaded = false;
  return effect(() => {
    const nodeId = drillNodeId.value;
    const depth = drillDepth.value;
    const loaded = isGraphLoaded();

    const justEntered = !prevDrillNodeId && nodeId;
    const justExited = Boolean(prevDrillNodeId && !nodeId);
    const changedNode = Boolean(nodeId && prevDrillNodeId && prevDrillNodeId !== nodeId);
    const graphJustLoaded = loaded && !prevLoaded;

    if (justEntered) {
      setSelectedNodeId(undefined);
      if (!consumeSkipLayoutSave()) {
        saveLayoutState();
      }
      if (loaded) {
        setDrillRootNode(nodeId);
        updateStats(getElements(), getRelations());
        applyLayout({ preserveViewport: false });
      }
    } else if (justExited) {
      clearDrillRootNodes();
      stopLayout();
      if (!restoreLayoutState()) {
        applyLayout();
      }
    } else if (changedNode) {
      clearDrillRootNodes();
      if (loaded) {
        setDrillRootNode(nodeId);
      }
      applyLayout({ preserveViewport: false });
    } else if (nodeId && graphJustLoaded) {
      // Graph became ready while already in drill (URL-restore scenario)
      setDrillRootNode(nodeId);
      updateStats(getElements(), getRelations());
      applyLayout({ preserveViewport: false });
    } else if (nodeId && depth !== undefined) {
      // Depth changed while in drill
      applyLayout({ preserveViewport: false });
    }

    prevDrillNodeId = nodeId;
    prevLoaded = loaded;
  });
}

// ============ INITIALIZATION ============

let _initialized = false;

/** Initializes the GraphService. Sets up reactive effects. */
export function initializeGraphService() {
  if (_initialized) {
    disposeGraphService();
  }
  _initialized = true;

  _effects.push(
    /** Effect: Rebuild cytoscape graph when model status changes to 'loaded'. */
    effect(() => {
      const status = getStatus();
      const mode = getContainmentMode();
      if (status === 'loaded') {
        rebuildGraph(mode);
      }
    }),

    /** Effect: Automatically apply display state to Cytoscape when it changes. */
    effect(() => {
      if (isGraphLoaded()) {
        applyGraphDisplayState();
      }
    }),

    /** Effect: Rebuild graph when containment mode changes (if model is loaded). */
    effect(() => {
      const mode = getContainmentMode();
      if (isGraphLoaded() && getStatus() === 'loaded') {
        rebuildGraph(mode);
      }
    }),

    // Effect: Manage drill layout transitions (enter, exit, node change, depth change).
    setupDrillTransitionEffect(),

    // Effect: Push scope element counts into filter so filter can show drill-aware UI metrics.
    effect(() => {
      setScopeElemCounts(_scopeElemCounts.value);
    }),

    // Effect: Push visible relationship counts into filter.
    effect(() => {
      setVisRelCounts(_visRelCounts.value);
    }),
  );
}

// ============ CLEANUP ============

/** Disposes the GraphService, releasing all reactive effects. */
export function disposeGraphService() {
  for (const e of _effects) {
    e.dispose();
  }
  _effects.length = 0;
  _initialized = false;
}

/**
 * Returns true once the Cytoscape graph has been built at least once.
 *
 * @returns {boolean} True if graph was built.
 */
export function isGraphBuilt() {
  return _isGraphBuilt.value;
}

export { _isGraphBuilt as graphBuiltSignal };
