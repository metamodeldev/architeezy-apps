// ── TABLE VIEW ─────────────────────────────────────────────────────────────

import { showDetail } from './detail.js';
import { getDrillVisibleIds } from './drill.js';
import { getActiveElemTypes, getActiveRelTypes } from './filters.js';
import { focusCyNode } from './graph.js';
import { t } from './i18n.js';
import { getAllElements, getAllRelations, getElemMap } from './model.js';
import { elemColor, relColor } from './palette.js';
import { switchView, showToast, getCurrentView } from './ui.js';
import { escHtml } from './utils.js';

// Table UI state — owned here, not in global state.
let _currentTTab = 'elements';
let _sortCol;
let _sortAsc = true;

/**
 * Switches the active table tab (elements or relationships). Resets the sort state and re-renders
 * the table.
 *
 * @param {'elements' | 'relationships'} tab - The tab to activate.
 */
export function switchTableTab(tab) {
  _currentTTab = tab;
  _sortCol = undefined;
  document.getElementById('ttab-elements').classList.toggle('active', tab === 'elements');
  document.getElementById('ttab-rels').classList.toggle('active', tab === 'relationships');
  document.getElementById('table-search').value = '';
  renderTable();
}

/**
 * Renders the table for the currently active tab, applying the search query from `#table-search`
 * and the current sort state.
 */
export function renderTable() {
  const q = document.getElementById('table-search').value.toLowerCase();
  const head = document.getElementById('table-head');
  const body = document.getElementById('table-body');
  if (_currentTTab === 'elements') {
    renderElemsTable(q, head, body);
  } else {
    renderRelsTable(q, head, body);
  }
  updateExportButtonState();
}

// ── SHARED HELPERS ──────────────────────────────────────────────────────────

/**
 * Pure: returns the HTML string for the table header row with sort icons.
 *
 * @param {string[]} cols - Column header labels.
 * @param {number | undefined} sortCol - Index of the currently sorted column.
 * @param {boolean} sortAsc - True if sorted ascending.
 * @returns {string} HTML for a `<tr>` containing `<th>` elements.
 */
function thHtml(cols, sortCol, sortAsc) {
  return `<tr>${cols
    .map((c, i) => {
      const sorted = sortCol === i;
      return `<th class="${sorted ? 'sorted' : ''}" data-col="${i}">
      ${escHtml(c)} <span class="sort-icon">${sorted ? (sortAsc ? '▲' : '▼') : '⇅'}</span></th>`;
    })
    .join('')}</tr>`;
}

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
    const col = Number(th.dataset.col);
    _sortAsc = _sortCol === col ? !_sortAsc : true;
    _sortCol = col;
    renderTable();
  });

  document.getElementById('table-body').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) {
      focusNode(tr.dataset.id);
    }
  });
}

/**
 * Pure: sorts `rows` by column index using `getKey(row) → string`. Returns the original array if no
 * sort column is selected.
 *
 * @template T
 * @param {T[]} rows - Rows to sort.
 * @param {function(T): string | undefined} getKey - Extracts the sort key for a row.
 * @param {number | undefined} sortCol - Index of the sorted column.
 * @param {boolean} sortAsc - True if sorted ascending.
 * @returns {T[]} Sorted copy (or original array when no sort is active).
 */
