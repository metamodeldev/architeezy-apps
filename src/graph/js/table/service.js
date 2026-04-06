/**
 * Table service: state management, filtering, sorting, and data preparation.
 *
 * Reactive service that manages table state using signals and computed values. Separated from DOM
 * operations for clean architecture.
 *
 * @module table/service
 * @package
 */

import { getActiveElemTypes, getActiveRelTypes } from '../filter/index.js';
import { drillVisibleIds } from '../graph/index.js';
import { t } from '../i18n.js';
import { getElementsByTypes, getElemMap, getModelName, getRelations } from '../model/index.js';
import { showToast } from '../notification/index.js';
import { elemColor, relColor } from '../palette.js';
import { query } from '../search/index.js';
import { computed, signal } from '../signals/index.js';
import { escHtml } from '../utils.js';

// ── PRIVATE SIGNALS ────────────────────────────────────────────────────────────

const _currentTab = signal('elements');
const _sortCol = signal(); // Sort column (number | undefined)
const _sortAsc = signal(true);

// ── PUBLIC COMPUTED ────────────────────────────────────────────────────────────

/**
 * Filtered and sorted elements for current table view.
 *
 * @type {ComputedSignal<object[]>}
 */
export const filteredElements = computed(() => {
  const q = query.value.toLowerCase();
  const activeElemTypes = getActiveElemTypes();
  const drillVisibleIdsVal = drillVisibleIds.value;
  const sortCol = _sortCol.value;
  const sortAsc = _sortAsc.value;

  let elements = getElementsByTypes(activeElemTypes).filter(
    (e) =>
      (!drillVisibleIdsVal || drillVisibleIdsVal.has(e.id)) &&
      (!q || [e.name, e.type, e.status, e.owner, e.ns].some((v) => v?.toLowerCase().includes(q))),
  );

  if (sortCol !== undefined) {
    const colKeys = ['name', 'type', 'status', 'owner'];
    elements = [...elements].toSorted((a, b) => {
      const av = (a[colKeys[sortCol]] ?? '').toString().toLowerCase();
      const bv = (b[colKeys[sortCol]] ?? '').toString().toLowerCase();
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  return elements;
});

/**
 * Filtered and sorted relations for current table view.
 *
 * @type {ComputedSignal<object[]>}
 */
export const filteredRelations = computed(() => {
  const q = query.value.toLowerCase();
  const activeElemTypes = getActiveElemTypes();
  const activeRelTypes = getActiveRelTypes();
  const drillVisibleIdsVal = drillVisibleIds.value;
  const sortCol = _sortCol.value;
  const sortAsc = _sortAsc.value;
  const elemMap = getElemMap();
  const allRelations = getRelations();

  let relations = allRelations.filter((r) => {
    if (!activeRelTypes.has(r.type)) {
      return false;
    }
    const srcType = elemMap.get(r.source)?.type;
    const tgtType = elemMap.get(r.target)?.type;
    if (srcType && !activeElemTypes.has(srcType)) {
      return false;
    }
    if (tgtType && !activeElemTypes.has(tgtType)) {
      return false;
    }
    if (
      drillVisibleIdsVal &&
      (!drillVisibleIdsVal.has(r.source) || !drillVisibleIdsVal.has(r.target))
    ) {
      return false;
    }
    if (!q) {
      return true;
    }
    const src = elemMap.get(r.source)?.name ?? '';
    const tgt = elemMap.get(r.target)?.name ?? '';
    return [src, r.type, tgt, r.name].some((v) => v?.toLowerCase().includes(q));
  });

  if (sortCol !== undefined) {
    relations = [...relations].toSorted((a, b) => {
      const valsA = [
        elemMap.get(a.source)?.name ?? '',
        a.type,
        elemMap.get(a.target)?.name ?? '',
        a.name ?? '',
      ].map((v) => v.toString().toLowerCase());
      const valsB = [
        elemMap.get(b.source)?.name ?? '',
        b.type,
        elemMap.get(b.target)?.name ?? '',
        b.name ?? '',
      ].map((v) => v.toString().toLowerCase());
      return sortAsc
        ? valsA[sortCol].localeCompare(valsB[sortCol])
        : valsB[sortCol].localeCompare(valsA[sortCol]);
    });
  }

  return relations;
});

/**
 * True if currently showing elements tab.
 *
 * @type {ComputedSignal<boolean>}
 */
export const isElementsTab = computed(() => _currentTab.value === 'elements');

// ── READERS (getters) ───────────────────────────────────────────────────────────

export function getCurrentTab() {
  return _currentTab.value;
}

export function getSortCol() {
  return _sortCol.value;
}

export function getSortAsc() {
  return _sortAsc.value;
}

// ── ACTIONS ────────────────────────────────────────────────────────────────────

/**
 * Switches to the specified tab.
 *
 * @param {'elements' | 'relationships'} tab - Tab to switch to.
 */
export function setCurrentTab(tab) {
  _currentTab.value = tab;
  clearSort();
}

/**
 * Handles sort column click.
 *
 * @param {number} col - Column index (0-based)
 */
export function handleSortClick(col) {
  _sortAsc.value = _sortCol.value === col ? !_sortAsc.value : true;
  _sortCol.value = col;
}

/** Clears sort state (resets to unsorted). */
export function clearSort() {
  _sortCol.value = undefined;
}

// ── PURE HELPERS ───────────────────────────────────────────────────────────────

/**
 * Generates HTML for table header row with sort icons.
 *
 * @param {string[]} cols - Column header labels
 * @param {number | undefined} sortCol - Column index to sort by (0-based) or undefined for no sort.
 * @param {boolean} sortAsc - Whether sorting is ascending (true) or descending (false).
 * @returns {string} HTML string for `<tr>`
 */
export function thHtml(cols, sortCol, sortAsc) {
  return `<tr>${cols
    .map((c, i) => {
      const sorted = sortCol === i;
      return `<th class="${sorted ? 'sorted' : ''}" data-col="${i}">
      ${escHtml(c)} <span class="sort-icon">${sorted ? (sortAsc ? '▲' : '▼') : '⇅'}</span></th>`;
    })
    .join('')}</tr>`;
}

/**
 * Generates HTML for a single element table row.
 *
 * @param {object} e - Element object
 * @returns {string} HTML string for `<tr>`
 */
export function elementRowHtml(e) {
  const c = elemColor(e.type);
  return `<tr data-id="${e.id}">
    <td>${escHtml(e.name)}</td>
    <td><span class="type-badge" style="--type-bg:${c}33;--type-color:${c}">${escHtml(e.type)}</span></td>
    <td>${escHtml(e.status) || '—'}</td>
    <td>${escHtml(e.owner) || '—'}</td>
  </tr>`;
}

/**
 * Generates HTML for a single relation table row.
 *
 * @param {object} r - Relation object
 * @param {Map<string, object>} elemMap - Map of element ID to element object for name lookup.
 * @returns {string} HTML string for `<tr>`
 */
export function relationRowHtml(r, elemMap) {
  const src = elemMap.get(r.source)?.name ?? r.source;
  const tgt = elemMap.get(r.target)?.name ?? r.target;
  const c = relColor(r.type);
  return `<tr data-id="${r.source}">
    <td>${escHtml(src)}</td>
    <td><span class="type-badge" style="--type-bg:${c}33;--type-color:${c}">${escHtml(r.type)}</span></td>
    <td>${escHtml(tgt)}</td>
    <td>${escHtml(r.name) || '—'}</td>
  </tr>`;
}

// ── CSV EXPORT ─────────────────────────────────────────────────────────────────

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
  const modelName = (getModelName() ?? 'model').replaceAll(/[^\w\s-]/g, '') || 'model';
  // Format timestamp as YYYYMMDD-HHMMSS
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');
  const timePart = now.toTimeString().slice(0, 8).replaceAll(':', '');
  const timestamp = `${datePart}-${timePart}`;
  a.download = `${modelName}-${type}-${timestamp}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Exports the currently visible table data as a CSV file. Uses filteredElements and
 * filteredRelations computed values instead of DOM queries.
 */
export async function exportCsv() {
  const btn = document.getElementById('export-csv-btn');
  if (btn) {
    btn.classList.add('loading');
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
    btn.disabled = true;
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }

  try {
    const currentTab = getCurrentTab();
    const type = currentTab === 'elements' ? 'entities' : 'relationships';

    // Get headers from table head (respects any DOM reordering)
    const headerCells = document.querySelectorAll('#table-head th');
    const headers = [...headerCells].map((th) => {
      const clone = th.cloneNode(true);
      const icon = clone.querySelector('.sort-icon');
      if (icon) {
        icon.remove();
      }
      return clone.textContent.trim();
    });

    // Get data from computed values
    const elements = filteredElements.value;
    const relations = filteredRelations.value;
    const elemMap = getElemMap();

    // Build rows based on current column order from headers
    // For elements: Name, Type, Status, Owner; For relationships: Source, Rel Type, Target, Rel Name
    const rows =
      currentTab === 'elements'
        ? elements.map((e) => {
            const row = [];
            for (const header of headers) {
              const headerLower = header.toLowerCase();
              if (headerLower.includes('name')) {
                row.push(e.name);
              } else if (headerLower.includes('type')) {
                row.push(e.type);
              } else if (headerLower.includes('status')) {
                row.push(e.status || '');
              } else if (headerLower.includes('owner')) {
                row.push(e.owner || '');
              } else {
                row.push('');
              }
            }
            return row;
          })
        : relations.map((r) => {
            const row = [];
            const src = elemMap.get(r.source)?.name ?? r.source;
            const tgt = elemMap.get(r.target)?.name ?? r.target;
            for (const header of headers) {
              const headerLower = header.toLowerCase();
              if (headerLower.includes('source')) {
                row.push(src);
              } else if (headerLower.includes('rel type') || headerLower.includes('type')) {
                row.push(r.type);
              } else if (headerLower.includes('target')) {
                row.push(tgt);
              } else if (headerLower.includes('rel name') || headerLower.includes('name')) {
                row.push(r.name ?? '');
              } else {
                row.push('');
              }
            }
            return row;
          });

    buildAndDownloadCsv(headers, rows, type);
  } catch (error) {
    console.error('Export failed', error);
    showToast(t('exportFailed') + ': ' + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }
}

// ── INITIALIZATION ─────────────────────────────────────────────────────────────

/** Initializes table service. Called on app startup. */
export function initTableService() {
  // Reset to defaults
  _currentTab.value = 'elements';
  clearSort();
}
