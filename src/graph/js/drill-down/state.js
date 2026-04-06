/**
 * State management for drill-down mode.
 *
 * Plain getters/setters, no dependencies.
 *
 * @module drill-down/state
 * @package
 */

/**
 * When true, the next call to onNodeDrill will skip saving layout state. Used for drill-down
 * entered via URL (deep link) where there is no previous state.
 *
 * @type {boolean}
 */
let _skipLayoutSave = false;

/** @type {string | undefined} ID of the drill-root node; undefined when not in drill mode */
let _drillNodeId;

/** @type {number} BFS depth for drill-down (1–5) */
let _drillDepth = 2;

/** @type {Set<string> | undefined} node IDs visible in drill scope; undefined = full model shown */
let _drillVisibleIds;

/**
 * @type {Set<string> | undefined} node IDs within drill spatial scope (ignoring entity filters);
 *   undefined = full model
 */
let _drillScopeIds;

export function getSkipLayoutSave() {
  return _skipLayoutSave;
}

/**
 * Sets the skip flag to control whether layout state is saved on the next drill entry.
 *
 * @param {boolean} flag - True to skip saving layout state.
 */
export function setSkipLayoutSave(flag) {
  _skipLayoutSave = flag;
}

export function getDrillNodeId() {
  return _drillNodeId;
}

export function getDrillDepth() {
  return _drillDepth;
}

export function getDrillVisibleIds() {
  return _drillVisibleIds;
}

export function getDrillScopeIds() {
  return _drillScopeIds;
}

/** @param {string | undefined} id ID of the drill-root node, or undefined to exit drill mode */
export function setDrillNodeId(id) {
  _drillNodeId = id;
}

/** @param {number} d BFS depth for drill-down (1–5) */
export function setDrillDepth(d) {
  _drillDepth = d;
}

/** @param {Set<string> | undefined} ids Node IDs visible in drill scope, or undefined for full model */
export function setDrillVisibleIds(ids) {
  _drillVisibleIds = ids;
}

/**
 * @param {Set<string> | undefined} ids Node IDs within drill spatial scope (ignoring entity
 *   filters)
 */
export function setDrillScopeIds(ids) {
  _drillScopeIds = ids;
}

/**
 * Resets drillNodeId, drillVisibleIds, and drillScopeIds to undefined. Call on model load or
 * exitDrill.
 */
export function clearDrillState() {
  _drillNodeId = undefined;
  _drillVisibleIds = undefined;
  _drillScopeIds = undefined;
}
