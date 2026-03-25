// ── FILTER PANEL UI ─────────────────────────────────────────────────────────────
//
// Builds and manages the sidebar filter checkboxes for element types and
// relationship types.  Visibility logic (applyVisibility, applyDrill, etc.)
// lives in visibility.js; this module only handles the UI and filter state.

import { state } from './state.js';
import { elemColor, relColor, escHtml } from './utils.js';
import { applyVisibility } from './visibility.js';
import { syncUrl } from './routing.js';

// ── FILTER LIST BUILD ───────────────────────────────────────────────────────

/**
 * Counts element and relationship types across the full model, initialises the
 * active-type sets to "all visible", and renders the filter checkbox lists.
 * Called once after each model load.
 */
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
    if (elemIds.has(r.source) && elemIds.has(r.target)) {
      rc[r.type] = (rc[r.type] ?? 0) + 1;
    }
  });
  state.relTypeTotals = { ...rc };

  state.activeElemTypes = new Set(Object.keys(ec));
  state.activeRelTypes = new Set(Object.keys(rc));

  renderFilterList('elem', ec, elemColor);
  renderFilterList('rel', rc, relColor);
}

/**
 * Renders a list of filter checkboxes sorted by count (descending).
 *
 * @param {"elem"|"rel"} kind - Which filter list to populate.
 * @param {Object<string, number>} counts - Type name → item count.
 * @param {function(string): string} colorFn - Returns a CSS color for a type name.
 */
function renderFilterList(kind, counts, colorFn) {
  const container = document.getElementById(`${kind}-filter-list`);
  container.innerHTML = '';
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const item = document.createElement('label');
      item.className = 'filter-item';
      item.innerHTML = `
      <input type="checkbox" checked data-kind="${kind}" data-type="${escHtml(type)}">
      <span class="dot" style="background:${colorFn(type)}"></span>
      <span class="item-label" title="${escHtml(type)}">${escHtml(type)}</span>
      <span class="count">${count}</span>`;
      item.querySelector('input').addEventListener('change', onFilterChange);
      container.appendChild(item);
    });
}

// ── FILTER STATE CHANGES ────────────────────────────────────────────────────

/**
 * Handles a checkbox change event: updates the active-type set, reapplies
 * visibility, persists the state to localStorage, and syncs the URL.
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
 * @param {"elem"|"rel"} kind - Which checkbox group to affect.
 * @param {boolean} val - True to check all, false to uncheck all.
 */
export function selectAll(kind, val) {
  document.querySelectorAll(`[data-kind="${kind}"]`).forEach((cb) => {
    cb.checked = val;
    const set = kind === 'elem' ? state.activeElemTypes : state.activeRelTypes;
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

/**
 * Applies a filter state read from URL params, overriding localStorage.
 *
 * @param {string[]} activeElemTypes - Visible element type names.
 * @param {string[]} activeRelTypes  - Visible relationship type names.
 */
export function applyUrlFilters(activeElemTypes, activeRelTypes) {
  const visibleE = new Set(activeElemTypes);
  const visibleR = new Set(activeRelTypes);
  document.querySelectorAll('[data-kind="elem"]').forEach((cb) => {
    const visible = visibleE.has(cb.dataset.type);
    cb.checked = visible;
    if (visible) {
      state.activeElemTypes.add(cb.dataset.type);
    } else {
      state.activeElemTypes.delete(cb.dataset.type);
    }
  });
  document.querySelectorAll('[data-kind="rel"]').forEach((cb) => {
    const visible = visibleR.has(cb.dataset.type);
    cb.checked = visible;
    if (visible) {
      state.activeRelTypes.add(cb.dataset.type);
    } else {
      state.activeRelTypes.delete(cb.dataset.type);
    }
  });
  applyVisibility();
}

/**
 * Hides filter items whose type name does not contain `query` (case-insensitive).
 * Used by the search input inside each filter section.
 *
 * @param {"elem"|"rel"} kind - Which filter list to search.
 * @param {string} query - Search string.
 */
export function filterSearch(kind, query) {
  const q = query.toLowerCase();
  document.querySelectorAll(`[data-kind="${kind}"]`).forEach((cb) => {
    cb.closest('.filter-item').style.display = cb.dataset.type.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ── FILTER STATE PERSISTENCE ────────────────────────────────────────────────

// Stored as: { [namespaceURI]: { hiddenEntityTypes: string[], hiddenRelationshipTypes: string[] } }
const LS_KEY = 'architeezyLensFilter';

/**
 * Persists the current filter state (hidden types) to localStorage,
 * keyed by the model's namespace URI.
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
 * Restores the filter state from localStorage for the currently loaded model.
 * Unchecks checkboxes and removes types from the active sets for any type
 * that was previously hidden.  Does nothing if no saved state is found.
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
  const hiddenE = new Set(saved.hiddenEntityTypes ?? []);
  const hiddenR = new Set(saved.hiddenRelationshipTypes ?? []);
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
