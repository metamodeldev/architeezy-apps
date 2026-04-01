// ── VISIBILITY ──────────────────────────────────────────────────────────────
//
// All logic that decides which Cytoscape elements are shown or hidden lives
// Here, separated from the filter-panel UI (filters.js) and the drill-down
// Entry/exit flow (drill.js). This module reads state from those modules
// (one-way). drill.js and filters.js trigger updates via CustomEvents wired
// In app.js — no reverse import.

import {
  getDrillDepth,
  getDrillNodeId,
  getDrillVisibleIds,
  setDrillVisibleIds,
  getDrillScopeIds,
  setDrillScopeIds,
} from './drill.js';
import {
  getActiveElemTypes,
  getActiveRelTypes,
  getElemTypeTotals,
  getRelTypeTotals,
  getShowAllElem,
  getShowAllRel,
} from './filters.js';
import {
  applyDisplayState,
  getContainmentMode,
  getGraphSnapshot,
  isGraphLoaded,
  updateStats,
} from './graph.js';
import { getAllElements, getAllRelations, getElemMap } from './model.js';
import { renderTable } from './table.js';
import { getCurrentView } from './ui.js';

// ── PURE HELPERS (exported for unit tests) ──────────────────────────────────

/**
 * Pure: counts visible relationships per type. A relation is counted when both source/target
 * element types are active AND (when drillVisibleIds is provided) both endpoints are in the drill
 * scope.
 *
 * @param {{
 *   allRelations: object[];
 *   elemMap: object;
 *   activeElemTypes: Set<string>;
 *   drillVisibleIds?: Set<string>;
 * }} params
 *   - State snapshot used to compute counts.
 * @returns {Object<string, number>} Counts of visible relations keyed by type.
 */
export function computeVisRelCounts({ allRelations, elemMap, activeElemTypes, drillVisibleIds }) {
  const counts = {};
  for (const r of allRelations) {
    if (drillVisibleIds && (!drillVisibleIds.has(r.source) || !drillVisibleIds.has(r.target))) {
      continue;
    }
    const srcType = elemMap[r.source]?.type;
    const tgtType = elemMap[r.target]?.type;
    if (srcType && tgtType && activeElemTypes.has(srcType) && activeElemTypes.has(tgtType)) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
  }
  return counts;
}

function buildBfsAdjacencyList(edges) {
  const adj = new Map();
  for (const e of edges) {
    if (!adj.has(e.source)) {
      adj.set(e.source, []);
    }
    if (!adj.has(e.target)) {
      adj.set(e.target, []);
    }
    adj
      .get(e.source)
      .push({ neighborId: e.target, type: e.type, isContainment: Boolean(e.isContainment) });
    adj
      .get(e.target)
      .push({ neighborId: e.source, type: e.type, isContainment: Boolean(e.isContainment) });
  }
  return adj;
}

function buildChildrenIndex(nodes) {
  const childrenOf = new Map();
  for (const n of nodes) {
    if (n.parent) {
      if (!childrenOf.has(n.parent)) {
        childrenOf.set(n.parent, []);
      }
      childrenOf.get(n.parent).push(n.id);
    }
  }
  return childrenOf;
}

/**
 * Pure: BFS from a drill-root node returning the set of visible node IDs and each node's BFS depth.
 *
 * Traversal rules: - Only type-active nodes (plus the root itself) enter the visible set and the
 * frontier. - The root is always traversable even when its type is filtered out. - Edges followed:
 * those in activeRelTypes OR containment edges. - In compound mode, parent↔child links are also
 * traversed.
 *
 * @param {{
 *   rootId: string;
 *   drillDepth: number;
 *   nodes: { id: string; type: string; parent?: string }[];
 *   edges: {
 *     id: string;
 *     type: string;
 *     source: string;
 *     target: string;
 *     isContainment?: boolean;
 *   }[];
 *   activeElemTypes: Set<string>;
 *   activeRelTypes: Set<string>;
 *   containmentMode: string;
 * }} params
 *   - BFS configuration including the root node and visibility constraints.
 * @returns {{ visibleIds: Set<string>; nodeDepth: Map<string, number> }} The BFS result with
 *   visible node IDs and depths.
 */
