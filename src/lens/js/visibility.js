// ── VISIBILITY ──────────────────────────────────────────────────────────────
//
// All logic that decides which Cytoscape elements are shown or hidden lives
// Here, separated from the filter-panel UI (filters.js) and the drill-down
// Entry/exit flow (drill.js).  Both modules import from this one; this module
// Does not import from either of them.

import { updateStats } from './graph.js';
import { state } from './state.js';
import { renderTable } from './table.js';

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
 * Counts elements in the current drill scope per type. Uses drillVisibleIds so the count reflects
 * the BFS result (including type filter).
 *
 * @returns {Object<string, number>} Element counts per type within the drill
 * scope.
 */
function computeDrillElemCounts() {
  const counts = {};
  for (const e of state.allElements) {
    if (state.drillVisibleIds?.has(e.id)) {
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
 */
export function updateElemFilterDim() {
  const drillCounts = state.drillNodeId ? computeDrillElemCounts() : undefined;
  for (const el of document.querySelectorAll('[data-kind="elem"]')) {
    const type = el.dataset.type;
    const total = state.elemTypeTotals[type] ?? 0;
    const available = drillCounts ? (drillCounts[type] ?? 0) : total;
    const item = el.closest('.filter-item');
    const countEl = item?.querySelector('.count');
    if (countEl) {
      countEl.textContent =
        drillCounts && available !== total ? `${available} / ${total}` : `${total}`;
    }
    item?.classList.toggle('dim', available === 0);
  }
}

/** Refreshes count badges (N / M) and dim state for relationship-type filter rows. */
export function updateRelFilterCounts() {
  const visCounts = computeVisRelCounts({
    allRelations: state.allRelations,
    elemMap: state.elemMap,
    activeElemTypes: state.activeElemTypes,
    drillVisibleIds: state.drillVisibleIds,
  });
  for (const el of document.querySelectorAll('[data-kind="rel"]')) {
    const type = el.dataset.type;
    const total = state.relTypeTotals[type] ?? 0;
    const vis = visCounts[type] ?? 0;
    const item = el.closest('.filter-item');
    const countEl = item?.querySelector('.count');
    if (countEl) {
      countEl.textContent = vis === total ? `${total}` : `${vis} / ${total}`;
    }
    item?.classList.toggle('dim', vis === 0);
  }
}

// ── PUBLIC: VISIBILITY LOGIC ────────────────────────────────────────────────

/**
 * In compound mode, when a child node is hidden its parent membership must be removed (node.move({
 * parent: null })) so Cytoscape does not collapse the compound container to zero size. When the
 * child becomes visible again it is restored to its original parent (modelParent data field).
 *
 * @param {function(cytoscape.NodeSingular): boolean} isVisible - Predicate returning true when the
 *   node should be visible.
 */
export function syncCompoundParents(isVisible) {
  if (state.containmentMode !== 'compound') {
    return;
  }
  for (const n of state.cy.nodes()) {
    const origParent = n.data('modelParent');
    if (!origParent) {
      continue;
    }
    const parentNode = state.cy.$id(origParent);
    const parentOk = parentNode.length && isVisible(parentNode);
    const currentParId = n.parent().length ? n.parent().id() : undefined;
    if (isVisible(n) && parentOk) {
      if (currentParId !== origParent) {
        n.move({ parent: origParent });
      }
    } else if (currentParId !== undefined) {
      // eslint-disable-next-line unicorn/no-null
      n.move({ parent: null });
    }
  }
}

/**
 * Applies full-model visibility: hides nodes/edges whose type is not active, then refreshes filter
 * UI and (if in table view) the table.
 */
export function applyVisibility() {
  if (!state.cy) {
    return;
  }
  if (state.drillNodeId) {
    applyDrill();
    return;
  }

  syncCompoundParents((n) => state.activeElemTypes.has(n.data('type')));
  state.cy.batch(() => {
    for (const n of state.cy.nodes()) {
      n.style('display', state.activeElemTypes.has(n.data('type')) ? 'element' : 'none');
    }
    for (const e of state.cy.edges()) {
      const srcOk = state.activeElemTypes.has(e.source().data('type'));
      const tgtOk = state.activeElemTypes.has(e.target().data('type'));
      const show = e.data('isContainment')
        ? srcOk && tgtOk
        : srcOk && tgtOk && state.activeRelTypes.has(e.data('type'));
      e.style('display', show ? 'element' : 'none');
    }
  });

  updateStats();
  updateElemFilterDim();
  updateRelFilterCounts();
  if (state.currentView === 'table') {
    renderTable();
  }
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
  if (!state.cy || !state.drillNodeId) {
    return;
  }

  const cyNodes = state.cy.nodes().map((n) => ({
    id: n.id(),
    type: n.data('type'),
    parent: n.parent().id(),
  }));
  const cyEdges = state.cy.edges().map((e) => ({
    id: e.id(),
    type: e.data('type'),
    source: e.source().id(),
    target: e.target().id(),
    isContainment: Boolean(e.data('isContainment')),
  }));

  const { visibleIds: visible, nodeDepth } = computeDrillBfs({
    rootId: state.drillNodeId,
    drillDepth: state.drillDepth,
    nodes: cyNodes,
    edges: cyEdges,
    activeElemTypes: state.activeElemTypes,
    activeRelTypes: state.activeRelTypes,
    containmentMode: state.containmentMode,
  });

  state.drillVisibleIds = visible;

  syncCompoundParents((n) => visible.has(n.id()));
  state.cy.batch(() => {
    for (const n of state.cy.nodes()) {
      n.style('display', visible.has(n.id()) ? 'element' : 'none');
    }
    for (const e of state.cy.edges()) {
      const srcId = e.source().id();
      const tgtId = e.target().id();
      let show = false;
      if (visible.has(srcId) && visible.has(tgtId)) {
        const isRel = state.activeRelTypes.has(e.data('type'));
        const isContainment = e.data('isContainment');
        if (isRel || isContainment) {
          const dSrc = nodeDepth.get(srcId) ?? state.drillDepth;
          const dTgt = nodeDepth.get(tgtId) ?? state.drillDepth;
          show = Math.min(dSrc, dTgt) < state.drillDepth;
        }
      }
      e.style('display', show ? 'element' : 'none');
    }
  });

  // Bypass style has highest priority — guarantee drill-root is visible even
  // If its type was filtered out and the batch above would hide it.
  state.cy.$id(state.drillNodeId).style('display', 'element');

  updateStats();
  updateElemFilterDim();
  updateRelFilterCounts();
  if (state.currentView === 'table') {
    renderTable();
  }
}
