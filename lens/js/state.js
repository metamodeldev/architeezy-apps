// ── STATE ──────────────────────────────────────────────────────────────────
//
// Single shared mutable object that holds all runtime state.
// Imported directly by every module that needs to read or write state.

export const state = {
  /** @type {Array<{id:string, type:string, ns:string, name:string, doc:string, parent:string|null}>} */
  allElements: [],

  /** @type {Array<{id:string, type:string, source:string, target:string, name:string}>} */
  allRelations: [],

  /** @type {Object<string, {id:string, type:string, ns:string, name:string, doc:string, parent:string|null}>} id → element lookup */
  elemMap: {},

  /** @type {cytoscape.Core|null} */
  cy: null,

  /** @type {Set<string>} element type names currently shown */
  activeElemTypes: new Set(),

  /** @type {Set<string>} relationship type names currently shown */
  activeRelTypes: new Set(),

  /** @type {string|null} ID of the drill-root node; null when not in drill mode */
  drillNodeId: null,

  /** @type {number} BFS depth for drill-down (1–5) */
  drillDepth: 2,

  /** @type {Set<string>|null} node IDs visible in drill scope; null = full model shown */
  drillVisibleIds: null,

  /** @type {"graph"|"table"} */
  currentView: "graph",

  /** @type {"elements"|"relationships"} active tab in table view */
  currentTTab: "elements",

  /** @type {number|null} index of the sorted table column, or null if unsorted */
  tableSortCol: null,

  /** @type {boolean} true = ascending sort */
  tableSortAsc: true,

  /** @type {Array} fetched model list from the API */
  cachedModels: [],

  /** @type {number|null} pending tap debounce timer ID */
  tapTimer: null,

  /** @type {number|null} auto-dismiss timer ID for the toast notification */
  toastTimer: null,

  /** @type {"none"|"edge"|"compound"} containment display mode (persisted in localStorage) */
  containmentMode: localStorage.getItem("architeezyLensContainment") || "edge",

  /** @type {string|null} UUID/id of the currently loaded model; used for URL routing */
  currentModelId: null,

  /** @type {string} full namespace URI of the model; used as filter-state localStorage key */
  currentModelNs: "",

  /** @type {Object<string,string>} prefix → full namespace URI from the model's ns map */
  modelNsMap: {},

  /** @type {Object<string,number>} relationship type → total count (both endpoints are nodes) */
  relTypeTotals: {},

  /** @type {Object<string,number>} element type → total count */
  elemTypeTotals: {},
};
