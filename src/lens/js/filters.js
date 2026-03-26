// ── FILTER PANEL UI ─────────────────────────────────────────────────────────────
//
// Builds and manages the sidebar filter checkboxes for element types and
// Relationship types.  Visibility logic (applyVisibility, applyDrill, etc.)
// Lives in visibility.js; this module only handles the UI and filter state.

import { syncUrl } from './routing.js';
import { state } from './state.js';
import { elemColor, escHtml, relColor } from './utils.js';
import { applyVisibility } from './visibility.js';

// ── FILTER LIST BUILD ───────────────────────────────────────────────────────

/**
 * Pure: counts element and relationship types across a model. Only relations whose both endpoints
 * are graph node IDs are counted.
 *
 * @param {{ id: string; type: string }[]} allElements - All model elements.
 * @param {{ type: string; source: string; target: string }[]} allRelations -
 *   All model relations.
 * @returns {{ elemTypeTotals: object; relTypeTotals: object }} Element and
 * relation type counts.
 */
export function computeFilterCounts(allElements, allRelations) {
  const ec = {};
  for (const e of allElements) {
    ec[e.type] = (ec[e.type] ?? 0) + 1;
  }
  const elemIds = new Set(allElements.map((e) => e.id));
  const rc = {};
  for (const r of allRelations) {
    if (elemIds.has(r.source) && elemIds.has(r.target)) {
      rc[r.type] = (rc[r.type] ?? 0) + 1;
    }
  }
  return { elemTypeTotals: { ...ec }, relTypeTotals: { ...rc } };
}

/**
 * Counts element and relationship types across the full model, initialises the active-type sets to
 * "all visible", and renders the filter checkbox lists. Called once after each model load.
 */
export function buildFilters() {
  const { elemTypeTotals: ec, relTypeTotals: rc } = computeFilterCounts(
    state.allElements,
    state.allRelations,
  );
  state.elemTypeTotals = ec;
  state.relTypeTotals = rc;
  state.activeElemTypes = new Set(Object.keys(ec));
  state.activeRelTypes = new Set(Object.keys(rc));
  renderFilterList('elem', ec, elemColor);
  renderFilterList('rel', rc, relColor);
}

/**
 * Renders a list of filter checkboxes sorted by count (descending).
 *
 * @param {'elem' | 'rel'} kind - Which filter list to populate.
 * @param {Object<string, number>} counts - Type name → item count.
 * @param {function(string): string} colorFn - Returns a CSS color for a type name.
 */
function renderFilterList(kind, counts, colorFn) {
  const container = document.getElementById(`${kind}-filter-list`);
  container.innerHTML = '';
  for (const [type, count] of Object.entries(counts).toSorted((a, b) => b[1] - a[1])) {
    const item = document.createElement('label');
    item.className = 'filter-item';
    item.innerHTML = `
      <input type="checkbox" checked data-kind="${kind}" data-type="${escHtml(type)}">
      <span class="dot" style="background:${colorFn(type)}"></span>
      <span class="item-label" title="${escHtml(type)}">${escHtml(type)}</span>
      <span class="count">${count}</span>`;
    item.querySelector('input').addEventListener('change', onFilterChange);
    container.append(item);
  }
}

// ── FILTER STATE CHANGES ────────────────────────────────────────────────────

/**
 * Handles a checkbox change event: updates the active-type set, reapplies visibility, persists the
 * state to localStorage, and syncs the URL.
 *
 * @param {Event} e - The change event from a filter checkbox.
 */
function onFilterChange(e) {
  const { kind, type } = e.target.dataset;
  const set = kind === 'elem' ? state.activeElemTypes : state.activeRelTypes;
  if (e.target.checked) {
    set.add(type);
  } else {
    set.delete(type);
  }
  applyVisibility();
  saveFilterState();
  syncUrl();
}

/**
 * Selects or deselects all checkboxes of a given kind and updates visibility.
 *
 * @param {'elem' | 'rel'} kind - Which checkbox group to affect.
 * @param {boolean} val - True to check all, false to uncheck all.
 */
