// ── FILTERS ────────────────────────────────────────────────────────────────

import { state } from "./state.js";
import { elemColor, relColor, escHtml } from "./utils.js";
import { updateStats } from "./graph.js";
import { renderTable } from "./table.js";
import { syncUrl } from "./routing.js";

export function buildFilters() {
  const ec = {};
  state.allElements.forEach((e) => {
    ec[e.type] = (ec[e.type] ?? 0) + 1;
  });
  state.elemTypeTotals = { ...ec };

  // Count only relations whose both endpoints are graph nodes
  const elemIds = new Set(state.allElements.map((e) => e.id));
  const rc = {};
  state.allRelations.forEach((r) => {
    if (elemIds.has(r.source) && elemIds.has(r.target)) rc[r.type] = (rc[r.type] ?? 0) + 1;
  });
  state.relTypeTotals = { ...rc };

  state.activeElemTypes = new Set(Object.keys(ec));
  state.activeRelTypes = new Set(Object.keys(rc));

  renderFilterList("elem", ec, elemColor);
  renderFilterList("rel", rc, relColor);
}

// Visible relation count per type: both endpoint element types active (and in drill scope if active)
function computeVisRelCounts() {
  const counts = {};
  state.allRelations.forEach((r) => {
    if (
      state.drillVisibleIds &&
      (!state.drillVisibleIds.has(r.source) || !state.drillVisibleIds.has(r.target))
    )
      return;
    const srcType = state.elemMap[r.source]?.type;
    const tgtType = state.elemMap[r.target]?.type;
    if (
      srcType &&
      tgtType &&
      state.activeElemTypes.has(srcType) &&
      state.activeElemTypes.has(tgtType)
    )
      counts[r.type] = (counts[r.type] ?? 0) + 1;
  });
  return counts;
}

// Elements in the current drill scope per type — ignores active-type filter.
// Used for count badges: shows how many elements of each type are reachable in the drill
// scope regardless of whether the type is currently checked, so unchecking a type does
// not reset the badge to 0.
function computeDrillElemCounts() {
  const counts = {};
  state.allElements.forEach((e) => {
    if (state.drillVisibleIds && state.drillVisibleIds.has(e.id))
      counts[e.type] = (counts[e.type] ?? 0) + 1;
  });
  return counts;
}

// Update element-type filter rows: N/M count badges and dim state.
// Dim reflects availability in the current context (drill scope or full model),
// NOT filter state — a type hidden by the user's checkbox is not dimmed.
export function updateElemFilterDim() {
  const drillCounts = state.drillNodeId ? computeDrillElemCounts() : null;
  document.querySelectorAll('[data-kind="elem"]').forEach((cb) => {
    const type = cb.dataset.type;
    const total = state.elemTypeTotals[type] ?? 0;
    const available = drillCounts ? (drillCounts[type] ?? 0) : total;
    const item = cb.closest(".filter-item");
    const countEl = item?.querySelector(".count");
    if (countEl) {
      countEl.textContent =
        drillCounts && available !== total ? `${available} / ${total}` : `${total}`;
    }
    item?.classList.toggle("dim", available === 0);
  });
}

// Update relationship filter counts (N / M) and dim rows with 0 visible
export function updateRelFilterCounts() {
  const visCounts = computeVisRelCounts();
  document.querySelectorAll('[data-kind="rel"]').forEach((cb) => {
    const type = cb.dataset.type;
    const total = state.relTypeTotals[type] ?? 0;
    const vis = visCounts[type] ?? 0;
    const item = cb.closest(".filter-item");
    const countEl = item?.querySelector(".count");
    if (countEl) countEl.textContent = vis === total ? `${total}` : `${vis} / ${total}`;
    item?.classList.toggle("dim", vis === 0);
  });
}

function renderFilterList(kind, counts, colorFn) {
  const container = document.getElementById(`${kind}-filter-list`);
  container.innerHTML = "";
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const item = document.createElement("label");
      item.className = "filter-item";
      item.innerHTML = `
      <input type="checkbox" checked data-kind="${kind}" data-type="${escHtml(type)}">
      <span class="dot" style="background:${colorFn(type)}"></span>
      <span class="item-label" title="${escHtml(type)}">${escHtml(type)}</span>
      <span class="count">${count}</span>`;
      item.querySelector("input").addEventListener("change", onFilterChange);
      container.appendChild(item);
    });
}

