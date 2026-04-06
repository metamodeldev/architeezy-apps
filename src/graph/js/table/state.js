/**
 * State management for table view.
 *
 * @module table/state
 * @package
 */

import { escHtml } from '../utils.js';

// ── INTERNAL STATE ───────────────────────────────────────────────────────────

let _currentTTab = 'elements';
let _sortCol;
let _sortAsc = true;

// ── SELECTORS ────────────────────────────────────────────────────────────────

export function getCurrentTTab() {
  return _currentTTab;
}

export function getSortCol() {
  return _sortCol;
}

export function getSortAsc() {
  return _sortAsc;
}

// ── ACTIONS ──────────────────────────────────────────────────────────────────

export function setCurrentTTab(tab) {
  _currentTTab = tab;
}

/**
 * Updates sort state when a column header is clicked.
 *
 * @param {number} col - Column index that was clicked.
 */
export function handleSortClick(col) {
  _sortAsc = _sortCol === col ? !_sortAsc : true;
  _sortCol = col;
}

export function resetSortState() {
  _sortCol = undefined;
}

// ── PURE HELPERS ─────────────────────────────────────────────────────────────

/**
 * Pure: returns the HTML string for the table header row with sort icons.
 *
 * @param {string[]} cols - Column header labels.
 * @param {number | undefined} sortCol - Index of the currently sorted column.
 * @param {boolean} sortAsc - True if sorted ascending.
 * @returns {string} HTML for a `<tr>` containing `<th>` elements.
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
export function sortRows(rows, getKey, sortCol, sortAsc) {
  if (sortCol === undefined) {
    return rows;
  }
  return [...rows].toSorted((a, b) => {
    const av = getKey(a) ?? '';
    const bv = getKey(b) ?? '';
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}
