/**
 * DOM rendering and event handling for filter checkboxes.
 *
 * @module filter/ui
 * @package
 */

// oxlint-disable-next-line import/no-restricted-imports
import { applyDisplayState } from '../graph/display.js';
// oxlint-disable-next-line import/no-restricted-imports
import { updateStats } from '../graph/controls.js';
import { getContainmentMode, isGraphLoaded } from '../graph/index.js';
import { getAllElements, getAllRelations, getElemMap, getElementsByTypes } from '../model/index.js';
import { elemColor, relColor } from '../palette.js';
import { escHtml } from '../utils.js';
import {
  computeVisRelCounts,
  getActiveElemTypes,
  getActiveRelTypes,
  getElemTypeTotals,
  getRelTypeTotals,
  getShowAllElem,
  getShowAllRel,
  loadFilterStateFromStorage,
  saveFilterStateToStorage,
  setAllElemTypes,
  setAllRelTypes,
  setFilterTypes,
  setShowAllElem,
  setShowAllRel,
  toggleElemType,
  toggleRelType,
} from './state.js';
// oxlint-disable-next-line import/no-restricted-imports
import { getDrillNodeId, getDrillScopeIds, getDrillVisibleIds } from '../drill-down/state.js';

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
  const showAll = kind === 'elem' ? getShowAllElem() : getShowAllRel();
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

/** Updates element filter dim state. */
export function updateElemFilterDim() {
  const drillNodeId = getDrillNodeId();
  const scopeIds = getDrillScopeIds();
  const useDrillScope = drillNodeId !== undefined && scopeIds;
  let scopeCounts;
  if (useDrillScope) {
    scopeCounts = {};
    for (const e of getAllElements()) {
      if (scopeIds.has(e.id)) {
        scopeCounts[e.type] = (scopeCounts[e.type] ?? 0) + 1;
      }
    }
  }

  const showAll = getShowAllElem();
  const searchInput = document.getElementById('elem-filter-search');
  const searchActive = searchInput?.value.trim();

  for (const el of document.querySelectorAll('[data-kind="elem"]')) {
    const item = el.closest('.filter-item');
    if (!item) {
      continue;
    }
    const type = item.dataset.type;
    const total = getElemTypeTotals()[type] ?? 0;
    const available = useDrillScope && scopeCounts ? (scopeCounts[type] ?? 0) : total;
    const countEl = item.querySelector('.count');
    if (countEl) {
      countEl.textContent =
        useDrillScope && scopeCounts && available !== total
          ? `${available} / ${total}`
          : `${total}`;
    }
    const checked = el.checked;
    item.classList.toggle('dim', available === 0);
    if (!searchActive) {
      item.classList.toggle('hidden', available === 0 && !checked && !showAll);
    }
  }
}

