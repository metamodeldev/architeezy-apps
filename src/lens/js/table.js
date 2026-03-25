// ── TABLE VIEW ─────────────────────────────────────────────────────────────

import { state } from './state.js';
import { elemColor, relColor, escHtml } from './utils.js';
import { t } from './i18n.js';
import { switchView } from './ui.js';
import { showDetail } from './detail.js';
import { FOCUS_ZOOM } from './constants.js';

/**
 * Switches the active table tab (elements or relationships). Resets the sort state and re-renders the table.
 *
 * @param {'elements' | 'relationships'} tab - The tab to activate.
 */
export function switchTableTab(tab) {
  state.currentTTab = tab;
  state.tableSortCol = undefined;
  document.getElementById('ttab-elements').classList.toggle('active', tab === 'elements');
  document.getElementById('ttab-rels').classList.toggle('active', tab === 'relationships');
  document.getElementById('table-search').value = '';
  renderTable();
}

/**
 * Renders the table for the currently active tab, applying the search query from `#table-search` and the current sort
 * state.
 */
export function renderTable() {
  const q = document.getElementById('table-search').value.toLowerCase();
  const head = document.getElementById('table-head');
  const body = document.getElementById('table-body');
  if (state.currentTTab === 'elements') {
    renderElemsTable(q, head, body);
  } else {
    renderRelsTable(q, head, body);
  }
}

// ── SHARED HELPERS ──────────────────────────────────────────────────────────

/**
 * Returns the HTML string for the table header row with sort icons.
 *
 * @param {string[]} cols - Column header labels.
 * @returns {string} HTML for a `<tr>` containing `<th>` elements.
 */
function thHtml(cols) {
  return (
    '<tr>' +
    cols
      .map((c, i) => {
        const sorted = state.tableSortCol === i;
        return `<th class="${sorted ? 'sorted' : ''}" data-col="${i}">
      ${escHtml(c)} <span class="sort-icon">${sorted ? (state.tableSortAsc ? '▲' : '▼') : '⇅'}</span></th>`;
      })
      .join('') +
    '</tr>'
  );
}

/**
 * Attaches click handlers to all `<th>` elements in `#table-head` to toggle sort column and direction, then re-renders
 * the table.
 */
function bindSortClicks() {
  document.querySelectorAll('#table-head th').forEach((th) =>
    th.addEventListener('click', () => {
      const col = Number(th.dataset.col);
      state.tableSortAsc = state.tableSortCol === col ? !state.tableSortAsc : true;
      state.tableSortCol = col;
      renderTable();
    }),
  );
}

/**
 * Sorts `rows` by column index using `getKey(row) → string`. Returns the original array if no sort column is selected.
 *
 * @template T
 * @param {T[]} rows - Rows to sort.
 * @param {function(T): string | undefined} getKey - Extracts the sort key for a row.
 * @returns {T[]} Sorted copy (or original array when no sort is active).
 */