function sortRows(rows, getKey, sortCol, sortAsc) {
  if (sortCol === undefined) {
    return rows;
  }
  return [...rows].toSorted((a, b) => {
    const av = getKey(a) ?? '';
    const bv = getKey(b) ?? '';
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

/**
 * Updates the `#table-count` element with "visible / total" text.
 *
 * @param {number} visible - Number of rows currently shown.
 * @param {number} total - Total row count before filtering.
 */
function updateTableCount(visible, total) {
  document.getElementById('table-count').textContent =
    visible === total ? `${visible}` : `${visible} / ${total}`;
}

// ── ELEMENT TABLE ───────────────────────────────────────────────────────────

/**
 * Renders the elements table filtered by `q`, respecting the active element type filter and the
 * current drill scope.
 *
 * @param {string} q - Lowercase search query.
 * @param {HTMLElement} head - The `<thead>` element.
 * @param {HTMLElement} body - The `<tbody>` element.
 */
function renderElemsTable(q, head, body) {
  head.innerHTML = thHtml([t('colName'), t('colType'), t('colDoc')], _sortCol, _sortAsc);

  const colKeys = ['name', 'type', 'doc'];

  const activeElemTypes = getActiveElemTypes();
  const drillVisibleIds = getDrillVisibleIds();
  const allElements = getAllElements();
  let rows = allElements.filter(
    (e) =>
      activeElemTypes.has(e.type) &&
      (!drillVisibleIds || drillVisibleIds.has(e.id)) &&
      (!q || [e.name, e.type, e.ns, e.doc].some((v) => v?.toLowerCase().includes(q))),
  );

  rows = sortRows(rows, (e) => e[colKeys[_sortCol]] ?? '', _sortCol, _sortAsc);
  updateTableCount(rows.length, allElements.length);

  body.innerHTML = rows
    .map((e) => {
      const c = elemColor(e.type);
      return `<tr data-id="${e.id}">
      <td>${escHtml(e.name)}</td>
      <td><span class="type-badge" style="--type-bg:${c}33;--type-color:${c}">${escHtml(e.type)}</span></td>
      <td class="wrap">${escHtml(e.doc) || '—'}</td>
    </tr>`;
    })
    .join('');
}

// ── RELATIONSHIP TABLE ──────────────────────────────────────────────────────

/**
 * Renders the relationships table filtered by `q`, respecting active type filters and the current
 * drill scope.
 *
 * @param {string} q - Lowercase search query.
 * @param {HTMLElement} head - The `<thead>` element.
 * @param {HTMLElement} body - The `<tbody>` element.
 */
function renderRelsTable(q, head, body) {
  head.innerHTML = thHtml(
    [t('colSource'), t('colRelType'), t('colTarget'), t('colRelName')],
    _sortCol,
    _sortAsc,
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
      return vals[_sortCol] ?? '';
    },
    _sortCol,
    _sortAsc,
  );

  updateTableCount(rows.length, allRelations.length);

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

// ── FOCUS NODE ──────────────────────────────────────────────────────────────

/**
 * Switches to the graph view, animates the camera to the node with `id`, selects it, and opens its
 * detail panel.
 *
 * @param {string} id - ID of the element to focus.
 */
export function focusNode(id) {
  switchView('graph');
  requestAnimationFrame(() => {
    if (focusCyNode(id)) {
      showDetail(id);
    }
  });
}

// ── EXPORT CSV ────────────────────────────────────────────────────────────────

/**
 * Escapes a CSV field according to RFC 4180.
 *
 * @param {string} field - The value to escape.
 * @returns {string} The escaped CSV field string.
 */
function escapeCsvField(field) {
  if (field === undefined) {
    return '';
  }
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

/** Updates the disabled state of the Export CSV button based on current view and model presence. */
export function updateExportButtonState() {
  const btn = document.getElementById('export-csv-btn');
  if (!btn) {
    return;
  }
  const inTableView = getCurrentView() === 'table';
  const hasModel = getAllElements().length > 0;
  btn.disabled = !(inTableView && hasModel);
}

/**
 * Builds a CSV blob from the given headers and rows and triggers a browser download.
 *
 * @param {string[]} headers - Column header labels.
 * @param {string[][]} rows - Table row data.
 * @param {string} type - Export type label used in the filename.
 */
function buildAndDownloadCsv(headers, rows, type) {
  const csvContent = [
    headers.map((h) => escapeCsvField(h)).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvField(cell)).join(',')),
  ].join('\n');
  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const modelName =
    document.getElementById('current-model-name').textContent.replaceAll(/[^\w\s-]/g, '') ||
    'model';
  const timestamp = new Date().toISOString().replaceAll(/[:]/g, '-').slice(0, 19);
  a.download = `architeezy-${modelName}-${type}-${timestamp}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Exports the currently visible table data as a CSV file. */
export async function exportCSV() {
  const btn = document.getElementById('export-csv-btn');
  if (btn) {
    btn.disabled = true;
  }

  const loadingEl = document.getElementById('export-loading');
  if (loadingEl) {
    loadingEl.classList.remove('hidden');
  }

  // Yield to the event loop to allow UI to reflect the disabled state
  // Slightly longer delay to ensure the loading indicator is detectable in tests
  // oxlint-disable-next-line promise/avoid-new
  await new Promise((resolve) => {
    setTimeout(resolve, 200);
  });

  try {
    // Verify we are in table view
    if (getCurrentView() !== 'table') {
      showToast('Switch to table view to export');
      return;
    }

    // Determine active tab (elements or relationships) for filename
    const activeTabBtn = document.querySelector('.table-tab-btn.active');
    const activeTab = activeTabBtn?.dataset.tab || 'elements';
    const type = activeTab === 'elements' ? 'elements' : 'relationships';

    // Get headers from table head
    const headerCells = document.querySelectorAll('#table-head th');
    const headers = [...headerCells].map((th) => th.textContent.trim());

    // Get data rows from table body
    const rows = [];
    for (const tr of document.querySelectorAll('#table-body tr')) {
      const cells = [...tr.querySelectorAll('td')].map((td) => td.textContent.trim());
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    buildAndDownloadCsv(headers, rows, type);
    showToast('CSV exported successfully');
  } catch (error) {
    console.error('Export failed', error);
    showToast('Export failed: ' + error.message);
  } finally {
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
    if (btn) {
      btn.disabled = false;
    }
  }
}
