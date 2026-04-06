/**
 * FilterService - Reactive service for filter state management.
 *
 * Centralizes all filter-related state and operations using signals. Manages active
 * element/relationship types, "Show all" flags, and persistence to localStorage. All state changes
 * are reactive and tracked via signals for automatic UI updates.
 *
 * @module filter/service
 * @package
 */

import { getNs } from '../model/index.js';
import { signal } from '../signals/index.js';

// ── PRIVATE SIGNALS ─────────────────────────────────────────────────────────────

/** @type {import('../signals').Signal<Set<string>>} */
const _activeElemTypes = signal(new Set());

/** @type {import('../signals').Signal<Set<string>>} */
const _activeRelTypes = signal(new Set());

const _showAllElem = signal(false);
const _showAllRel = signal(false);

/** @type {import('../signals').ReadonlySignal<boolean>} */
export const [showAllElem, setShowAllElem] = _showAllElem.asPair();

/** @type {import('../signals').ReadonlySignal<boolean>} */
export const [showAllRel, setShowAllRel] = _showAllRel.asPair();

export const [elemFilterQuery, setElemFilterQuery] = signal('').asPair();
export const [relFilterQuery, setRelFilterQuery] = signal('').asPair();

/**
 * Counts of elements per type within the current drill scope. `undefined` when not in drill mode.
 * Written by GraphService via {@link setScopeElemCounts}.
 *
 * @type {import('../signals').ReadonlySignal<Record<string, number> | undefined>}
 */
const _scopeElemCounts = signal();
export const scopeElemCounts = _scopeElemCounts.asReadonly();

/**
 * @param {Record<string, number> | undefined} counts - Element counts per type within drill scope,
 *   or `undefined` when not in drill mode.
 */
export function setScopeElemCounts(counts) {
  _scopeElemCounts.value = counts;
}

/**
 * Counts of visible relationships per type, respecting drill scope and active elem types. Always
 * defined after GraphService initialises. Written by GraphService via {@link setVisRelCounts}.
 *
 * @type {import('../signals').ReadonlySignal<Record<string, number> | undefined>}
 */
const _visRelCounts = signal();
export const visRelCounts = _visRelCounts.asReadonly();

/**
 * @param {Record<string, number> | undefined} counts - Visible relationship counts per type,
 *   respecting drill scope and active element types.
 */
export function setVisRelCounts(counts) {
  _visRelCounts.value = counts;
}

// ── PLAIN STATE (not reactive) ────────────────────────────────────────────────

let _elemTypeTotals = {};
let _relTypeTotals = {};

// ── SELECTORS (immutable) ────────────────────────────────────────────────────

/**
 * Returns a copy of active element types.
 *
 * @returns {Set<string>} Copy of active element types set.
 */
export function getActiveElemTypes() {
  return new Set(_activeElemTypes.value);
}

/**
 * Returns a copy of active relationship types.
 *
 * @returns {Set<string>} Copy of active relationship types set.
 */
export function getActiveRelTypes() {
  return new Set(_activeRelTypes.value);
}

/**
 * Returns the element type counts (readonly).
 *
 * @returns {Object<string, number>} Element type counts object.
 */
export function getElemTypeTotals() {
  return _elemTypeTotals;
}

/**
 * Returns the relationship type counts (readonly).
 *
 * @returns {Object<string, number>} Relationship type counts object.
 */
export function getRelTypeTotals() {
  return _relTypeTotals;
}

// ── ACTIONS (state mutations) ────────────────────────────────────────────────

/**
 * Toggles an element type in the active set.
 *
 * @param {string} type - The element type to toggle.
 * @returns {boolean} New active state (true = active)
 */
export function toggleElemType(type) {
  const newSet = new Set(_activeElemTypes.value);
  if (newSet.has(type)) {
    newSet.delete(type);
  } else {
    newSet.add(type);
  }
  _activeElemTypes.value = newSet;
  return newSet.has(type);
}

/**
 * Toggles a relationship type in the active set.
 *
 * @param {string} type - The relationship type to toggle.
 * @returns {boolean} New active state
 */
export function toggleRelType(type) {
  const newSet = new Set(_activeRelTypes.value);
  if (newSet.has(type)) {
    newSet.delete(type);
  } else {
    newSet.add(type);
  }
  _activeRelTypes.value = newSet;
  return newSet.has(type);
}

/**
 * Sets all element types as active or inactive.
 *
 * @param {boolean} active - True to activate all, false to deactivate all.
 */
export function setAllElemTypes(active) {
  _activeElemTypes.value = active ? new Set(Object.keys(_elemTypeTotals)) : new Set();
}

/**
 * Sets all relationship types as active or inactive.
 *
 * @param {boolean} active - True to activate all, false to deactivate all.
 */
export function setAllRelTypes(active) {
  _activeRelTypes.value = active ? new Set(Object.keys(_relTypeTotals)) : new Set();
}

/**
 * Sets the active element types directly.
 *
 * @param {Set<string> | string[]} types - Set or array of element types to make active.
 */
export function setActiveElemTypes(types) {
  _activeElemTypes.value = types instanceof Set ? types : new Set(types);
}

/**
 * Sets the active relationship types directly.
 *
 * @param {Set<string> | string[]} types - Set or array of relationship types to make active.
 */
