/**
 * Table component: DOM rendering, event handling, reactive integration.
 *
 * Handles all UI concerns separate from business logic (service.js).
 *
 * @module table/component
 * @package
 */

import { getActiveElemTypes } from '../filter/index.js';
import { drillVisibleIds, focusCyNode, resizeCy } from '../graph/index.js';
import { t } from '../i18n.js';
import { getElemMap } from '../model/index.js';
import { pushState } from '../router/index.js';
import { query } from '../search/index.js';
import { effect } from '../signals/index.js';
import { currentView, showDetail, switchView } from '../view/index.js';
import {
  elementRowHtml,
  exportCsv,
  extraColKeys,
  filteredElements,
  filteredRelations,
  getCurrentTab,
  getSortAsc,
  getSortCol,
  handleSortClick,
  isElementsTab,
  relationRowHtml,
  setCurrentTab,
  thHtml,
} from './service.js';

// ── RENDERING ───────────────────────────────────────────────────────────────────

/** Main render entry point. Renders table based on current tab and computed data. */
export function renderTable() {
  const head = document.getElementById('table-head');
  const body = document.getElementById('table-body');

  if (!head || !body) {
    return;
  }

  if (isElementsTab.value) {
    renderElemsTable(head, body);
  } else {
    renderRelsTable(head, body);
  }

  // Show/hide no-results message
  const noResultsEl = document.getElementById('no-results');
  if (noResultsEl) {
    noResultsEl.classList.toggle('hidden', body.children.length > 0);
  }

  // Update export button state
  updateExportButtonState();
}

/** Updates the disabled state of the Export CSV button based on current view and model presence. */
function updateExportButtonState() {
  const btn = document.getElementById('export-csv-btn');
  if (!btn) {
    return;
  }
  const inTableView = currentView.value === 'table';
  const hasModel = getElemMap().size > 0;
  btn.disabled = !(inTableView && hasModel);
}

/**
 * Renders elements table.
 *
 * @param {HTMLElement} head - Table head element.
 * @param {HTMLElement} body - Table body element.
 */
export function renderElemsTable(head, body) {
  const extraKeys = extraColKeys.value;
  const extraLabels = extraKeys.map((k) => k.charAt(0).toUpperCase() + k.slice(1));
  head.innerHTML = thHtml([t('colName'), t('colType'), ...extraLabels], getSortCol(), getSortAsc());

  const elements = filteredElements.value;
  body.innerHTML = elements.map((element) => elementRowHtml(element, extraKeys)).join('');
}

/**
 * Renders relationships table.
 *
 * @param {HTMLElement} head - Table head element.
 * @param {HTMLElement} body - Table body element.
 */
export function renderRelsTable(head, body) {
  head.innerHTML = thHtml(
    [t('colSource'), t('colRelType'), t('colTarget'), t('colRelName')],
    getSortCol(),
    getSortAsc(),
  );

  const relations = filteredRelations.value;
  const elemMap = getElemMap(); // From ModelService (non-reactive getter)
  body.innerHTML = relations.map((r) => relationRowHtml(r, elemMap)).join('');
}

// ── TAB SWITCHING ───────────────────────────────────────────────────────────────

/**
 * Switches table tab and re-renders.
 *
 * @param {'elements' | 'relationships'} tab - Tab to switch to.
 */
export function switchTableTab(tab) {
  setCurrentTab(tab);
  // Update button active states
  const elementsBtn = document.getElementById('ttab-elements');
  const relsBtn = document.getElementById('ttab-rels');
  if (elementsBtn) {
    elementsBtn.classList.toggle('active', tab === 'elements');
  }
  if (relsBtn) {
    relsBtn.classList.toggle('active', tab === 'relationships');
  }
  renderTable();
}

// ── FOCUS NODE ───────────────────────────────────────────────────────────────────

/**
 * Switches to graph view and focuses node.
 *
 * @param {string} id - Element ID
 */
export function focusNode(id) {
  switchView('graph');
  resizeCy();
  pushState({ view: undefined });
  requestAnimationFrame(() => {
    if (focusCyNode(id)) {
      showDetail(id);
    }
  });
}

// ── EVENTS ───────────────────────────────────────────────────────────────────────

/** Wires table events: header sort clicks, row clicks. */
export function initTableEvents() {
  const head = document.getElementById('table-head');
  const body = document.getElementById('table-body');

  if (!head || !body) {
    return;
  }

  head.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-col]');
    if (!th) {
      return;
    }
    handleSortClick(Number(th.dataset.col));
    renderTable();
  });

  body.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) {
      focusNode(tr.dataset.id);
    }
  });
}

/** Wires all table-related UI events: tabs, export button. */
export function wireTableEvents() {
  const tabsContainer = document.querySelector('.table-tabs');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.table-tab-btn[data-tab]');
      if (btn) {
        switchTableTab(btn.dataset.tab);
      }
    });
  }

  initTableEvents();

  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportCsv);
  }
}

// ── REACTIVE INTEGRATION ────────────────────────────────────────────────────────

/** Sets up reactive effects to auto-render table when dependencies change. */
export function initSearchIntegration() {
  effect(() => {
    // Dependencies: query, filter types, drill visibility, sort/tab state
    /* oxlint-disable-next-line no-unused-expressions */
    query.value; // SearchService query computed
    /* oxlint-disable-next-line no-unused-expressions */
    filteredElements.value; // Reads computed => dependency
    /* oxlint-disable-next-line no-unused-expressions */
    filteredRelations.value; // Reads computed => dependency
    // These getters read signals internally:
    getActiveElemTypes();
    // oxlint-disable-next-line no-unused-expressions
    drillVisibleIds.value;
    getSortCol();
    getSortAsc();
    getCurrentTab();
    // Render
    renderTable();
  });
}

// ── INITIALIZATION ───────────────────────────────────────────────────────────────

/** Initializes table component. Wires DOM events and activates reactive integration. */
export function initTableComponent() {
  wireTableEvents();
  initSearchIntegration();

  // Re-render table reactively when switching to table view
  effect(() => {
    if (currentView.value === 'table') {
      renderTable();
    }
  });
}
