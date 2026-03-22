// ── STATE ──────────────────────────────────────────────────────────────────

export const state = {
  allElements: [], // { id, type, ns, name, doc, parent }
  allRelations: [], // { id, type, source, target, name }
  elemMap: {}, // id → element

  cy: null,
  activeElemTypes: new Set(),
  activeRelTypes: new Set(),
  drillNodeId: null,
  drillDepth: 2,
  drillVisibleIds: null, // Set<id> during drill; null = full model
  currentView: "graph",
  currentTTab: "elements",
  tableSortCol: null,
  tableSortAsc: true,
  cachedModels: [],
  tapTimer: null,
  toastTimer: null,
  containmentMode: localStorage.getItem("architeezyLensContainment") || "edge",
  currentModelId: null, // UUID/id of the loaded model; used for URL routing
  currentModelNs: "", // full namespace URI of the model; used as filter-state key
  modelNsMap: {}, // prefix → full URI from JSON root ns map; used in walkNode
  relTypeTotals: {}, // type → total relation count (both endpoints are nodes)
  elemTypeTotals: {}, // type → total element count
};
