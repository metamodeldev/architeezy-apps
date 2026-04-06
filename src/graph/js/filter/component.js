/**
 * DOM rendering and event handling for filter checkboxes.
 *
 * This component handles all UI-related operations for the filter system. All state management is
 * delegated to FilterService.
 *
 * @module filter/component
 * @package
 */

import { getElemMap, getRelations } from '../model/index.js';
import { elemColor, relColor } from '../palette.js';
import { effect } from '../signals/index.js';
import { escHtml } from '../utils.js';
import {
  computeVisRelCounts,
  elemFilterQuery,
  getActiveElemTypes,
  getActiveRelTypes,
  getElemTypeTotals,
  getRelTypeTotals,
  loadFilterStateFromStorage,
  relFilterQuery,
  saveFilterStateToStorage,
  scopeElemCounts,
  setAllElemTypes,
  setAllRelTypes,
  setElemFilterQuery,
  setFilterTypes,
  setRelFilterQuery,
  setShowAllElem,
  setShowAllRel,
  showAllElem,
  showAllRel,
  toggleElemType,
  toggleRelType,
  visRelCounts,
} from './service.js';

// ============ PUBLIC UI FUNCTIONS ============

/**
 * Renders filter checkboxes sorted by count (descending).
 *
 * @param {'elem' | 'rel'} kind - Filter kind: 'elem' for entities, 'rel' for relationships.
 * @param {Object<string, number>} counts - Type counts object.
 * @param {(type: string) => string} colorFn - Color function for type.
 */
