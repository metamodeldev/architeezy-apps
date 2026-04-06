/**
 * Global search input handling.
 *
 * Sets query and updates the no-results hint. Each view layer reacts to the query signal
 * independently — search does not know which view is currently active.
 *
 * @module search/ui
 * @package
 */

import { effect } from '../signals/index.js';
import { query, setQuery } from './service.js';

// ── PRIVATE ───────────────────────────────────────────────────────────────────

let searchDebounceTimer;
let globalSearchInput;
let globalSearchClear;
let noResultsHint;

function clearSearch() {
  if (!globalSearchInput) {
    return;
  }
  globalSearchInput.value = '';
  setQuery('');
  if (globalSearchClear) {
    globalSearchClear.style.display = 'none';
  }
}

// ── PUBLIC ───────────────────────────────────────────────────────────────────

export function initGlobalSearch() {
  globalSearchInput = document.getElementById('global-search');
  globalSearchClear = document.getElementById('global-search-clear');
  noResultsHint = document.querySelector('.no-results-hint');

  if (!globalSearchInput) {
    return;
  }

  // Input event: toggle clear button, debounce search execution
  globalSearchInput.addEventListener('input', () => {
    if (globalSearchClear) {
      globalSearchClear.style.display = globalSearchInput.value ? 'block' : 'none';
    }
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    searchDebounceTimer = setTimeout(() => {
      setQuery(globalSearchInput.value);
    }, 300);
  });

  // Clear button click
  if (globalSearchClear) {
    globalSearchClear.addEventListener('click', clearSearch);
  }

  // Hide no-results hint when query is cleared
  effect(() => {
    const q = query.value;
    if (globalSearchClear) {
      globalSearchClear.style.display = q ? 'block' : 'none';
    }
    if (!q && noResultsHint) {
      noResultsHint.classList.add('hidden');
    }
  });
}

/**
 * Updates the no-results hint visibility. Called by view-specific search integrations (e.g.
 * graph/search.js, table) that can check match counts.
 *
 * @param {boolean} hasMatches - Whether the current query produced any visible matches.
 */
export function setNoResultsHintVisible(hasMatches) {
  if (noResultsHint) {
    noResultsHint.classList.toggle('hidden', hasMatches);
  }
}

export function initSearch() {
  initGlobalSearch();
}