/** Updates relationship filter dim state. */
export function updateRelFilterCounts() {
  const activeElemTypes = getActiveElemTypes();
  const activeRelTypes = getActiveRelTypes();
  const drillVisibleIds = getDrillVisibleIds();

  const visCounts = computeVisRelCounts({
    allRelations: getAllRelations(),
    elemMap: getElemMap(),
    activeElemTypes,
    drillVisibleIds,
  });

  const showAll = getShowAllRel();
  const searchInput = document.getElementById('rel-filter-search');
  const searchActive = searchInput?.value.trim();

  for (const el of document.querySelectorAll('[data-kind="rel"]')) {
    const item = el.closest('.filter-item');
    if (!item) {
      continue;
    }
    const type = item.dataset.type;
    const total = getRelTypeTotals()[type] ?? 0;
    const vis = visCounts[type] ?? 0;
    const countEl = item.querySelector('.count');
    if (countEl) {
      countEl.textContent = vis === total ? `${total}` : `${vis} / ${total}`;
    }
    item.classList.toggle('dim', vis === 0 && activeRelTypes.has(type));
    if (!searchActive) {
      item.classList.toggle('hidden', vis === 0 && !activeRelTypes.has(type) && !showAll);
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

  applyVisibility(); // Will dispatch visibility change
  saveFilterStateToStorage();
  document.dispatchEvent(new CustomEvent('routing:sync'));
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
    updateElemFilterDim();
  } else {
    updateRelFilterCounts();
  }
  saveFilterStateToStorage();
  document.dispatchEvent(new CustomEvent('routing:sync'));
}

function handleFilterSearch(e, kind) {
  const query = e.target.value;
  filterSearch(kind, query);
  if (query.trim() === '') {
    if (kind === 'elem') {
      updateElemFilterDim();
    } else {
      updateRelFilterCounts();
    }
  }
}

function handleShowAllChange(e, kind) {
  if (kind === 'elem') {
    setShowAllElem(e.target.checked);
    const query = document.getElementById('elem-filter-search').value;
    filterSearch('elem', query);
    updateElemFilterDim();
  } else {
    setShowAllRel(e.target.checked);
    const query = document.getElementById('rel-filter-search').value;
    filterSearch('rel', query);
    updateRelFilterCounts();
  }
}

// ============ VISIBILITY APPLICATION ============

/**
 * Computes visibility based on current filter state and current drill mode.
 * Updates filter UI dims and dispatches filter:changed event.
 */
export function applyVisibility() {
  if (!isGraphLoaded()) {
    return;
  }

  // If drill mode is active, do nothing; drill will handle visibility
  if (getDrillNodeId() !== undefined) {
    return;
  }

  // Update filter dims (shows counts considering drill, but no drill -> full counts)
  updateElemFilterDim();
  updateRelFilterCounts();

  const activeElemTypes = getActiveElemTypes();
  const activeRelTypes = getActiveRelTypes();
  const visibleNodeIds = new Set(getElementsByTypes(activeElemTypes).map((e) => e.id));

  if (getContainmentMode() === 'compound') {
    for (const e of getAllElements()) {
      if (e.parent && !visibleNodeIds.has(e.id) && !visibleNodeIds.has(e.parent)) {
        visibleNodeIds.add(e.id);
      }
    }
  }

  const elemMap = getElemMap();

  function isEdgeVisible(srcId, tgtId, type, isContainment) {
    const srcType = elemMap[srcId]?.type;
    const tgtType = elemMap[tgtId]?.type;
    const srcOk = srcType !== undefined && activeElemTypes.has(srcType);
    const tgtOk = tgtType !== undefined && activeElemTypes.has(tgtType);
    return isContainment ? srcOk && tgtOk : srcOk && tgtOk && activeRelTypes.has(type);
  }

  applyDisplayState({ visibleNodeIds, isEdgeVisible });
  updateStats(getAllElements(), getAllRelations());
  document.dispatchEvent(new CustomEvent('graph:visibilityApplied'));
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
  registerGlobalListeners();
}

/**
 * Initializes filter module: wires DOM events and registers global listeners. UI building and state
 * initialization happen on model:loaded event. Also applies initial visibility.
 *
 * @param {object} _cy - Cytoscape instance (may be unused).
 */
export function initFilter(_cy) {
  wireFilterEvents();
  registerGlobalListeners();
  applyVisibility();
}

/** Wires DOM events (search inputs, show all checkboxes). */
export function wireFilterEvents() {
  document
    .getElementById('elem-filter-search')
    .addEventListener('input', (e) => handleFilterSearch(e, 'elem'));
  document
    .getElementById('rel-filter-search')
    .addEventListener('input', (e) => handleFilterSearch(e, 'rel'));
  document
    .getElementById('elem-show-all')
    .addEventListener('change', (e) => handleShowAllChange(e, 'elem'));
  document
    .getElementById('rel-show-all')
    .addEventListener('change', (e) => handleShowAllChange(e, 'rel'));
}

/** Registers global event listeners. */
function registerGlobalListeners() {
  // React to drill changes to update dim counts
  document.addEventListener('drill:entered', () => {
    updateElemFilterDim();
    updateRelFilterCounts();
  });
  document.addEventListener('drill:exited', () => {
    updateElemFilterDim();
    updateRelFilterCounts();
    // After exiting drill, re-apply filter visibility
    applyVisibility();
  });
  // DepthChanged event is optional; drill:entered already updates dims.
  // We include it for robustness.
  document.addEventListener('drill:depthChanged', () => {
    updateElemFilterDim();
    updateRelFilterCounts();
  });

  // Highlight cleared: re-apply normal filter visibility
  document.addEventListener('highlight:cleared', () => {
    applyVisibility();
  });

  // Bulk select/deselect from sidebar buttons
  document.addEventListener('filter:selectAll', (e) => {
    selectAll(e.detail.kind, e.detail.select);
  });
}