export function computeDrillBfs({
  rootId,
  drillDepth,
  nodes,
  edges,
  activeElemTypes,
  activeRelTypes,
  containmentMode,
}) {
  const adj = buildBfsAdjacencyList(edges);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = buildChildrenIndex(nodes);

  function isTypeOk(nodeId) {
    return activeElemTypes.has(nodeById.get(nodeId)?.type) || nodeId === rootId;
  }

  function addCompoundNeighbors(nodeId, reachable) {
    const node = nodeById.get(nodeId);
    if (node?.parent) {
      reachable.add(node.parent);
    }
    for (const childId of childrenOf.get(nodeId) ?? []) {
      reachable.add(childId);
    }
  }

  const visible = new Set([rootId]);
  const nodeDepth = new Map([[rootId, 0]]);
  let frontier = [rootId];

  for (let d = 0; d < drillDepth; d++) {
    const next = [];
    for (const nodeId of frontier) {
      const reachable = new Set();
      for (const { neighborId, type, isContainment } of adj.get(nodeId) ?? []) {
        if (activeRelTypes.has(type) || isContainment) {
          reachable.add(neighborId);
        }
      }
      if (containmentMode === 'compound') {
        addCompoundNeighbors(nodeId, reachable);
      }
      for (const neighborId of reachable) {
        if (!visible.has(neighborId) && isTypeOk(neighborId)) {
          visible.add(neighborId);
          nodeDepth.set(neighborId, d + 1);
          next.push(neighborId);
        }
      }
    }
    frontier = next;
    if (!frontier.length) {
      break;
    }
  }

  return { visibleIds: visible, nodeDepth };
}

/**
 * Pure: BFS from a drill-root node returning the set of node IDs that are within the drill spatial
 * scope, **ignoring entity type filters**. This is used to compute "Available" counts for entity
 * types in the filter list while in drill-down mode.
 *
 * Traversal rules similar to computeDrillBfs, but **does not filter nodes by entity type** — all
 * nodes reachable within depth limit are included, regardless of their type.
 *
 * @param {{
 *   rootId: string;
 *   drillDepth: number;
 *   nodes: { id: string; type: string; parent?: string }[];
 *   edges: {
 *     id: string;
 *     type: string;
 *     source: string;
 *     target: string;
 *     isContainment?: boolean;
 *   }[];
 *   activeRelTypes: Set<string>;
 *   containmentMode: string;
 * }} params
 *   - Configuration object for drill scope computation.
 * @returns {Set<string>} Set of node IDs within the drill scope.
 */
function computeDrillScopeIds({
  rootId,
  drillDepth,
  nodes,
  edges,
  activeRelTypes,
  containmentMode,
}) {
  const adj = buildBfsAdjacencyList(edges);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = buildChildrenIndex(nodes);

  const visible = new Set([rootId]);
  let frontier = [rootId];

  for (let d = 0; d < drillDepth; d++) {
    const next = [];
    for (const nodeId of frontier) {
      const reachable = new Set();
      for (const { neighborId, type, isContainment } of adj.get(nodeId) ?? []) {
        if (activeRelTypes.has(type) || isContainment) {
          reachable.add(neighborId);
        }
      }
      if (containmentMode === 'compound') {
        // Add parent and children for compound nesting
        const node = nodeById.get(nodeId);
        if (node?.parent) {
          reachable.add(node.parent);
        }
        for (const childId of childrenOf.get(nodeId) ?? []) {
          reachable.add(childId);
        }
      }
      for (const neighborId of reachable) {
        if (!visible.has(neighborId)) {
          visible.add(neighborId);
          next.push(neighborId);
        }
      }
    }
    frontier = next;
    if (!frontier.length) {
      break;
    }
  }

  return visible;
}