function onFilterChange(e) {
  const { kind, type } = e.target.dataset;
  const set = kind === "elem" ? state.activeElemTypes : state.activeRelTypes;
  if (e.target.checked) {
    set.add(type);
  } else {
    set.delete(type);
  }
  applyVisibility();
  saveFilterState();
  syncUrl();
}

export function selectAll(kind, val) {
  document.querySelectorAll(`[data-kind="${kind}"]`).forEach((cb) => {
    cb.checked = val;
    const set = kind === "elem" ? state.activeElemTypes : state.activeRelTypes;
    if (val) {
      set.add(cb.dataset.type);
    } else {
      set.delete(cb.dataset.type);
    }
  });
  applyVisibility();
  saveFilterState();
  syncUrl();
}

// Apply a filter state from URL params, overriding any localStorage state.
// activeElemTypes / activeRelTypes are arrays of VISIBLE type strings.
// Types absent from the list are hidden.
export function applyUrlFilters(activeElemTypes, activeRelTypes) {
  const visibleE = new Set(activeElemTypes);
  const visibleR = new Set(activeRelTypes);
  document.querySelectorAll('[data-kind="elem"]').forEach((cb) => {
    const visible = visibleE.has(cb.dataset.type);
    cb.checked = visible;
    if (visible) state.activeElemTypes.add(cb.dataset.type);
    else state.activeElemTypes.delete(cb.dataset.type);
  });
  document.querySelectorAll('[data-kind="rel"]').forEach((cb) => {
    const visible = visibleR.has(cb.dataset.type);
    cb.checked = visible;
    if (visible) state.activeRelTypes.add(cb.dataset.type);
    else state.activeRelTypes.delete(cb.dataset.type);
  });
  applyVisibility();
}

export function filterSearch(kind, query) {
  const q = query.toLowerCase();
  document.querySelectorAll(`[data-kind="${kind}"]`).forEach((cb) => {
    cb.closest(".filter-item").style.display = cb.dataset.type.toLowerCase().includes(q)
      ? ""
      : "none";
  });
}

// In compound mode, when a child node is hidden its structural parent membership
// must be removed (node.move({ parent: null })) so Cytoscape does not collapse
// the compound container to zero size.  When the child becomes visible again it
// is restored to its original parent (modelParent).
export function syncCompoundParents(isVisible) {
  if (state.containmentMode !== "compound") return;
  state.cy.nodes().forEach((n) => {
    const origParent = n.data("modelParent");
    if (!origParent) return;
    const parentNode = state.cy.$id(origParent);
    const parentOk = parentNode.length && isVisible(parentNode);
    const currentParId = n.parent().length ? n.parent().id() : null;
    if (isVisible(n) && parentOk) {
      if (currentParId !== origParent) n.move({ parent: origParent });
    } else {
      if (currentParId !== null) n.move({ parent: null });
    }
  });
}

export function applyVisibility() {
  if (!state.cy) return;
  if (state.drillNodeId) {
    applyDrill();
    return;
  }

  syncCompoundParents((n) => state.activeElemTypes.has(n.data("type")));
  state.cy.batch(() => {
    state.cy
      .nodes()
      .forEach((n) =>
        n.style("display", state.activeElemTypes.has(n.data("type")) ? "element" : "none"),
      );
    state.cy.edges().forEach((e) => {
      const srcOk = state.activeElemTypes.has(e.source().data("type"));
      const tgtOk = state.activeElemTypes.has(e.target().data("type"));
      const show = e.data("isContainment")
        ? srcOk && tgtOk
        : srcOk && tgtOk && state.activeRelTypes.has(e.data("type"));
      e.style("display", show ? "element" : "none");
    });
  });
  updateStats();
  updateElemFilterDim();
  updateRelFilterCounts();
  if (state.currentView === "table") renderTable();
}

// All filter states stored as one JSON object: { [namespaceURI]: { hiddenEntityTypes, hiddenRelationshipTypes } }
export function saveFilterState() {
  if (!state.currentModelNs) return;
  const allETypes = new Set(state.allElements.map((e) => e.type));
  const allRTypes = new Set(state.allRelations.map((r) => r.type));
  const hiddenEntityTypes = [...allETypes].filter((type) => !state.activeElemTypes.has(type));
  const hiddenRelationshipTypes = [...allRTypes].filter((type) => !state.activeRelTypes.has(type));
  const all = JSON.parse(localStorage.getItem("architeezyLensFilter") || "{}");
  all[state.currentModelNs] = { hiddenEntityTypes, hiddenRelationshipTypes };
  localStorage.setItem("architeezyLensFilter", JSON.stringify(all));
}

