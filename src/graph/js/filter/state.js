/**
 * State management for filter checkboxes.
 *
 * Immutable state with explicit actions.
 *
 * @module filter/state
 * @package
 */

import { getCurrentModelNs } from '../model/index.js';

// ── INTERNAL STATE ───────────────────────────────────────────────────────────

let _activeElemTypes = new Set();
let _activeRelTypes = new Set();
let _elemTypeTotals = {};
let _relTypeTotals = {};
let _showAllElem = false;
let _showAllRel = false;

// ── SELECTORS (immutable) ────────────────────────────────────────────────────

/**
 * Returns a copy of active element types.
 *
 * @returns {Set<string>} Copy of active element types set.
 */
export function getActiveElemTypes() {
  return new Set(_activeElemTypes);
}

/**
 * Returns a copy of active relationship types.
 *
 * @returns {Set<string>} Copy of active relationship types set.
 */
export function getActiveRelTypes() {
  return new Set(_activeRelTypes);
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

/**
 * Returns whether "Show all" is enabled for elements.
 *
 * @returns {boolean} True if "Show all" is enabled.
 */
export function getShowAllElem() {
  return _showAllElem;
}

/**
 * Returns whether "Show all" is enabled for relationships.
 *
 * @returns {boolean} True if "Show all" is enabled.
 */
export function getShowAllRel() {
  return _showAllRel;
}

// ── ACTIONS (state mutations) ────────────────────────────────────────────────

/**
 * Toggles an element type in the active set.
 *
 * @param {string} type - The element type to toggle.
 * @returns {boolean} New active state (true = active)
 */
export function toggleElemType(type) {
  if (_activeElemTypes.has(type)) {
    _activeElemTypes.delete(type);
  } else {
    _activeElemTypes.add(type);
  }
  return _activeElemTypes.has(type);
}

/**
 * Toggles a relationship type in the active set.
 *
 * @param {string} type - The relationship type to toggle.
 * @returns {boolean} New active state
 */
export function toggleRelType(type) {
  if (_activeRelTypes.has(type)) {
    _activeRelTypes.delete(type);
  } else {
    _activeRelTypes.add(type);
  }
  return _activeRelTypes.has(type);
}

/**
 * Sets all element types as active or inactive.
 *
 * @param {boolean} active - True to activate all, false to deactivate all.
 */
export function setAllElemTypes(active) {
  if (active) {
    _activeElemTypes = new Set(Object.keys(_elemTypeTotals));
  } else {
    _activeElemTypes.clear();
  }
}

/**
 * Sets all relationship types as active or inactive.
 *
 * @param {boolean} active - True to activate all, false to deactivate all.
 */
export function setAllRelTypes(active) {
  if (active) {
    _activeRelTypes = new Set(Object.keys(_relTypeTotals));
  } else {
    _activeRelTypes.clear();
  }
}

/**
 * Sets the "Show all" flag for elements.
 *
 * @param {boolean} value - True to show all, false otherwise.
 */
export function setShowAllElem(value) {
  _showAllElem = value;
}

/**
 * Sets the "Show all" flag for relationships.
 *
 * @param {boolean} value - True to show all, false otherwise.
 */
export function setShowAllRel(value) {
  _showAllRel = value;
}

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
 * Initializes filter state from model data. Called once per model load.
 *
 * @param {Object[]} elements - Array of element objects.
 * @param {Object[]} relations - Array of relation objects.
 */
export function initializeFilterState(elements, relations) {
  const { elemTypeTotals, relTypeTotals } = computeFilterCounts(elements, relations);
  _elemTypeTotals = elemTypeTotals;
  _relTypeTotals = relTypeTotals;
  _activeElemTypes = new Set(Object.keys(elemTypeTotals));
  _activeRelTypes = new Set(Object.keys(relTypeTotals));
  _showAllElem = false;
  _showAllRel = false;
}

// ── STATE PERSISTENCE ────────────────────────────────────────────────────────

/**
 * Loads saved filter state from localStorage and applies it. Returns the loaded state for UI to
 * sync checkboxes.
 *
 * @returns {{ hiddenE: Set<string>; hiddenR: Set<string> } | undefined} Loaded state object or
 *   undefined if none.
 */
export function loadFilterStateFromStorage() {
  const ns = getCurrentModelNs();
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
    _showAllElem = saved.showAllElem;
  }
  if (typeof saved.showAllRel === 'boolean') {
    _showAllRel = saved.showAllRel;
  }

  // Return hidden sets for UI to apply
  const hiddenE = new Set(saved.hiddenEntityTypes || []);
  const hiddenR = new Set(saved.hiddenRelationshipTypes || []);

  return { hiddenE, hiddenR };
}

/** Saves current filter state to localStorage. */
export function saveFilterStateToStorage() {
  const ns = getCurrentModelNs();
  if (!ns) {
    return;
  }

  // Compute hidden types from totals minus active
  const hiddenEntityTypes = Object.keys(_elemTypeTotals).filter((t) => !_activeElemTypes.has(t));
  const hiddenRelationshipTypes = Object.keys(_relTypeTotals).filter(
    (t) => !_activeRelTypes.has(t),
  );

  const all = JSON.parse(localStorage.getItem('architeezyGraphFilter') ?? '{}');
  all[ns] = {
    hiddenEntityTypes,
    hiddenRelationshipTypes,
    showAllElem: _showAllElem,
    showAllRel: _showAllRel,
  };
  localStorage.setItem('architeezyGraphFilter', JSON.stringify(all));
}

// ── PURE HELPERS ─────────────────────────────────────────────────────────────

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
    const srcType = elemMap[r.source]?.type;
    const tgtType = elemMap[r.target]?.type;
    if (srcType && tgtType && activeElemTypes.has(srcType) && activeElemTypes.has(tgtType)) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
  }
  return counts;
}

// ── URL STATE HELPERS ────────────────────────────────────────────────────────

/**
 * Applies filter state from URL params.
 *
 * @param {string[]} activeElemTypes - Array of active element type strings.
 * @param {string[]} activeRelTypes - Array of active relationship type strings.
 */
export function setFilterTypes(activeElemTypes, activeRelTypes) {
  const visibleE = new Set(activeElemTypes);
  const visibleR = new Set(activeRelTypes);

  // Update active types
  _activeElemTypes = visibleE;
  _activeRelTypes = visibleR;
}