/**
 * Pure: counts elements in the drill scope per type.
 *
 * @param {Array} allElements - All model elements.
 * @param {Set<string> | undefined} drillVisibleIds - Visible node IDs in drill scope.
 * @returns {Object<string, number>} Element counts per type within the drill scope.
 */
function computeDrillElemCounts(allElements, drillVisibleIds) {
  const counts = {};
  for (const e of allElements) {
    if (drillVisibleIds?.has(e.id)) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
  }
  return counts;
}

// ── PUBLIC: FILTER UI UPDATERS ──────────────────────────────────────────────

/**
 * Refreshes count badges and dim state for element-type filter rows. Dim reflects availability in
 * the current context (drill scope or full model). A type hidden by the user's checkbox is NOT
 * dimmed — it is available, just filtered.
 *
 * In drill-down mode, the "available" count for entity types is based on the **drill spatial
 * scope** (all nodes reachable within depth, ignoring entity type filters), not on the currently
 * visible nodes. This ensures that unchecking a type does not change its count.
 */
export function updateElemFilterDim() {
  let elemCounts;
  if (getDrillNodeId()) {
    const scopeIds = getDrillScopeIds();
    elemCounts = scopeIds ? computeDrillElemCounts(getAllElements(), scopeIds) : undefined;
  } else {
    elemCounts = undefined;
  }
  const showAll = getShowAllElem();
  const searchInput = document.getElementById('elem-filter-search');
  const searchActive = searchInput && searchInput.value.trim() !== '';
  for (const el of document.querySelectorAll('[data-kind="elem"]')) {
    const type = el.dataset.type;
    const total = getElemTypeTotals()[type] ?? 0;
    const available = elemCounts ? (elemCounts[type] ?? 0) : total;
    const item = el.closest('.filter-item');
    const countEl = item?.querySelector('.count');
    if (countEl) {
      countEl.textContent =
        elemCounts && available !== total ? `${available} / ${total}` : `${total}`;
    }
    const checked = el.checked;
    item?.classList.toggle('dim', available === 0);
    // Only apply availability-based hiding when search is not active.
    if (!searchActive) {
      item?.classList.toggle('hidden', available === 0 && !checked && !showAll);
    }
  }
}

/** Refreshes count badges (N / M) and dim state for relationship-type filter rows. */
export function updateRelFilterCounts() {
  const activeRelTypes = getActiveRelTypes();
  const visCounts = computeVisRelCounts({
    allRelations: getAllRelations(),
    elemMap: getElemMap(),
    activeElemTypes: getActiveElemTypes(),
    drillVisibleIds: getDrillVisibleIds(),
  });
  const showAll = getShowAllRel();
  const searchInput = document.getElementById('rel-filter-search');
  const searchActive = searchInput && searchInput.value.trim() !== '';
  for (const el of document.querySelectorAll('[data-kind="rel"]')) {
    const type = el.dataset.type;
    const total = getRelTypeTotals()[type] ?? 0;
    const vis = visCounts[type] ?? 0;
    const item = el.closest('.filter-item');
    const countEl = item?.querySelector('.count');
    if (countEl) {
      countEl.textContent = vis === total ? `${total}` : `${vis} / ${total}`;
    }
    const isActive = activeRelTypes.has(type);
    item?.classList.toggle('dim', vis === 0 && isActive);
    // Only apply availability-based hiding when search is not active.
    if (!searchActive) {
      item?.classList.toggle('hidden', vis === 0 && !isActive && !showAll);
    }
  }
}

// ── PUBLIC: VISIBILITY LOGIC ────────────────────────────────────────────────

/**
 * Applies full-model visibility: hides nodes/edges whose type is not active, then refreshes filter
 * UI and (if in table view) the table.
 */