export function loadFilterState() {
  if (!state.currentModelNs) return;
  const all = JSON.parse(localStorage.getItem("architeezyLensFilter") || "{}");
  const saved = all[state.currentModelNs];
  if (!saved) return;
  const hiddenE = new Set(saved.hiddenEntityTypes ?? saved.hiddenElem ?? []);
  const hiddenR = new Set(saved.hiddenRelationshipTypes ?? saved.hiddenRel ?? []);
  document.querySelectorAll('[data-kind="elem"]').forEach((cb) => {
    if (hiddenE.has(cb.dataset.type)) {
      cb.checked = false;
      state.activeElemTypes.delete(cb.dataset.type);
    }
  });
  document.querySelectorAll('[data-kind="rel"]').forEach((cb) => {
    if (hiddenR.has(cb.dataset.type)) {
      cb.checked = false;
      state.activeRelTypes.delete(cb.dataset.type);
    }
  });
}

export function applyDrill() {
  if (!state.cy || !state.drillNodeId) return;

  // BFS traverses semantic relationship edges AND containment edges/compound links
  // (when containment display is not "none"), treating composition as regular hops.
  // In edge mode, containment edges are in the graph (isContainment flag).
  // In compound mode, parent↔child is expressed via Cytoscape compound nodes.
  // Track the BFS depth of every reached node for the universal edge-visibility rule.
  const visible = new Set([state.drillNodeId]);
  const nodeDepth = new Map([[state.drillNodeId, 0]]);
  let frontier = [state.cy.$id(state.drillNodeId)];

  for (let d = 0; d < state.drillDepth; d++) {
    const next = [];
    frontier.forEach((n) => {
      // Collect nodes reachable in one hop: semantic edges + containment (if enabled)
      let reachable = n
        .connectedEdges()
        .filter((e) => state.activeRelTypes.has(e.data("type")) || e.data("isContainment"))
        .connectedNodes();
      if (state.containmentMode === "compound") {
        // compound parent-child is not an edge — traverse explicitly
        reachable = reachable.union(n.children()).union(n.parent());
      }
      reachable.forEach((nb) => {
        if (!visible.has(nb.id())) {
          visible.add(nb.id());
          nodeDepth.set(nb.id(), d + 1);
          next.push(nb);
        }
      });
    });
    frontier = next;
    if (!frontier.length) break;
  }

  state.drillVisibleIds = visible;

  syncCompoundParents((n) => visible.has(n.id()) && state.activeElemTypes.has(n.data("type")));
  state.cy.batch(() => {
    state.cy
      .nodes()
      .forEach((n) =>
        n.style(
          "display",
          visible.has(n.id()) && state.activeElemTypes.has(n.data("type")) ? "element" : "none",
        ),
      );
    state.cy.edges().forEach((e) => {
      const srcId = e.source().id();
      const tgtId = e.target().id();
      const srcVis = visible.has(srcId);
      const tgtVis = visible.has(tgtId);
      const srcOk = state.activeElemTypes.has(e.source().data("type"));
      const tgtOk = state.activeElemTypes.has(e.target().data("type"));
      let show = false;
      if (srcVis && tgtVis && srcOk && tgtOk) {
        const isRel = state.activeRelTypes.has(e.data("type"));
        const isContainment = e.data("isContainment");
        if (isRel || isContainment) {
          // Universal rule: show edge only if at least one endpoint is strictly inside
          // the drill boundary — hides cross-edges at the outermost hop.
          const dSrc = nodeDepth.get(srcId) ?? state.drillDepth;
          const dTgt = nodeDepth.get(tgtId) ?? state.drillDepth;
          show = Math.min(dSrc, dTgt) < state.drillDepth;
        }
      }
      e.style("display", show ? "element" : "none");
    });
  });

  updateStats();
  updateElemFilterDim();
  updateRelFilterCounts();
  if (state.currentView === "table") renderTable();
}
