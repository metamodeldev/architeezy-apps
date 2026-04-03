// ── STATE ──────────────────────────────────────────────────────────────────

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
  /** @type {Object<string,object>} id → element */
  elemMap: {},

  /** @type {string | undefined} */
  currentModelId: undefined,
  /** @type {string} */
  currentModelNs: '',
  /** @type {string} contentType URI from the model descriptor */
  currentModelContentType: '',
  /** @type {Object<string,string>} prefix → full URI */
  modelNsMap: {},

  /** @type {object | undefined} active MatrixDefinition */
  currentDef: undefined,
  /** @type {boolean} unsaved changes since last save */
  isDirty: false,

  /** @type {Array} model list cache */
  cachedModels: [],
  /** @type {number | undefined} */
  toastTimer: undefined,
};
