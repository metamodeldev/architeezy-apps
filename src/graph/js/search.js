// ── GLOBAL SEARCH ─────────────────────────────────────────────────────────────
//
// Handles the global search input in the header, coordinating between Graph and Table views.
// - Debounced input (300ms)
// - Graph view: dim non-matching nodes/edges via 'search-dimmed' class
// - Table view: uses global searchQuery directly (renderTable reads it)
// - Shows no-results hint when needed
// - Respects active filters and drill-down scope by considering visible nodes only

import { getCy } from './graph.js';
import { getCurrentView } from './ui.js';

// ── STATE ─────────────────────────────────────────────────────────────────────

export const searchState = { query: '' };
let searchDebounceTimer;
let globalSearchInput;
let globalSearchClear;
let noResultsHint;

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
      searchState.query = globalSearchInput.value.trim();
      applySearch();
    }, 300);
  });

  // Clear button click
  if (globalSearchClear) {
    globalSearchClear.addEventListener('click', clearSearch);
  }

  // Re-apply search when visibility or drill changes
  document.addEventListener('graph:applyVisibility', () => {
    if (searchState.query) {
      applySearch();
    }
  });
  document.addEventListener('graph:applyDrill', () => {
    if (searchState.query) {
      applySearch();
    }
  });
}

// ── PRIVATE HELPERS ──────────────────────────────────────────────────────────

function clearSearch() {
  if (!globalSearchInput) {
    return;
  }
  globalSearchInput.value = '';
  searchState.query = '';
  if (globalSearchClear) {
    globalSearchClear.style.display = 'none';
  }
  if (noResultsHint) {
    noResultsHint.classList.add('hidden');
  }
  // Remove search dimming from graph
  const cy = getCy();
  if (cy) {
    cy.nodes().removeClass('search-dimmed');
    cy.edges().removeClass('search-dimmed');
  }
  // Re-apply search (will clear table view as well)
  applySearch();
}

export function applySearch() {
  // Update clear button visibility (in case of programmatic value change)
  if (globalSearchClear) {
    globalSearchClear.style.display = searchState.query ? 'block' : 'none';
  }

  const currentView = getCurrentView();
  if (currentView === 'graph') {
    applySearchDim();
  } else {
    // Table view: dispatch event to request table re-render
    document.dispatchEvent(new CustomEvent('search:renderTable'));
  }

  // Show/hide no-results hint based on whether any matching elements exist
  if (noResultsHint && searchState.query) {
    const cy = getCy();
    let hasMatches = false;
    if (cy && currentView === 'graph') {
      // In graph view, check if any visible node is not dimmed
      const visibleNodes = cy.nodes().filter((node) => node.style('display') !== 'none');
      hasMatches = visibleNodes.some((node) => !node.hasClass('search-dimmed'));
    } else if (currentView === 'table') {
      // In table view, check if any rows are visible
      const tableBody = document.getElementById('table-body');
      hasMatches = tableBody && tableBody.children.length > 0;
    }
    noResultsHint.classList.toggle('hidden', hasMatches);
  } else if (noResultsHint) {
    noResultsHint.classList.add('hidden');
  }
}

function applySearchDim() {
  const cy = getCy();
  if (!cy) {
    return;
  }

  const q = searchState.query.toLowerCase();

  // Reset all search-dimmed classes first
  cy.nodes().removeClass('search-dimmed');
  cy.edges().removeClass('search-dimmed');

  if (!searchState.query) {
    return;
  }

  // Get nodes that are currently visible (display != 'none')
  const visibleNodes = cy.nodes().filter((node) => node.style('display') !== 'none');

  // Dim nodes that do not match the query
  for (const node of visibleNodes) {
    const name = (node.data('label') ?? '').toLowerCase();
    if (!name.includes(q)) {
      node.addClass('search-dimmed');
    }
  }

  // Dim edges where both endpoints are search-dimmed
  for (const edge of cy.edges()) {
    const sourceDimmed = edge.source().hasClass('search-dimmed');
    const targetDimmed = edge.target().hasClass('search-dimmed');
    if (sourceDimmed && targetDimmed) {
      edge.addClass('search-dimmed');
    }
  }
}