export function applyVisibility() {
  if (!isGraphLoaded()) {
    return;
  }
  if (getDrillNodeId()) {
    applyDrill();
    return;
  }

  const activeElemTypes = getActiveElemTypes();
  const activeRelTypes = getActiveRelTypes();
  const elemMap = getElemMap();
  const visibleNodeIds = new Set(
    getAllElements()
      .filter((e) => activeElemTypes.has(e.type))
      .map((e) => e.id),
  );

  if (getContainmentMode() === 'compound') {
    for (const e of getAllElements()) {
      if (e.parent && !visibleNodeIds.has(e.id) && !visibleNodeIds.has(e.parent)) {
        visibleNodeIds.add(e.id);
      }
    }
  }

  applyDisplayState({
    visibleNodeIds,
    isEdgeVisible: (srcId, tgtId, type, isContainment) => {
      const srcType = elemMap[srcId]?.type;
      const tgtType = elemMap[tgtId]?.type;
      const srcOk = srcType !== undefined && activeElemTypes.has(srcType);
      const tgtOk = tgtType !== undefined && activeElemTypes.has(tgtType);
      return isContainment ? srcOk && tgtOk : srcOk && tgtOk && activeRelTypes.has(type);
    },
  });

  updateStats(getAllElements(), getAllRelations());
  updateElemFilterDim();
  updateRelFilterCounts();
  if (getCurrentView() === 'table') {
    renderTable();
  }
  globalThis.updateExportButtonState?.();
  globalThis.updateLegend?.();
}

/**
 * Applies drill-down visibility using a BFS from the drill-root.
 *
 * BFS rules:
 *
 * - Only type-active nodes (plus the drill-root itself) are added to the visible set and used as
 *   frontier — nodes reachable only via filtered-out types are excluded because they have no
 *   visible path back to the drill-root.
 * - The drill-root is always traversable and always shown, even if its type is filtered.
 *
 * Edge visibility rule (universal):
 *
 * - An edge is shown only when min(depth[src], depth[tgt]) < drillDepth. This hides "cross-edges"
 *   that connect two nodes both sitting on the outer boundary (depth = drillDepth), which would
 *   otherwise clutter the diagram.
 */
export function applyDrill() {
  const drillNodeId = getDrillNodeId();
  const drillDepth = getDrillDepth();
  if (!isGraphLoaded() || !drillNodeId) {
    return;
  }

  const { nodes, edges } = getGraphSnapshot();
  const activeRelTypes = getActiveRelTypes();
  const containmentMode = getContainmentMode();

  // Compute visible nodes considering entity type filters
  const { visibleIds: visible, nodeDepth } = computeDrillBfs({
    rootId: drillNodeId,
    drillDepth,
    nodes,
    edges,
    activeElemTypes: getActiveElemTypes(),
    activeRelTypes,
    containmentMode,
  });

  setDrillVisibleIds(visible);

  // Compute the full drill scope (spatial extent) ignoring entity type filters.
  // This is used for accurate "Available" counts in the filter list.
  const scopeIds = computeDrillScopeIds({
    rootId: drillNodeId,
    drillDepth,
    nodes,
    edges,
    activeRelTypes,
    containmentMode,
  });
  setDrillScopeIds(scopeIds);

  applyDisplayState({
    visibleNodeIds: visible,
    isEdgeVisible: (srcId, tgtId, type, isContainment) => {
      if (!visible.has(srcId) || !visible.has(tgtId)) {
        return false;
      }
      if (!activeRelTypes.has(type) && !isContainment) {
        return false;
      }
      const dSrc = nodeDepth.get(srcId) ?? drillDepth;
      const dTgt = nodeDepth.get(tgtId) ?? drillDepth;
      return Math.min(dSrc, dTgt) < drillDepth;
    },
    forceVisibleId: drillNodeId,
  });

  updateStats(getAllElements(), getAllRelations());
  updateElemFilterDim();
  updateRelFilterCounts();
  if (getCurrentView() === 'table') {
    renderTable();
  }
  globalThis.updateExportButtonState?.();
  globalThis.updateLegend?.();
}