function sortRows(rows, getKey) {
  if (state.tableSortCol === undefined) {
    return rows;
  }
  return [...rows].sort((a, b) => {
    const av = getKey(a) ?? '';
    const bv = getKey(b) ?? '';
    return state.tableSortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
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

/**
 * Attaches a click handler to each data row in `body` that calls `focusNode`.
 *
 * @param {HTMLTableSectionElement} body - The `<tbody>` element containing rows.
 */
function bindRowClicks(body) {
  body.querySelectorAll('tr[data-id]').forEach((tr) => tr.addEventListener('click', () => focusNode(tr.dataset.id)));
}

// ── ELEMENT TABLE ───────────────────────────────────────────────────────────

/**
 * Renders the elements table filtered by `q`, respecting the active element type filter and the current drill scope.
 *
 * @param {string} q - Lowercase search query.
 * @param {HTMLElement} head - The `<thead>` element.
 * @param {HTMLElement} body - The `<tbody>` element.
 */
function renderElemsTable(q, head, body) {
  head.innerHTML = thHtml([t('colName'), t('colType'), t('colDoc')]);
  bindSortClicks();

  const colKeys = ['name', 'type', 'doc'];

  let rows = state.allElements.filter(
    (e) =>
      state.activeElemTypes.has(e.type) &&
      (!state.drillVisibleIds || state.drillVisibleIds.has(e.id)) &&
      (!q || [e.name, e.type, e.ns, e.doc].some((v) => v?.toLowerCase().includes(q))),
  );

  rows = sortRows(rows, (e) => e[colKeys[state.tableSortCol]] ?? '');
  updateTableCount(rows.length, state.allElements.length);

  body.innerHTML = rows
    .map((e) => {
      const c = elemColor(e.type);
      return `<tr data-id="${e.id}">
      <td>${escHtml(e.name)}</td>
      <td><span class="type-badge" style="background:${c}33;color:${c}">${escHtml(e.type)}</span></td>
      <td class="wrap">${escHtml(e.doc) || '—'}</td>
    </tr>`;
    })
    .join('');

  bindRowClicks(body);
}

// ── RELATIONSHIP TABLE ──────────────────────────────────────────────────────

/**
 * Renders the relationships table filtered by `q`, respecting active type filters and the current drill scope.
 *
 * @param {string} q - Lowercase search query.
 * @param {HTMLElement} head - The `<thead>` element.
 * @param {HTMLElement} body - The `<tbody>` element.
 */
function renderRelsTable(q, head, body) {
  head.innerHTML = thHtml([t('colSource'), t('colRelType'), t('colTarget'), t('colRelName')]);
  bindSortClicks();

  let rows = state.allRelations.filter((r) => {
    if (!state.activeRelTypes.has(r.type)) {
      return false;
    }
    const srcType = state.elemMap[r.source]?.type;
    const tgtType = state.elemMap[r.target]?.type;
    if (srcType && !state.activeElemTypes.has(srcType)) {
      return false;
    }
    if (tgtType && !state.activeElemTypes.has(tgtType)) {
      return false;
    }
    if (state.drillVisibleIds && (!state.drillVisibleIds.has(r.source) || !state.drillVisibleIds.has(r.target))) {
      return false;
    }
    if (!q) {
      return true;
    }
    const src = state.elemMap[r.source]?.name ?? '';
    const tgt = state.elemMap[r.target]?.name ?? '';
    return [src, r.type, tgt, r.name].some((v) => v?.toLowerCase().includes(q));
  });

  rows = sortRows(rows, (r) => {
    const vals = [state.elemMap[r.source]?.name ?? '', r.type, state.elemMap[r.target]?.name ?? '', r.name ?? ''];
    return vals[state.tableSortCol] ?? '';
  });

  updateTableCount(rows.length, state.allRelations.length);

  body.innerHTML = rows
    .map((r) => {
      const src = state.elemMap[r.source]?.name ?? r.source;
      const tgt = state.elemMap[r.target]?.name ?? r.target;
      const c = relColor(r.type);
      return `<tr data-id="${r.source}">
      <td>${escHtml(src)}</td>
      <td><span class="type-badge" style="background:${c}33;color:${c}">${escHtml(r.type)}</span></td>
      <td>${escHtml(tgt)}</td>
      <td>${escHtml(r.name) || '—'}</td>
    </tr>`;
    })
    .join('');

  bindRowClicks(body);
}

// ── FOCUS NODE ──────────────────────────────────────────────────────────────

/**
 * Switches to the graph view, animates the camera to the node with `id`, selects it, and opens its detail panel.
 *
 * @param {string} id - ID of the element to focus.
 */
export function focusNode(id) {
  switchView('graph', undefined);
  requestAnimationFrame(() => {
    state.cy?.resize();
    const node = state.cy?.$id(id);
    if (!node?.length) {
      return;
    }
    // Always zoom to FOCUS_ZOOM so the node is comfortably visible regardless
    // of the current zoom level (whether it was very far in or out).
    state.cy.animate({ center: { eles: node }, zoom: FOCUS_ZOOM }, { duration: 400 });
    node.select();
    showDetail(id, undefined);
  });
}
