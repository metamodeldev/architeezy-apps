/**
 * DOM rendering and event handling for table view.
 *
 * @module table/ui
 * @package
 */

import { getDrillVisibleIds } from '../drill-down/index.js';
import { getActiveElemTypes, getActiveRelTypes } from '../filter/index.js';
import { focusCyNode } from '../graph/index.js';
import { t } from '../i18n.js';
import { getAllRelations, getElemMap, getElementsByTypes } from '../model/index.js';
import { elemColor, relColor } from '../palette.js';
import { syncUrl } from '../routing/index.js';
import { searchState } from '../search/index.js';
import { getCurrentView } from '../ui/index.js';
import { escHtml } from '../utils.js';
import { exportCSV, updateExportButtonState } from './csv.js';
import {
  getCurrentTTab,
  getSortAsc,
  getSortCol,
  handleSortClick,
  resetSortState,
  setCurrentTTab,
  sortRows,
  thHtml,
} from './state.js';

/**
 * Switches the active table tab (elements or relationships). Resets the sort state and re-renders
 * the table.
 *
 * @param {'elements' | 'relationships'} tab - The tab to activate.
 */
export function switchTableTab(tab) {
  setCurrentTTab(tab);
  resetSortState();
  document.getElementById('ttab-elements').classList.toggle('active', tab === 'elements');
  document.getElementById('ttab-rels').classList.toggle('active', tab === 'relationships');
  renderTable();
}

/**
 * Renders the table for the currently active tab, applying the global search query and the current
 * sort state.
 */
export function renderTable() {
  const q = searchState.query.toLowerCase();
  const head = document.getElementById('table-head');
  const body = document.getElementById('table-body');
  if (getCurrentTTab() === 'elements') {
    renderElemsTable(q, head, body);
  } else {
    renderRelsTable(q, head, body);
  }
  updateExportButtonState();

  // Show/hide no-results message
  const noResultsEl = document.getElementById('no-results');
  const hasRows = body.children.length > 0;
  if (noResultsEl) {
    noResultsEl.classList.toggle('hidden', hasRows);
  }
}

// ── ELEMENT TABLE ────────────────────────────────────────────────────────────

/**
 * Renders the elements table filtered by `q`, respecting the active element type filter and the
 * current drill scope.
 *
 * @param {string} q - Lowercase search query.
 * @param {HTMLElement} head - The `<thead>` element.
 * @param {HTMLElement} body - The `<tbody>` element.
 */
function renderElemsTable(q, head, body) {
  const sortCol = getSortCol();
  const sortAsc = getSortAsc();

  head.innerHTML = thHtml(
    [t('colName'), t('colType'), t('colStatus'), t('colOwner')],
    sortCol,
    sortAsc,
  );

  const colKeys = ['name', 'type', 'status', 'owner'];

  const activeElemTypes = getActiveElemTypes();
  const drillVisibleIds = getDrillVisibleIds();
  let rows = getElementsByTypes(activeElemTypes).filter(
    (e) =>
      (!drillVisibleIds || drillVisibleIds.has(e.id)) &&
      (!q || [e.name, e.type, e.status, e.owner, e.ns].some((v) => v?.toLowerCase().includes(q))),
  );

  rows = sortRows(rows, (e) => e[colKeys[sortCol]] ?? '', sortCol, sortAsc);

  body.innerHTML = rows
    .map((e) => {
      const c = elemColor(e.type);
      return `<tr data-id="${e.id}">
      <td>${escHtml(e.name)}</td>
      <td><span class="type-badge" style="--type-bg:${c}33;--type-color:${c}">${escHtml(e.type)}</span></td>
      <td>${escHtml(e.status) || '—'}</td>
      <td>${escHtml(e.owner) || '—'}</td>
    </tr>`;
    })
    .join('');
}

// ── RELATIONSHIP TABLE ───────────────────────────────────────────────────────

/**
 * Renders the relationships table filtered by `q`, respecting active type filters and the current
 * drill scope.
 *
 * @param {string} q - Lowercase search query.
 * @param {HTMLElement} head - The `<thead>` element.
 * @param {HTMLElement} body - The `<tbody>` element.
 */