export function selectAll(kind, val) {
  for (const el of document.querySelectorAll(`[data-kind="${kind}"]`)) {
    el.checked = val;
    const set = kind === 'elem' ? state.activeElemTypes : state.activeRelTypes;
    if (val) {
      set.add(el.dataset.type);
    } else {
      set.delete(el.dataset.type);
    }
  }
  applyVisibility();
  saveFilterState();
  syncUrl();
}

/**
 * Applies a filter state read from URL params, overriding localStorage.
 *
 * @param {string[]} activeElemTypes - Visible element type names.
 * @param {string[]} activeRelTypes - Visible relationship type names.
 */
export function applyUrlFilters(activeElemTypes, activeRelTypes) {
  const visibleE = new Set(activeElemTypes);
  const visibleR = new Set(activeRelTypes);
  for (const el of document.querySelectorAll('[data-kind="elem"]')) {
    const visible = visibleE.has(el.dataset.type);
    el.checked = visible;
    if (visible) {
      state.activeElemTypes.add(el.dataset.type);
    } else {
      state.activeElemTypes.delete(el.dataset.type);
    }
  }
  for (const el of document.querySelectorAll('[data-kind="rel"]')) {
    const visible = visibleR.has(el.dataset.type);
    el.checked = visible;
    if (visible) {
      state.activeRelTypes.add(el.dataset.type);
    } else {
      state.activeRelTypes.delete(el.dataset.type);
    }
  }
  applyVisibility();
}

/**
 * Hides filter items whose type name does not contain `query` (case-insensitive). Used by the
 * search input inside each filter section.
 *
 * @param {'elem' | 'rel'} kind - Which filter list to search.
 * @param {string} query - Search string.
 */
export function filterSearch(kind, query) {
  const q = query.toLowerCase();
  for (const el of document.querySelectorAll(`[data-kind="${kind}"]`)) {
    el.closest('.filter-item').style.display = el.dataset.type.toLowerCase().includes(q)
      ? ''
      : 'none';
  }
}

// ── FILTER STATE PERSISTENCE ────────────────────────────────────────────────

// Stored as: { [namespaceURI]: { hiddenEntityTypes: string[], hiddenRelationshipTypes: string[] } }
const LS_KEY = 'architeezyLensFilter';

/**
 * Persists the current filter state (hidden types) to localStorage, keyed by the model's namespace
 * URI.
 */
export function saveFilterState() {
  if (!state.currentModelNs) {
    return;
  }
  const allETypes = new Set(state.allElements.map((e) => e.type));
  const allRTypes = new Set(state.allRelations.map((r) => r.type));
  const hiddenEntityTypes = [...allETypes].filter((t) => !state.activeElemTypes.has(t));
  const hiddenRelationshipTypes = [...allRTypes].filter((t) => !state.activeRelTypes.has(t));
  const all = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  all[state.currentModelNs] = { hiddenEntityTypes, hiddenRelationshipTypes };
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

/**
 * Restores the filter state from localStorage for the currently loaded model. Unchecks checkboxes
 * and removes types from the active sets for any type that was previously hidden. Does nothing if
 * no saved state is found.
 */
export function loadFilterState() {
  if (!state.currentModelNs) {
    return;
  }
  const all = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  const saved = all[state.currentModelNs];
  if (!saved) {
    return;
  }
  const hiddenE = new Set(saved.hiddenEntityTypes);
  const hiddenR = new Set(saved.hiddenRelationshipTypes);
  for (const el of document.querySelectorAll('[data-kind="elem"]')) {
    if (hiddenE.has(el.dataset.type)) {
      el.checked = false;
      state.activeElemTypes.delete(el.dataset.type);
    }
  }
  for (const el of document.querySelectorAll('[data-kind="rel"]')) {
    if (hiddenR.has(el.dataset.type)) {
      el.checked = false;
      state.activeRelTypes.delete(el.dataset.type);
    }
  }
}
