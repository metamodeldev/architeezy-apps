// ── TABLE VIEW ─────────────────────────────────────────────────────────────

import { showDetail } from './detail.js';
import { getDrillVisibleIds } from './drill.js';
import { getActiveElemTypes, getActiveRelTypes } from './filters.js';
import { focusCyNode } from './graph.js';
import { t } from './i18n.js';
import { getAllElements, getAllRelations, getElemMap } from './model.js';
import { elemColor, relColor } from './palette.js';
import { escHtml, switchView } from './ui.js';

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
  document.getElementById('table-count').textContent = `${visible} / ${total}`;
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
