// ── STATE ──────────────────────────────────────────────────────────────────
//
// Single shared mutable object that holds all runtime state.
// Imported directly by every module that needs to read or write state.

export const state = {
  /**
   * @type {{
   *   id: string;
   *   type: string;
   *   ns: string;
   *   name: string;
   *   doc: string;
   *   parent: string | null;
   * }[]}
   */
  allElements: [],

  /**
   * @type {{
   *   id: string;
   *   type: string;
   *   source: string;
   *   target: string;
   *   name: string;
   * }[]}
   */
  allRelations: [],

  /**
   * @type {Object<
   *   string,
   *   {
   *     id: string;
   *     type: string;
   *     ns: string;
   *     name: string;
   *     doc: string;
   *     parent: string | null;
   *   }
   * >}
   *   id → element lookup
   */
  elemMap: {},

  /** @type {cytoscape.Core | undefined} */
  cy: undefined,

  /** @type {Set<string>} element type names currently shown */
  activeElemTypes: new Set(),

  /** @type {Set<string>} relationship type names currently shown */
  activeRelTypes: new Set(),

  /**
   * @type {string | undefined} ID of the drill-root node; undefined when not in
   * drill mode
   */
  drillNodeId: undefined,

  /** @type {number} BFS depth for drill-down (1–5) */
  drillDepth: 2,

  /**
   * @type {Set<string> | undefined} node IDs visible in drill scope; undefined
   * = full model shown
   */
  drillVisibleIds: undefined,

  /** @type {'graph' | 'table'} */
  currentView: 'graph',

  /** @type {'elements' | 'relationships'} active tab in table view */
  currentTTab: 'elements',

  /**
   * @type {number | undefined} index of the sorted table column, or undefined
   * if unsorted
   */
  tableSortCol: undefined,

  /** @type {boolean} true = ascending sort */
  tableSortAsc: true,

  /** @type {Array} fetched model list from the API */
  cachedModels: [],

  /** @type {number | undefined} pending tap debounce timer ID */
  tapTimer: undefined,

  /** @type {number | undefined} auto-dismiss timer ID for the toast notification */
  toastTimer: undefined,

  /**
   * @type {'none' | 'edge' | 'compound'} containment display mode (persisted in
   * localStorage)
   */
  containmentMode: globalThis.localStorage?.getItem('architeezyLensContainment') ?? 'edge',

  /**
   * @type {string | undefined} UUID/id of the currently loaded model; used for
   * URL routing
   */
  currentModelId: undefined,

  /**
   * @type {string} full namespace URI of the model; used as filter-state
   * localStorage key
   */
  currentModelNs: '',

  /**
   * @type {Object<string,string>} prefix → full namespace URI from the model's
   * ns map
   */
  modelNsMap: {},

  /**
   * @type {Object<string,number>} relationship type → total count (both
   * endpoints are nodes)
   */
  relTypeTotals: {},

  /** @type {Object<string,number>} element type → total count */
  elemTypeTotals: {},
};