function renderRelsTable(q, head, body) {
  const sortCol = getSortCol();
  const sortAsc = getSortAsc();

  head.innerHTML = thHtml(
    [t('colSource'), t('colRelType'), t('colTarget'), t('colRelName')],
    sortCol,
    sortAsc,
  );

  const activeElemTypes = getActiveElemTypes();
  const activeRelTypes = getActiveRelTypes();
  const drillVisibleIds = getDrillVisibleIds();
  const elemMap = getElemMap();
  const allRelations = getAllRelations();
  let rows = allRelations.filter((r) => {
    if (!activeRelTypes.has(r.type)) {
      return false;
    }
    const srcType = elemMap[r.source]?.type;
    const tgtType = elemMap[r.target]?.type;
    if (srcType && !activeElemTypes.has(srcType)) {
      return false;
    }
    if (tgtType && !activeElemTypes.has(tgtType)) {
      return false;
    }
    if (drillVisibleIds && (!drillVisibleIds.has(r.source) || !drillVisibleIds.has(r.target))) {
      return false;
    }
    if (!q) {
      return true;
    }
    const src = elemMap[r.source]?.name ?? '';
    const tgt = elemMap[r.target]?.name ?? '';
    return [src, r.type, tgt, r.name].some((v) => v?.toLowerCase().includes(q));
  });

  rows = sortRows(
    rows,
    (r) => {
      const vals = [
        elemMap[r.source]?.name ?? '',
        r.type,
        elemMap[r.target]?.name ?? '',
        r.name ?? '',
      ];
      return vals[sortCol] ?? '';
    },
    sortCol,
    sortAsc,
  );

  body.innerHTML = rows
    .map((r) => {
      const src = elemMap[r.source]?.name ?? r.source;
      const tgt = elemMap[r.target]?.name ?? r.target;
      const c = relColor(r.type);
      return `<tr data-id="${r.source}">
      <td>${escHtml(src)}</td>
      <td><span class="type-badge" style="--type-bg:${c}33;--type-color:${c}">${escHtml(r.type)}</span></td>
      <td>${escHtml(tgt)}</td>
      <td>${escHtml(r.name) || '—'}</td>
    </tr>`;
    })
    .join('');
}

// ── FOCUS NODE ───────────────────────────────────────────────────────────────

/**
 * Switches to the graph view, animates the camera to the node with `id`, selects it, and opens its
 * detail panel.
 *
 * @param {string} id - ID of the element to focus.
 */
export function focusNode(id) {
  document.dispatchEvent(new CustomEvent('view:switchRequest', { detail: { view: 'graph' } }));
  // Sync URL to reflect new view (remove view=table parameter)
  syncUrl({ push: true });
  requestAnimationFrame(() => {
    if (focusCyNode(id)) {
      document.dispatchEvent(new CustomEvent('detail:requestShow', { detail: { nodeId: id } }));
    }
  });
}

// ── EVENTS ───────────────────────────────────────────────────────────────────

/**
 * Wires delegated click listeners on `#table-head` and `#table-body`. Called once at app startup —
 * handles all dynamically rendered rows and headers via event delegation.
 */
export function initTableEvents() {
  document.getElementById('table-head').addEventListener('click', (e) => {
    const th = e.target.closest('th[data-col]');
    if (!th) {
      return;
    }
    handleSortClick(Number(th.dataset.col));
    renderTable();
  });

  document.getElementById('table-body').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) {
      focusNode(tr.dataset.id);
    }
  });
}

/** Wires table-related UI events: tab clicks, row interactions, and CSV export. */
export function wireTableEvents() {
  document.querySelector('.table-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.table-tab-btn[data-tab]');
    if (btn) {
      switchTableTab(btn.dataset.tab);
    }
  });
  initTableEvents();

  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportCSV);
  }
}

/**
 * Main initialization entry point for the table module.
 * Wires DOM events and registers global listeners.
 */
export function initTable() {
  wireTableEvents();

  // Register event listeners for search-triggered table re-renders
  if (typeof document !== 'undefined') {
    document.addEventListener('search:renderTable', renderTable);
    // Re-render table when view changes to table
    document.addEventListener('view:changed', () => {
      if (getCurrentView() === 'table') {
        renderTable();
      }
    });
    // Re-render table when visibility changes (filter/drill) if in table view
    document.addEventListener('graph:visibilityApplied', () => {
      if (getCurrentView() === 'table') {
        renderTable();
      }
    });
  }
}

/** Initializes table module: wires DOM events. (deprecated - use initTable()) */
export function init() {
  // For backwards compatibility, call initTable()
  initTable();
}
