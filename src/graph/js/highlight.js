// ── HIGHLIGHT MODE ─────────────────────────────────────────────────────────────
//
// Manages highlight mode state and applies fading effects to graph elements based on
// BFS traversal from a selected node. Highlight mode uses the same BFS algorithm as
// Drill-down (from visibility.js) ensuring consistent behavior. Instead of hiding
// Non-BFS elements, they are faded (nodes: 0.35 opacity, edges: 0.15 opacity).
//
// Triggered via CustomEvents:
// - 'graph:applyHighlight' when highlight state changes
// App.js wires the event handler to call applyHighlight().

import { getDrillDepth } from './drill.js';
import { getActiveElemTypes, getActiveRelTypes } from './filters.js';
import {
  applyDisplayState,
  getContainmentMode,
  getCy,
  getGraphSnapshot,
  isGraphLoaded,
  updateStats,
} from './graph.js';
import { updateLegendHighlight } from './legend.js';
import { getAllElements, getAllRelations } from './model.js';
import { computeDrillBfs, applyVisibility } from './visibility.js';

// ── HIGHLIGHT STATE ─────────────────────────────────────────────────────────────

/** @type {boolean} Whether highlight mode is enabled */
let _highlightEnabled = false;

/** @type {string | undefined} ID of the node around which highlight is calculated */
let _highlightNodeId;

// Expose for tests
if (typeof globalThis !== 'undefined') {
  globalThis.__highlightNodeId = undefined;
}

export function getHighlightEnabled() {
  return _highlightEnabled;
}

export function setHighlightEnabled(enabled) {
  _highlightEnabled = enabled;
}

export function getHighlightNodeId() {
  return _highlightNodeId;
}

export function setHighlightNodeId(id) {
  _highlightNodeId = id;
  // Expose for tests (like cytoscape instance)
  if (typeof globalThis !== 'undefined') {
    globalThis.__highlightNodeId = id;
  }
}

/** Clears highlight state (node ID). Used when disabling highlight or entering drill. */
export function clearHighlightState() {
  _highlightNodeId = undefined;
  if (typeof globalThis !== 'undefined') {
    globalThis.__highlightNodeId = undefined;
  }
}

// ── PUBLIC: HIGHLIGHT APPLICATION ─────────────────────────────────────────────

/**
 * Applies highlight mode: - All type-active nodes remain visible - The selected node (if its type
 * is filtered) is also visible - Edges are shown if both endpoints are visible and relationship
 * type is active or containment - Nodes and edges NOT within BFS scope from the selected node
 * receive the .faded class
 *
 * When highlight mode is disabled or no node is selected, reverts to normal visibility.
 */
// eslint-disable-next-line max-statements
export function applyHighlight() {
  if (!isGraphLoaded() || !_highlightEnabled) {
    return;
  }

  const cy = getCy();

  // No node selected: revert to normal visibility, clear fading
  if (!_highlightNodeId) {
    applyVisibility();
    clearFadedClasses(cy);
    return;
  }

  const activeElemTypes = getActiveElemTypes();
  const activeRelTypes = getActiveRelTypes();
  const { nodes, edges } = getGraphSnapshot();

  // Compute BFS from the selected node
  const { visibleIds, nodeDepth } = computeDrillBfs({
    rootId: _highlightNodeId,
    drillDepth: getDrillDepth(),
    nodes,
    edges,
    activeElemTypes,
    activeRelTypes,
    containmentMode: getContainmentMode(),
  });

  // Determine which nodes should be displayed: all type-active plus the selected node
  const allElements = getAllElements();
  const displayNodeIds = new Set([
    ...allElements.filter((e) => activeElemTypes.has(e.type)).map((e) => e.id),
    _highlightNodeId,
  ]);

  // Apply display state (visibility) using graph's unified method (includes compound parent sync)
  // Edge visible if both endpoints are displayed and relationship type is active or containment
  applyDisplayState({
    visibleNodeIds: displayNodeIds,
    isEdgeVisible: (srcId, tgtId, type, isContainment) =>
      displayNodeIds.has(srcId) &&
      displayNodeIds.has(tgtId) &&
      (activeRelTypes.has(type) || isContainment),
    // No forceVisible needed since we already added selected to displayNodeIds
  });

  // Apply fading classes to elements that are visible but outside BFS scope
  cy.batch(() => {
    for (const n of cy.nodes()) {
      if (displayNodeIds.has(n.id()) && n.id() !== _highlightNodeId && !visibleIds.has(n.id())) {
        n.addClass('faded');
      } else {
        n.removeClass('faded');
      }
    }
    for (const e of cy.edges()) {
      const srcId = e.source().id();
      const tgtId = e.target().id();
      if (displayNodeIds.has(srcId) && displayNodeIds.has(tgtId)) {
        // Edge is within highlight scope if both endpoints are in the BFS set
        // AND at least one endpoint has depth less than drillDepth (same as drill edge rule)
        const srcInBfs = visibleIds.has(srcId);
        const tgtInBfs = visibleIds.has(tgtId);
        const srcDepth = nodeDepth.get(srcId) ?? getDrillDepth();
        const tgtDepth = nodeDepth.get(tgtId) ?? getDrillDepth();
        const edgeInScope = srcInBfs && tgtInBfs && Math.min(srcDepth, tgtDepth) < getDrillDepth();

        if (!edgeInScope) {
          e.addClass('faded');
        } else {
          e.removeClass('faded');
        }
      } else {
        e.removeClass('faded');
      }
    }
  });

  // Update stats to reflect visible element counts
  updateStats(getAllElements(), getAllRelations());

  // Update legend: darken rows for types where ALL visible nodes/edges are faded
  const visibleNodes = cy.nodes(':visible');
  const visibleEdges = cy.edges(':visible');

  // Collect types that have at least one non-faded visible node/edge
  const activeClearElemTypes = new Set();
  const activeClearRelTypes = new Set();
  for (const n of visibleNodes) {
    if (!n.hasClass('faded')) {
      activeClearElemTypes.add(n.data('type'));
    }
  }
  for (const e of visibleEdges) {
    if (!e.hasClass('faded') && !e.data('isContainment')) {
      activeClearRelTypes.add(e.data('type'));
    }
  }

  // A type is "fully faded" if it has visible nodes/edges but none are clear
  const fadedElemTypes = new Set();
  const fadedRelTypes = new Set();
  for (const n of visibleNodes) {
    const type = n.data('type');
    if (type && !activeClearElemTypes.has(type)) {
      fadedElemTypes.add(type);
    }
  }
  for (const e of visibleEdges) {
    const type = e.data('type');
    if (type && !e.data('isContainment') && !activeClearRelTypes.has(type)) {
      fadedRelTypes.add(type);
    }
  }

  updateLegendHighlight(fadedElemTypes, fadedRelTypes);
}

/**
 * Removes all .faded classes from visible elements, restoring full opacity.
 *
 * @param {cytoscape.Core} cy - Cytoscape instance.
 */
export function clearFadedClasses(cy) {
  cy.nodes().removeClass('faded');
  cy.edges().removeClass('faded');
  updateLegendHighlight(new Set(), new Set());
}