export function renderFilterList(kind, counts, colorFn) {
  const container = document.getElementById(`${kind}-filter-list`);
  if (!container) {
    return;
  }
  container.innerHTML = '';

  const sorted = Object.entries(counts).toSorted((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    const item = document.createElement('label');
    item.className = 'filter-item';
    item.dataset.type = type;
    item.innerHTML = `
      <input type="checkbox" checked data-kind="${kind}" data-type="${escHtml(type)}">
      <span class="dot" style="--dot-color:${colorFn(type)}"></span>
      <span class="item-label" title="${escHtml(type)}">${escHtml(type)}</span>
      <span class="count">${count}</span>
    `;
    item.querySelector('input').addEventListener('change', (e) => onFilterChange(e, kind));
    container.append(item);
  }
}

/** Builds filter UI from current model data. Must be called after initializeFilterState(). */
export function buildFiltersUI() {
  renderFilterList('elem', getElemTypeTotals(), elemColor);
  renderFilterList('rel', getRelTypeTotals(), relColor);
}

/** Restores filter state from localStorage and syncs DOM. Should be called after buildFiltersUI(). */
export function loadFilterStateUI() {
  loadFilterStateFromStorage();

  for (const el of document.querySelectorAll('[data-kind="elem"]')) {
    el.checked = getActiveElemTypes().has(el.dataset.type);
  }
  for (const el of document.querySelectorAll('[data-kind="rel"]')) {
    el.checked = getActiveRelTypes().has(el.dataset.type);
  }
}

/**
 * Filters filter list by search query.
 *
 * @param {'elem' | 'rel'} kind - Filter kind: 'elem' for entities, 'rel' for relationships.
 * @param {string} query - Search query string.
 */
export function filterSearch(kind, query) {
  const q = query.toLowerCase();
  const showAll = kind === 'elem' ? showAllElem.value : showAllRel.value;
  for (const el of document.querySelectorAll(`input[data-kind="${kind}"]`)) {
    const item = el.closest('.filter-item');
    if (!item) {
      continue;
    }
    const type = item.dataset.type;
    const matches = type.toLowerCase().includes(q);
    item.classList.toggle('hidden', !matches && !showAll);
  }
}

/**
 * Updates element filter dim state.
 *
 * @param {Record<string, number> | undefined} scopeCounts - Elem counts within drill scope, or
 *   `undefined` when not in drill mode.
 * @param {boolean} showElem - Whether "show all" is enabled for elements.
 */
export function updateElemFilterDim(scopeCounts, showElem) {
  const searchInput = document.getElementById('elem-filter-search');
  const searchActive = searchInput?.value.trim();

  for (const el of document.querySelectorAll('[data-kind="elem"]')) {
    const item = el.closest('.filter-item');
    if (!item) {
      continue;
    }
    const type = item.dataset.type;
    const total = getElemTypeTotals()[type] ?? 0;
    const available = scopeCounts ? (scopeCounts[type] ?? 0) : total;
    const countEl = item.querySelector('.count');
    if (countEl) {
      countEl.textContent =
        scopeCounts && available !== total ? `${available} / ${total}` : `${total}`;
    }
    const checked = el.checked;
    item.classList.toggle('dim', available === 0);
    if (!searchActive) {
      item.classList.toggle('hidden', available === 0 && !checked && !showElem);
    }
  }
}

/**
 * Updates relationship filter dim state.
 *
 * @param {Record<string, number> | undefined} visCounts - Visible rel counts from GraphService, or
 *   `undefined` before graph initialises (falls back to local computation).
 * @param {Set<string>} activeElemTypes - Active element types.
 * @param {Set<string>} activeRelTypes - Active relationship types.
 * @param {boolean} showRel - Whether "show all" is enabled for relationships.
 */
export function updateRelFilterCounts(visCounts, activeElemTypes, activeRelTypes, showRel) {
  // Fall back to local computation when graph hasn't pushed counts yet (early init).
  const counts =
    visCounts ??
    computeVisRelCounts({
      allRelations: getRelations(),
      elemMap: getElemMap(),
      activeElemTypes,
      drillVisibleIds: undefined,
    });

  const searchInput = document.getElementById('rel-filter-search');
  const searchActive = searchInput?.value.trim();

  for (const el of document.querySelectorAll('[data-kind="rel"]')) {
    const item = el.closest('.filter-item');
    if (!item) {
      continue;
    }
    const type = item.dataset.type;
    const total = getRelTypeTotals()[type] ?? 0;
    const vis = counts[type] ?? 0;
    const countEl = item.querySelector('.count');
    if (countEl) {
      countEl.textContent = vis === total ? `${total}` : `${vis} / ${total}`;
    }
    item.classList.toggle('dim', vis === 0 && activeRelTypes.has(type));
    if (!searchActive) {
      item.classList.toggle('hidden', vis === 0 && !activeRelTypes.has(type) && !showRel);
    }
  }
}

/**
 * Bulk select/deselect all types of a kind.
 *
 * @param {'elem' | 'rel'} kind - Filter kind: 'elem' for entities, 'rel' for relationships.
 * @param {boolean} active - Checked state to set.
 */
export function selectAll(kind, active) {
  if (kind === 'elem') {
    setAllElemTypes(active);
  } else {
    setAllRelTypes(active);
  }

  for (const el of document.querySelectorAll(`[data-kind="${kind}"]`)) {
    el.checked = active;
  }

  applyVisibility();
  saveFilterStateToStorage();
}

// ============ EVENT HANDLING ============

function onFilterChange(e, kind) {
  const type = e.target.dataset.type;
  if (kind === 'elem') {
    toggleElemType(type);
  } else {
    toggleRelType(type);
  }
  applyVisibility();
  // Also update dims even if in drill mode (checkbox state changed affects visibility)
  if (kind === 'elem') {
    updateElemFilterDim(scopeElemCounts.value, showAllElem.value);
  } else {
    updateRelFilterCounts(
      visRelCounts.value,
      getActiveElemTypes(),
      getActiveRelTypes(),
      showAllRel.value,
    );
  }
  saveFilterStateToStorage();
}

function handleFilterSearch(e, kind) {
  const query = e.target.value;
  filterSearch(kind, query);
  if (query.trim() === '') {
    if (kind === 'elem') {
      updateElemFilterDim(scopeElemCounts.value, showAllElem.value);
    } else {
      updateRelFilterCounts(
        visRelCounts.value,
        getActiveElemTypes(),
        getActiveRelTypes(),
        showAllRel.value,
      );
    }
  }
}

function handleShowAllChange(e, kind) {
  if (kind === 'elem') {
    setShowAllElem(e.target.checked);
    filterSearch('elem', elemFilterQuery.value);
    updateElemFilterDim(scopeElemCounts.value, showAllElem.value);
  } else {
    setShowAllRel(e.target.checked);
    filterSearch('rel', relFilterQuery.value);
    updateRelFilterCounts(
      visRelCounts.value,
      getActiveElemTypes(),
      getActiveRelTypes(),
      showAllRel.value,
    );
  }
}

// ============ VISIBILITY APPLICATION ============

/**
 * Updates filter UI dims based on current filter and drill state. Graph display is updated
 * reactively by GraphService via its own effects.
 */
export function applyVisibility() {
  updateElemFilterDim(scopeElemCounts.value, showAllElem.value);
  updateRelFilterCounts(
    visRelCounts.value,
    getActiveElemTypes(),
    getActiveRelTypes(),
    showAllRel.value,
  );
}

/**
 * Applies filter state from URL params and updates DOM.
 *
 * @param {Set<string>} activeElemTypes - Active entity types.
 * @param {Set<string>} activeRelTypes - Active relationship types.
 */
export function applyUrlFilters(activeElemTypes, activeRelTypes) {
  setFilterTypes(activeElemTypes, activeRelTypes);

  const visibleE = new Set(activeElemTypes);
  const visibleR = new Set(activeRelTypes);

  for (const el of document.querySelectorAll('[data-kind="elem"]')) {
    el.checked = visibleE.has(el.dataset.type);
  }
  for (const el of document.querySelectorAll('[data-kind="rel"]')) {
    el.checked = visibleR.has(el.dataset.type);
  }

  applyVisibility();
}

// ============ INITIALIZATION ============

/**
 * Initializes filter module: wires DOM events and registers global listeners. UI building and state
 * initialization happen on model:loaded event.
 */
export function init() {
  wireFilterEvents();
}

/**
 * Activates reactive updates for the filter UI and applies initial visibility. Called once after
 * the first graph build. DOM event wiring is handled by init() at boot time.
 *
 * @param {object} _cy - Cytoscape instance (may be unused).
 */
export function initFilter(_cy) {
  setupReactiveUpdates();
  applyVisibility();
}

/** Wires DOM events (search inputs, show all checkboxes, sidebar select-all buttons). */
export function wireFilterEvents() {
  document.getElementById('elem-filter-search').addEventListener('input', (e) => {
    setElemFilterQuery(e.target.value);
    handleFilterSearch(e, 'elem');
  });
  document.getElementById('rel-filter-search').addEventListener('input', (e) => {
    setRelFilterQuery(e.target.value);
    handleFilterSearch(e, 'rel');
  });
  document
    .getElementById('elem-show-all')
    .addEventListener('change', (e) => handleShowAllChange(e, 'elem'));
  document
    .getElementById('rel-show-all')
    .addEventListener('change', (e) => handleShowAllChange(e, 'rel'));

  // Sidebar select-all / select-none buttons
  document.querySelector('aside')?.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) {
      return;
    }
    if (actionBtn.dataset.action === 'select-all' || actionBtn.dataset.action === 'select-none') {
      const kind = actionBtn.dataset.kind; // 'elem' or 'rel'
      const active = actionBtn.dataset.action === 'select-all';
      selectAll(kind, active);
    }
  });
}

/** Sets up reactive updates to automatically refresh filter UI when state changes. */
function setupReactiveUpdates() {
  effect(() => {
    const scopeCounts = scopeElemCounts.value;
    const visCounts = visRelCounts.value;
    const activeElem = getActiveElemTypes();
    const activeRel = getActiveRelTypes();
    const showElem = showAllElem.value;
    const showRel = showAllRel.value;
    updateElemFilterDim(scopeCounts, showElem);
    updateRelFilterCounts(visCounts, activeElem, activeRel, showRel);
  });
}