export function setActiveRelTypes(types) {
  _activeRelTypes.value = types instanceof Set ? types : new Set(types);
}

/**
 * Sets filter types from application state (e.g., URL parameters). Either argument can be undefined
 * to leave that collection unchanged.
 *
 * @param {Set<string> | string[] | undefined} activeElemTypes - Active element types.
 * @param {Set<string> | string[] | undefined} activeRelTypes - Active relationship types.
 */
export function setFilterTypes(activeElemTypes, activeRelTypes) {
  if (activeElemTypes !== undefined) {
    setActiveElemTypes(activeElemTypes);
  }
  if (activeRelTypes !== undefined) {
    setActiveRelTypes(activeRelTypes);
  }
}

// ── COMPUTED/PURE HELPERS ─────────────────────────────────────────────────────

/**
 * Pure function: counts element and relationship types.
 *
 * @param {Object[]} elements - Array of element objects.
 * @param {Object[]} relations - Array of relation objects.
 * @returns {{ elemTypeTotals: Object<string, number>; relTypeTotals: Object<string, number> }}
 *   Counts object.
 */
export function computeFilterCounts(elements, relations) {
  const ec = {};
  for (const e of elements) {
    ec[e.type] = (ec[e.type] ?? 0) + 1;
  }
  const elemIds = new Set(elements.map((e) => e.id));
  const rc = {};
  for (const r of relations) {
    if (elemIds.has(r.source) && elemIds.has(r.target)) {
      rc[r.type] = (rc[r.type] ?? 0) + 1;
    }
  }
  return { elemTypeTotals: ec, relTypeTotals: rc };
}

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
 *   - Parameters for computing visible relationship counts.
 * @returns {Object<string, number>} Counts of visible relations keyed by type.
 */
export function computeVisRelCounts({ allRelations, elemMap, activeElemTypes, drillVisibleIds }) {
  const counts = {};
  for (const r of allRelations) {
    if (drillVisibleIds && (!drillVisibleIds.has(r.source) || !drillVisibleIds.has(r.target))) {
      continue;
    }
    const srcType = elemMap.get(r.source)?.type;
    const tgtType = elemMap.get(r.target)?.type;
    if (srcType && tgtType && activeElemTypes.has(srcType) && activeElemTypes.has(tgtType)) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
  }
  return counts;
}

// ── INITIALIZATION ────────────────────────────────────────────────────────────

/**
 * Initializes filter service from model data. Called once per model load.
 *
 * @param {Object[]} elements - Array of element objects.
 * @param {Object[]} relations - Array of relationship objects.
 */
export function initializeFilterService(elements, relations) {
  const { elemTypeTotals, relTypeTotals } = computeFilterCounts(elements, relations);
  _elemTypeTotals = elemTypeTotals;
  _relTypeTotals = relTypeTotals;
  _activeElemTypes.value = new Set(Object.keys(elemTypeTotals));
  _activeRelTypes.value = new Set(Object.keys(relTypeTotals));
  _showAllElem.value = false;
  _showAllRel.value = false;
}

// ── STATE PERSISTENCE ────────────────────────────────────────────────────────

/**
 * Loads saved filter state from localStorage and applies it. Also updates the active
 * element/relationship types based on hidden types.
 *
 * @returns {{ hiddenE: Set<string>; hiddenR: Set<string> } | undefined} Loaded state object or
 *   undefined if none.
 */
export function loadFilterStateFromStorage() {
  const ns = getNs();
  if (!ns) {
    return;
  }
  const all = JSON.parse(localStorage.getItem('architeezyGraphFilter') ?? '{}');
  const saved = all[ns];
  if (!saved) {
    return;
  }

  // Apply Show All flags
  if (typeof saved.showAllElem === 'boolean') {
    _showAllElem.value = saved.showAllElem;
  }
  if (typeof saved.showAllRel === 'boolean') {
    _showAllRel.value = saved.showAllRel;
  }

  // Compute hidden sets
  const hiddenE = new Set(saved.hiddenEntityTypes || []);
  const hiddenR = new Set(saved.hiddenRelationshipTypes || []);

  // Restore active types: all types minus hidden
  const allETypes = Object.keys(_elemTypeTotals);
  const allRTypes = Object.keys(_relTypeTotals);
  _activeElemTypes.value = new Set(allETypes.filter((t) => !hiddenE.has(t)));
  _activeRelTypes.value = new Set(allRTypes.filter((t) => !hiddenR.has(t)));
}

/** Saves current filter state to localStorage. */
export function saveFilterStateToStorage() {
  const ns = getNs();
  if (!ns) {
    return;
  }

  // Compute hidden types from totals minus active
  const activeE = _activeElemTypes.value;
  const activeR = _activeRelTypes.value;
  const hiddenEntityTypes = Object.keys(_elemTypeTotals).filter((t) => !activeE.has(t));
  const hiddenRelationshipTypes = Object.keys(_relTypeTotals).filter((t) => !activeR.has(t));

  const all = JSON.parse(localStorage.getItem('architeezyGraphFilter') ?? '{}');
  all[ns] = {
    hiddenEntityTypes,
    hiddenRelationshipTypes,
    showAllElem: _showAllElem.value,
    showAllRel: _showAllRel.value,
  };
  localStorage.setItem('architeezyGraphFilter', JSON.stringify(all));
}
