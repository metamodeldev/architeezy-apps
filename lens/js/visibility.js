// ── VISIBILITY ──────────────────────────────────────────────────────────────
//
// All logic that decides which Cytoscape elements are shown or hidden lives
// here, separated from the filter-panel UI (filters.js) and the drill-down
// entry/exit flow (drill.js).  Both modules import from this one; this module
// does not import from either of them.

import { state } from './state.js';
import { updateStats } from './graph.js';
import { renderTable } from './table.js';

// ── PRIVATE HELPERS ─────────────────────────────────────────────────────────

/**
 * Counts visible relationships per type.
 * A relationship is "visible" when both its source and target element types are
 * active AND (if drilling) both endpoints are within the drill scope.
 */
function computeVisRelCounts() {
  const counts = {};
  state.allRelations.forEach((r) => {
    if (state.drillVisibleIds && (!state.drillVisibleIds.has(r.source) || !state.drillVisibleIds.has(r.target))) {
      return;
    }
    const srcType = state.elemMap[r.source]?.type;
    const tgtType = state.elemMap[r.target]?.type;
    if (srcType && tgtType && state.activeElemTypes.has(srcType) && state.activeElemTypes.has(tgtType)) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
  });
  return counts;
}

/**
 * Counts elements in the current drill scope per type.
 * Uses drillVisibleIds so the count reflects the BFS result (including type filter).
 */
function computeDrillElemCounts() {
  const counts = {};
  state.allElements.forEach((e) => {
    if (state.drillVisibleIds?.has(e.id)) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
  });
  return counts;
}

// ── PUBLIC: FILTER UI UPDATERS ──────────────────────────────────────────────

/**
 * Refreshes count badges and dim state for element-type filter rows.
 * Dim reflects availability in the current context (drill scope or full model).
 * A type hidden by the user's checkbox is NOT dimmed — it is available, just filtered.
 */
export function updateElemFilterDim() {
  const drillCounts = state.drillNodeId ? computeDrillElemCounts() : undefined;
  document.querySelectorAll('[data-kind="elem"]').forEach((cb) => {
    const type = cb.dataset.type;
    const total = state.elemTypeTotals[type] ?? 0;
    const available = drillCounts ? (drillCounts[type] ?? 0) : total;
    const item = cb.closest('.filter-item');
    const countEl = item?.querySelector('.count');
    if (countEl) {
      countEl.textContent = drillCounts && available !== total ? `${available} / ${total}` : `${total}`;
    }
    item?.classList.toggle('dim', available === 0);
  });
}

/** Refreshes count badges (N / M) and dim state for relationship-type filter rows. */
export function updateRelFilterCounts() {
  const visCounts = computeVisRelCounts();
  document.querySelectorAll('[data-kind="rel"]').forEach((cb) => {
    const type = cb.dataset.type;
    const total = state.relTypeTotals[type] ?? 0;
    const vis = visCounts[type] ?? 0;
    const item = cb.closest('.filter-item');
    const countEl = item?.querySelector('.count');
    if (countEl) {
      countEl.textContent = vis === total ? `${total}` : `${vis} / ${total}`;
    }
    item?.classList.toggle('dim', vis === 0);
  });
}

// ── PUBLIC: VISIBILITY LOGIC ────────────────────────────────────────────────

/**
 * In compound mode, when a child node is hidden its parent membership must be
 * removed (node.move({ parent: null })) so Cytoscape does not collapse the
 * compound container to zero size.  When the child becomes visible again it is
 * restored to its original parent (modelParent data field).
 *
 * @param {function(cytoscape.NodeSingular): boolean} isVisible
 */
export function syncCompoundParents(isVisible) {
  if (state.containmentMode !== 'compound') {
    return;
  }
  state.cy.nodes().forEach((n) => {
    const origParent = n.data('modelParent');
    if (!origParent) {
      return;
    }
    const parentNode = state.cy.$id(origParent);
    const parentOk = parentNode.length && isVisible(parentNode);
    const currentParId = n.parent().length ? n.parent().id() : undefined;
    if (isVisible(n) && parentOk) {
      if (currentParId !== origParent) {
        n.move({ parent: origParent });
      }
    } else {
      if (currentParId !== undefined) {
        // eslint-disable-next-line unicorn/no-null
        n.move({ parent: null });
      }
    }
  });
}

/**
 * Applies full-model visibility: hides nodes/edges whose type is not active,
 * then refreshes filter UI and (if in table view) the table.
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
    state.cy.nodes().forEach((n) => n.style('display', state.activeElemTypes.has(n.data('type')) ? 'element' : 'none'));
    state.cy.edges().forEach((e) => {
      const srcOk = state.activeElemTypes.has(e.source().data('type'));
      const tgtOk = state.activeElemTypes.has(e.target().data('type'));
      const show = e.data('isContainment')
        ? srcOk && tgtOk
        : srcOk && tgtOk && state.activeRelTypes.has(e.data('type'));
      e.style('display', show ? 'element' : 'none');
    });
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
 * - Only type-active nodes (plus the drill-root itself) are added to the visible
 *   set and used as frontier — nodes reachable only via filtered-out types are
 *   excluded because they have no visible path back to the drill-root.
 * - The drill-root is always traversable and always shown, even if its type is filtered.
 *
 * Edge visibility rule (universal):
 * - An edge is shown only when min(depth[src], depth[tgt]) < drillDepth.
 *   This hides "cross-edges" that connect two nodes both sitting on the outer
 *   boundary (depth = drillDepth), which would otherwise clutter the diagram.
 */
export function applyDrill() {
  if (!state.cy || !state.drillNodeId) {
    return;
  }

  // Drill-root is always traversable even if its element type is filtered out.
  function isTypeOk(n) {
    return state.activeElemTypes.has(n.data('type')) || n.id() === state.drillNodeId;
  }

  const visible = new Set([state.drillNodeId]);
  const nodeDepth = new Map([[state.drillNodeId, 0]]);
  let frontier = [state.cy.$id(state.drillNodeId)];

  for (let d = 0; d < state.drillDepth; d++) {
    const next = [];
    frontier.forEach((n) => {
      // One hop: follow active semantic edges + containment edges/compound links.
      let reachable = n
        .connectedEdges()
        .filter((e) => state.activeRelTypes.has(e.data('type')) || e.data('isContainment'))
        .connectedNodes();
      if (state.containmentMode === 'compound') {
        // Compound parent-child is not an edge — traverse explicitly.
        reachable = reachable.union(n.children()).union(n.parent());
      }
      reachable.forEach((nb) => {
        if (!visible.has(nb.id()) && isTypeOk(nb)) {
          visible.add(nb.id());
          nodeDepth.set(nb.id(), d + 1);
          next.push(nb);
        }
      });
    });
    frontier = next;
    if (!frontier.length) {
      break;
    }
  }

  state.drillVisibleIds = visible;

  syncCompoundParents((n) => visible.has(n.id()));
  state.cy.batch(() => {
    state.cy.nodes().forEach((n) => n.style('display', visible.has(n.id()) ? 'element' : 'none'));
    state.cy.edges().forEach((e) => {
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
    });
  });

  // Bypass style has highest priority — guarantee drill-root is visible even
  // if its type was filtered out and the batch above would hide it.
  state.cy.$id(state.drillNodeId).style('display', 'element');

  updateStats();
  updateElemFilterDim();
  updateRelFilterCounts();
  if (state.currentView === 'table') {
    renderTable();
  }
}
