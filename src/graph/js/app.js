/* eslint-disable max-lines */

// ── ENTRY POINT ────────────────────────────────────────────────────────────

import {
  apiFetch,
  fetchCurrentUser,
  handleAuthSuccess,
  isAuthed,
  probeAuth,
  signOut,
  startAuth,
  updateAuthUI,
} from './auth.js';
import { clearDetail, showDetail } from './detail.js';
import {
  buildDepthPicker,
  exitDrill,
  initDrillEvents,
  onNodeDrill,
  restoreDrillRootStyle,
  clearDrillState,
  getDrillDepth,
  getDrillNodeId,
  setDrillDepth,
  setSkipLayoutSave,
} from './drill.js';
import {
  applyUrlFilters,
  buildFilters,
  filterSearch,
  loadFilterState,
  selectAll,
  setShowAllElem,
  setShowAllRel,
} from './filters.js';
import {
  applyLayout,
  buildCytoscape,
  fitGraph,
  getContainmentMode,
  getCy,
  hasGraphNode,
  isGraphLoaded,
  resizeCy,
  setContainmentMode,
  zoomIn,
  zoomOut,
} from './graph.js';
import {
  applyHighlight,
  clearFadedClasses,
  clearHighlightState,
  getHighlightEnabled,
  getHighlightNodeId,
  setHighlightEnabled,
  setHighlightNodeId,
} from './highlight.js';
import { applyLocale, t } from './i18n.js';
import { exportGraphImage, getExportingState as getImageExportingState } from './image-export.js';
import { initLegend, setLegendEnabled, updateLegend } from './legend.js';
import {
  getAllElements,
  getAllRelations,
  getCurrentModelId,
  loadModelData,
  setCurrentModel,
  clearModelData,
} from './model.js';
import {
  closeModelSelector,
  fetchModelList,
  filterModelList,
  getCachedModels,
  modelContentUrl,
  openModelSelector,
  setCachedModels,
  setCurrentModelName,
} from './models.js';
import { initColorMaps } from './palette.js';
import { readUrlParams, syncUrl } from './routing.js';
import { initGlobalSearch, applySearch } from './search.js';
import { initTableEvents, renderTable, switchTableTab, exportCSV } from './table.js';
import { isTooltipsEnabled, setTooltipsEnabled } from './tooltip.js';
import {
  hideLoading,
  hideToast,
  restoreSidebarAndPanelState,
  setTheme,
  showError,
  showLoading,
  showToast,
  switchView,
  toggleSection,
  toggleSidebar,
  getCurrentView,
} from './ui.js';
import {
  applyDrill,
  applyVisibility,
  updateElemFilterDim,
  updateRelFilterCounts,
} from './visibility.js';

// ── INIT THEME (immediately, before anything else renders) ──────────────────
let storedTheme;
try {
  storedTheme = localStorage.getItem('architeezyTheme');
} catch {
  // Leave as undefined
}
setTheme(storedTheme ?? 'system');

function onSignOut() {
  signOut(); // Clears token, resets UI
  setCachedModels([]);
  showToast(t('signedOut'));

  // Clear model data and remove model from URL/localStorage to ensure no residual data
  clearModelData();
  const url = new URL(location.href);
  url.searchParams.delete('model');
  history.replaceState(undefined, '', url);
  localStorage.removeItem('architeezyGraphModelUrl');
  localStorage.removeItem('architeezyGraphModelName');

  init();
}

// ── CYTOSCAPE BUILDER HELPER ────────────────────────────────────────────────

/** Builds a new Cytoscape instance from current model state, wiring standard handlers. */
function rebuildCytoscape() {
  /** @param {string} id - Node ID to drill into. */
  function wrappedOnNodeDrill(id) {
    // Entering drill mode clears highlight state (TC-2.11.8)
    if (getHighlightEnabled()) {
      clearHighlightState();
      // Remove fading classes immediately; drill will take over
      const cy = getCy();
      if (cy) {
        clearFadedClasses(cy);
      }
    }
    onNodeDrill(id);
  }

  // The debounced single-tap handler used for node selection (detail panel)
  /** @param {string} id - Node ID to show detail for. */
  function debouncedNodeTap(id) {
    showDetail(id, wrappedOnNodeDrill);
  }

  buildCytoscape({
    elements: getAllElements(),
    relations: getAllRelations(),
    onNodeTap: debouncedNodeTap,
    onNodeDblTap: wrappedOnNodeDrill,
    onCanvasTap: () => {
      clearDetail();
      if (getHighlightEnabled()) {
        clearHighlightState();
        applyHighlight(); // Will revert to normal visibility
      }
    },
    getDrillNodeId,
  });

  // Attach immediate highlight handlers (separate from debounced selection).
  // Both 'tap' and 'select' are used: 'select' is more reliable in some Playwright/Cytoscape
  // Interaction sequences (e.g., after a preceding canvas click); 'tap' covers re-clicks on an
  // Already-selected node where 'select' wouldn't re-fire.
  const cy = getCy();
  /** @param {string} nodeId - Node ID to highlight. */
  function applyNodeHighlight(nodeId) {
    if (!getHighlightEnabled() || getDrillNodeId()) {
      return;
    }
    setHighlightNodeId(nodeId);
    applyHighlight();
  }
  cy.on('tap', 'node', (e) => applyNodeHighlight(e.target.id()));
  cy.on('select', 'node', (e) => applyNodeHighlight(e.target.id()));
}

// ── EXPORT IMAGE BUTTON STATE ──────────────────────────────────────────────────

/** Updates the disabled state of the export image button based on current app state. */
function updateExportButtonState() {
  const btn = document.getElementById('export-image-btn');
  if (!btn) {
    return;
  }

  const hasModel = isGraphLoaded();
  const inGraphView = getCurrentView() === 'graph';
  const isExporting = getImageExportingState();

  btn.disabled = !(hasModel && inGraphView && !isExporting);
}

// Expose globally so graph.js/visibility.js can trigger updates
globalThis.updateExportButtonState = updateExportButtonState;
globalThis.updateLegend = updateLegend;

// ── EVENT WIRING ────────────────────────────────────────────────────────────

function handleTabGroupClick(e) {
  const btn = e.target.closest('.tab-btn[data-view]');
  if (!btn) {
    return;
  }
  switchView(btn.dataset.view, renderTable);
  if (btn.dataset.view === 'graph') {
    resizeCy();
  }
  // Re-apply search to sync between views
  applySearch();
  updateExportButtonState(); // Refresh export button visibility/state
  syncUrl({ push: true });
}

function handleFilterSearch(e, kind) {
  const query = e.target.value;
  filterSearch(kind, query);
  if (query.trim() === '') {
    // Reapply dynamic visibility when search is cleared
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

function wireEvents() {
  // Error / toast
  document.getElementById('retry-btn').addEventListener('click', init);
  document.getElementById('toast-close').addEventListener('click', hideToast);

  // Auth
  document.getElementById('auth-btn').addEventListener('click', startAuth);
  document.getElementById('signout-btn').addEventListener('click', onSignOut);

  // Model selector
  wireModelSelectorEvents();

  // View tabs — delegation on .tab-group
  document.querySelector('.tab-group').addEventListener('click', handleTabGroupClick);

  // Layout / graph controls
  document.getElementById('layout-select').addEventListener('change', applyLayout);
  document
    .getElementById('containment-select')
    .addEventListener('change', (e) => onContainmentChange(e.target.value));

  // Refresh layout button (on main controls panel)
  document
    .getElementById('refresh-layout-btn')
    ?.addEventListener('click', () => applyLayout({ preserveViewport: true }));

  // Theme
  wireThemeEvents();

  // Drill bar
  document.getElementById('drill-exit-btn').addEventListener('click', exitDrill);
  initDrillEvents();
  buildDepthPicker(getDrillDepth());

  // Sidebar collapse
  document.getElementById('sidebar-collapse-btn').addEventListener('click', toggleSidebar);

  // Sidebar events
  wireSidebarEvents();

  // Filter searches
  document
    .getElementById('elem-filter-search')
    .addEventListener('input', (e) => handleFilterSearch(e, 'elem'));
  document
    .getElementById('rel-filter-search')
    .addEventListener('input', (e) => handleFilterSearch(e, 'rel'));

  // Show all toggles
  document
    .getElementById('elem-show-all')
    .addEventListener('change', (e) => handleShowAllChange(e, 'elem'));
  document
    .getElementById('rel-show-all')
    .addEventListener('change', (e) => handleShowAllChange(e, 'rel'));

  // Table tabs, search, sort / row clicks
  wireTableEvents();

  // CSV and image export
  wireExportEvents();

  // Cy controls and visibility triggers
  document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);
  document.getElementById('fit-cy-btn').addEventListener('click', fitGraph);
  document.addEventListener('graph:applyDrill', applyDrill);
  document.addEventListener('graph:applyVisibility', applyVisibility);
  document.addEventListener('graph:syncUrl', (e) => {
    syncUrl({ push: e.detail?.push ?? false });
  });
  updateExportButtonState();

  wireKeyboardEvents();
  initGlobalSearch();
}

function wireModelSelectorEvents() {
  document.getElementById('modal-close-btn').addEventListener('click', closeModelSelector);
  document
    .getElementById('model-search')
    .addEventListener('input', (e) => filterModelList(e.target.value));
  document.getElementById('current-model-btn').addEventListener('click', openModelSelector);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModelSelector();
    }
  });
  document.getElementById('model-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeModelSelector();
    }
  });

  // Keyboard navigation for model selector modal
  const modal = document.getElementById('model-modal');
  modal.addEventListener('keydown', (e) => {
    // Close on Escape
    if (e.key === 'Escape') {
      closeModelSelector();
      e.preventDefault();
      return;
    }

    const modelItems = [...modal.querySelectorAll('.model-item:not([disabled])')];

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      let targetIndex;
      if (document.activeElement === modal) {
        // Starting from modal: first item for down, last for up
        targetIndex = e.key === 'ArrowDown' ? 0 : modelItems.length - 1;
      } else {
        const currentIndex = modelItems.indexOf(document.activeElement);
        if (currentIndex === -1) {
          return;
        } // Not a model item, ignore
        targetIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
        // Wrap around
        if (targetIndex < 0) {
          targetIndex = modelItems.length - 1;
        }
        if (targetIndex >= modelItems.length) {
          targetIndex = 0;
        }
      }
      if (modelItems[targetIndex]) {
        modelItems[targetIndex].focus();
      }
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === 'Space') {
      if (document.activeElement.classList.contains('model-item')) {
        document.activeElement.click();
        e.preventDefault();
      }
    }
  });
}

function wireThemeEvents() {
  document.querySelector('.theme-switcher').addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-btn[data-theme]');
    if (btn) {
      setTheme(btn.dataset.theme);
    }
  });
}

function wireSidebarEvents() {
  document.querySelector('aside').addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.sidebar-toggle-btn[data-section]');
    if (toggleBtn) {
      toggleSection(toggleBtn.dataset.section);
      return;
    }
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn) {
      return;
    }
    if (actionBtn.dataset.action === 'select-all') {
      selectAll(actionBtn.dataset.kind, true);
    }
    if (actionBtn.dataset.action === 'select-none') {
      selectAll(actionBtn.dataset.kind, false);
    }
  });
}

function wireTableEvents() {
  document.querySelector('.table-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.table-tab-btn[data-tab]');
    if (btn) {
      switchTableTab(btn.dataset.tab);
    }
  });
  initTableEvents();
}

function wireExportEvents() {
  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportCSV);
  }

  const exportImageBtn = document.getElementById('export-image-btn');
  const exportDropdown = document.getElementById('export-dropdown');

  if (exportImageBtn && exportDropdown) {
    exportImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportDropdown.classList.toggle('hidden');
    });
  }

  document.getElementById('export-png-btn')?.addEventListener('click', async () => {
    exportDropdown?.classList.add('hidden');
    await exportGraphImage('png');
  });

  document.getElementById('export-svg-btn')?.addEventListener('click', async () => {
    exportDropdown?.classList.add('hidden');
    await exportGraphImage('svg');
  });

  document.addEventListener('click', () => {
    if (exportDropdown) {
      exportDropdown.classList.add('hidden');
    }
  });
}

function wireKeyboardEvents() {
  // Keyboard navigation for graph canvas: arrow keys to pan, +/- to zoom
  document.addEventListener('keydown', (e) => {
    // Only handle when the graph canvas (#cy) is focused
    if (document.activeElement?.id !== 'cy') {
      return;
    }
    const cy = getCy();
    if (!cy) {
      return;
    }

    const panAmount = 50; // Pixels per key press
    const zoomFactor = 1.1;

    switch (e.key) {
      case 'ArrowUp':
        cy.panBy({ x: 0, y: -panAmount });
        e.preventDefault();
        break;
      case 'ArrowDown':
        cy.panBy({ x: 0, y: panAmount });
        e.preventDefault();
        break;
      case 'ArrowLeft':
        cy.panBy({ x: -panAmount, y: 0 });
        e.preventDefault();
        break;
      case 'ArrowRight':
        cy.panBy({ x: panAmount, y: 0 });
        e.preventDefault();
        break;
      case '+':
      case '=': // '=' also acts as '+' (without shift)
        cy.zoom(cy.zoom() * zoomFactor);
        e.preventDefault();
        break;
      case '-':
        cy.zoom(cy.zoom() / zoomFactor);
        e.preventDefault();
        break;
    }
  });
}

// ── AUTH_SUCCESS from popup ─────────────────────────────────────────────────
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'AUTH_SUCCESS') {
    return;
  }
  handleAuthSuccess(e.data.token);
  fetchCurrentUser();
  setCachedModels([]);
  init();
});

// ── loadModel event from models.js ─────────────────────────────────────────
document.addEventListener('loadModel', (e) => loadModel(e.detail.url, e.detail.modelId));

// ── CONTAINMENT MODE ───────────────────────────────────────────────────────

/**
 * Switches the containment display mode and rebuilds the graph. Persists the choice to
 * localStorage.
 *
 * @param {'none' | 'edge' | 'compound'} mode - New containment mode.
 */
function onContainmentChange(mode) {
  setContainmentMode(mode);
  document.getElementById('containment-select').value = mode;
  if (!getAllElements().length) {
    return;
  }
  rebuildCytoscape();
  restoreDrillRootStyle();
  if (getDrillNodeId()) {
    applyDrill();
  } else {
    applyVisibility();
    // Also re-apply highlight if enabled and a node is selected
    if (getHighlightEnabled() && getHighlightNodeId()) {
      applyHighlight();
    }
  }
  applyLayout();
}

// ── LOAD MODEL ─────────────────────────────────────────────────────────────

/**
 * Fetches and loads a model from `url`, then builds the graph, filters, and table. On failure,
 * shows a toast if a model is already visible, otherwise lets the caller detect via
 * `isGraphLoaded()` and open the model selector.
 *
 * @param {string} url - Content URL of the model to load.
 * @param {string | undefined} [modelId] - Optional model ID for URL routing.
 * @param {Function | undefined} [afterLoad] - Optional callback invoked after a successful load.
 */
async function loadModel(url, modelId, afterLoad) {
  // Defer showing loading to avoid blocking the click that triggered this
  await Promise.resolve();
  showLoading(t('loadingModel'));
  try {
    const r = await apiFetch(url);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status} — ${r.statusText}`);
    }
    const data = await r.json();
    const currentModelNs = loadModelData(data);
    const elements = getAllElements();

    if (elements.length === 0) {
      handleEmptyState(url, modelId, currentModelNs);
      return;
    }

    handleNonEmptyState(elements, url, modelId, currentModelNs, afterLoad);
  } catch (error) {
    handleLoadModelError(error);
  }
}

// ── LOAD MODEL HELPERS ─────────────────────────────────────────────────────────────

function handleEmptyState(url, modelId, ns) {
  hideLoading();
  document.getElementById('cy').classList.add('hidden');
  document.getElementById('table-view').classList.add('hidden');
  const emptyMsg = document.getElementById('empty-state-message');
  if (emptyMsg) {
    emptyMsg.classList.remove('hidden');
  } else {
    const msg = document.createElement('div');
    msg.className = 'empty-state-message';
    msg.textContent = t('noElements');
    document.querySelector('main').append(msg);
  }
  const resolvedModelId = modelId ?? getCachedModels().find((m) => modelContentUrl(m) === url)?.id;
  setCurrentModel(resolvedModelId, ns);
  syncUrl();
}

function handleNonEmptyState(elements, url, modelId, ns, afterLoad) {
  const emptyMsg = document.getElementById('empty-state-message');
  if (emptyMsg) {
    emptyMsg.classList.add('hidden');
  }

  initColorMaps(elements, getAllRelations());

  localStorage.setItem('architeezyGraphModelUrl', url);
  clearDrillState();
  clearHighlightState();
  document.getElementById('crumb-entity-sep').classList.add('hidden');
  document.getElementById('drill-label').classList.add('hidden');

  const resolvedModelId = modelId ?? getCachedModels().find((m) => modelContentUrl(m) === url)?.id;
  setCurrentModel(resolvedModelId, ns);

  rebuildCytoscape();
  buildFilters();
  loadFilterState();
  applyVisibility();
  applyLayout();
  hideLoading();
  renderTable();
  afterLoad?.();
  syncUrl();
  updateLegend();
}

function handleLoadModelError(error) {
  hideLoading();
  showToast(error.message);
  if (error.message === t('authRequired')) {
    globalThis._authErrorShown = true;
  }
}

// ── INIT ───────────────────────────────────────────────────────────────────

/**
 * Creates the afterLoad callback based on URL state parameters.
 *
 * @param {boolean} hasUrlState - Whether any URL state parameters are present.
 * @param {string | undefined} urlEntities - Comma-separated entity types from URL.
 * @param {string | undefined} urlRelationships - Comma-separated relationship types from URL.
 * @param {string | undefined} urlView - Desired view from URL ('table' or 'graph').
 * @param {string | undefined} urlEntityId - Entity ID for drill mode from URL.
 * @param {number | undefined} urlDepth - Drill depth from URL.
 * @returns {Function | undefined} Callback to run after model load, or undefined if no URL state.
 */
function buildAfterLoadHandler(
  hasUrlState,
  urlEntities,
  urlRelationships,
  urlView,
  urlEntityId,
  urlDepth,
) {
  if (!hasUrlState) {
    return;
  }

  return () => {
    // Filter state always comes from URL when restoring from a shared link.
    const allETypes = [...new Set(getAllElements().map((e) => e.type))];
    const allRTypes = [...new Set(getAllRelations().map((r) => r.type))];

    applyUrlFilters(
      urlEntities === undefined ? allETypes : urlEntities.split(',').filter(Boolean),
      urlRelationships === undefined ? allRTypes : urlRelationships.split(',').filter(Boolean),
    );
    // View
    if (urlView === 'table') {
      switchView('table', renderTable);
    } else if (urlView === 'graph') {
      // Ensure graph view is active (default, but explicit)
      switchView('graph', renderTable); // RenderTable not needed for graph, but pass
    }
    // Drill
    if (urlEntityId) {
      if (urlDepth !== undefined) {
        setDrillDepth(urlDepth);
      }
      if (hasGraphNode(urlEntityId)) {
        // Skip layout state saving and URL sync when drill is entered via URL (deep link)
        setSkipLayoutSave(true);
        onNodeDrill(urlEntityId, { skipUrlSync: true });
      }
    }
  };
}

/**
 * Helper: attempts to switch to a different model based on URL params.
 *
 * @param {object} params - URL parameters.
 * @param {string} currentModelId - Current model ID.
 * @returns {Promise<boolean>} True if model switch was initiated and afterLoad will handle state
 *   restoration.
 */
async function trySwitchModel(params, currentModelId) {
  if (!params.modelId || params.modelId === currentModelId) {
    return false;
  }

  const models = getCachedModels();
  const targetModel = models.find((m) => m.id === params.modelId);
  if (!targetModel) {
    return false;
  }

  const url = modelContentUrl(targetModel);
  if (!url) {
    return false;
  }

  const hasUrlState =
    params.entities !== undefined ||
    params.relationships !== undefined ||
    params.entityId ||
    params.view;

  const afterLoad = buildAfterLoadHandler(
    hasUrlState,
    params.entities,
    params.relationships,
    params.view,
    params.entityId,
    params.depth,
  );

  await loadModel(url, params.modelId, afterLoad);
  if (isGraphLoaded()) {
    setCurrentModelName(targetModel.name);
  }
  return true;
}

/**
 * Restores application state on the currently loaded model (no model switch).
 *
 * @param {object} params - URL parameters.
 */
function restoreCurrentModelState(params) {
  const allElements = getAllElements();
  const allRelations = getAllRelations();

  const allETypes = [...new Set(allElements.map((e) => e.type))];
  const allRTypes = [...new Set(allRelations.map((r) => r.type))];

  const hasUrlFilters = params.entities !== undefined || params.relationships !== undefined;
  if (hasUrlFilters) {
    applyUrlFilters(
      params.entities === undefined ? allETypes : params.entities.split(',').filter(Boolean),
      params.relationships === undefined
        ? allRTypes
        : params.relationships.split(',').filter(Boolean),
    );
  }

  const targetView = params.view || 'graph';
  if (targetView !== getCurrentView()) {
    switchView(targetView, renderTable);
    if (targetView === 'graph') {
      resizeCy();
    }
  }

  if (params.entityId) {
    if (params.depth !== undefined) {
      setDrillDepth(params.depth);
    }
    if (hasGraphNode(params.entityId)) {
      onNodeDrill(params.entityId, { skipUrlSync: true });
    }
  } else if (getDrillNodeId()) {
    exitDrill({ skipUrlSync: true });
  }
}

/**
 * Restores application state from the current URL parameters without reloading the page. Called
 * when navigating via browser back/forward buttons.
 */
async function restoreStateFromUrl() {
  if (!isGraphLoaded()) {
    return;
  }

  const params = readUrlParams();
  const currentModelId = getCurrentModelId();

  const switched = await trySwitchModel(params, currentModelId);
  if (switched) {
    return;
  }

  restoreCurrentModelState(params);
}

/**
 * Application entry point: applies locale, checks auth, fetches the model list, then loads the
 * model from the URL or localStorage. If no model URL is available, opens the model selector
 * modal.
 */
async function init() {
  // Hide initial loading overlay ASAP
  hideLoading();
  applyLocale();
  document.getElementById('containment-select').value = getContainmentMode();
  await handleAuth();

  // URL params take priority over localStorage
  const { urlModelId, afterLoad } = prepareLoadContext();

  let targetUrl;
  let targetModelId;

  if (urlModelId) {
    targetUrl = await tryLoadFromUrlParam(urlModelId);
    if (targetUrl) {
      targetModelId = urlModelId;
    }
  }

  if (!targetUrl) {
    targetUrl = tryLoadFromLocalStorage();
  }

  if (targetUrl) {
    await handleTargetLoad(targetUrl, targetModelId, afterLoad);
  } else {
    handleNoTargetUrl(urlModelId);
  }
}

/** Handles the initial authentication setup. */
async function handleAuth() {
  if (isAuthed()) {
    updateAuthUI();
  } else {
    await probeAuth();
  }
}

/**
 * Prepares the URL parameters and the after-load handler.
 *
 * @returns {Object} Contains urlModelId, afterLoad.
 */
function prepareLoadContext() {
  const {
    modelId: urlModelId,
    entityId: urlEntityId,
    depth: urlDepth,
    entities: urlEntities,
    relationships: urlRelationships,
    view: urlView,
  } = readUrlParams();

  const hasUrlState =
    urlEntities !== undefined || urlRelationships !== undefined || urlEntityId || urlView;
  const afterLoad = buildAfterLoadHandler(
    hasUrlState,
    urlEntities,
    urlRelationships,
    urlView,
    urlEntityId,
    urlDepth,
  );

  return { urlModelId, afterLoad };
}

/**
 * Handles loading when a target URL is resolved.
 *
 * @param {string} targetUrl - The URL of the model to load.
 * @param {string} [targetModelId] - The model ID, if available.
 * @param {Function} afterLoad - Callback to run after the model is loaded.
 */
async function handleTargetLoad(targetUrl, targetModelId, afterLoad) {
  globalThis._authErrorShown = false;
  await loadModel(targetUrl, targetModelId, afterLoad);

  if (isGraphLoaded()) {
    const saved = getCachedModels().find((m) => modelContentUrl(m) === targetUrl);
    if (saved) {
      setCurrentModelName(saved.name);
    }
  } else {
    if (!globalThis._authErrorShown && !getCurrentModelId()) {
      localStorage.removeItem('architeezyGraphModelUrl');
      localStorage.removeItem('architeezyGraphModelName');
      document.getElementById('cy').classList.add('hidden');
      openModelSelector();
    }
  }
}

/**
 * Handles the case when no target URL is available.
 *
 * @param {string} [urlModelId] - The model ID from URL, if any, to show a not-found message.
 */
function handleNoTargetUrl(urlModelId) {
  hideLoading();
  document.getElementById('cy').classList.add('hidden');
  if (urlModelId) {
    showToast(t('modelNotFound'));
  }
  openModelSelector();
}

/**
 * Tries to load model from URL modelId parameter. Returns the content URL if successful, undefined
 * otherwise.
 *
 * @param {string} urlModelId - Model ID from URL query parameter.
 * @returns {Promise<string | undefined>} Content URL on success, undefined on failure.
 */
async function tryLoadFromUrlParam(urlModelId) {
  // Model list is needed to resolve the UUID to a content URL
  showLoading(t('loadingModels'));
  try {
    setCachedModels(await fetchModelList());
  } catch (error) {
    showError(error.message);
    return;
  }
  hideLoading();
  const urlModel = getCachedModels().find((m) => m.id === urlModelId);
  if (urlModel) {
    return modelContentUrl(urlModel);
  }
}

/**
 * Tries to get model URL from localStorage. Returns the URL if found, undefined otherwise.
 *
 * @returns {string | undefined} - Model content URL if present in storage, undefined otherwise.
 */
function tryLoadFromLocalStorage() {
  const url = localStorage.getItem('architeezyGraphModelUrl');
  if (url) {
    const savedName = localStorage.getItem('architeezyGraphModelName');
    if (savedName) {
      setCurrentModelName(savedName);
    }
  }
  return url ?? undefined;
}

// ── BOOT ───────────────────────────────────────────────────────────────────

wireEvents();
document.getElementById('tooltips-toggle').checked = isTooltipsEnabled();
document.getElementById('tooltips-toggle').addEventListener('change', (e) => {
  setTooltipsEnabled(e.target.checked);
});

// Initialize highlight toggle state from localStorage
const highlightToggle = document.getElementById('highlight-toggle');
const savedHighlightEnabled = localStorage.getItem('architeezyGraphHighlightEnabled') === 'true';
highlightToggle.checked = savedHighlightEnabled;
setHighlightEnabled(savedHighlightEnabled);

// Highlight toggle change handler
highlightToggle.addEventListener('change', (e) => {
  const enabled = e.target.checked;
  setHighlightEnabled(enabled);
  localStorage.setItem('architeezyGraphHighlightEnabled', enabled);
  if (enabled) {
    let currentHighlightId = getHighlightNodeId();
    // If no stored highlight node, check whether Cytoscape already has a selected node
    // (e.g., user clicked a node while highlight was off) — apply highlight immediately.
    if (!currentHighlightId && !getDrillNodeId()) {
      const cy = getCy();
      if (cy) {
        const selected = cy.$(':selected').filter('node').first();
        if (selected && selected.length > 0) {
          currentHighlightId = selected.id();
          setHighlightNodeId(currentHighlightId);
        }
      }
    }
    if (currentHighlightId && !getDrillNodeId()) {
      applyHighlight();
    }
  } else {
    clearHighlightState();
    // Revert to normal visibility based on filters
    applyVisibility();
    // Also clear any fading classes
    const cy = getCy();
    if (cy) {
      clearFadedClasses(cy);
    }
  }
  document.dispatchEvent(new CustomEvent('graph:syncUrl'));
});

document.getElementById('legend-toggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  setLegendEnabled(enabled);
  // If currently in table view, keep legend hidden regardless of toggle state
  if (getCurrentView() === 'table') {
    document.getElementById('graph-legend').classList.add('hidden');
  }
});

// Re-apply highlight when filters or depth change (if highlight enabled and not in drill)
document.addEventListener('graph:applyVisibility', () => {
  if (getHighlightEnabled() && getHighlightNodeId() && !getDrillNodeId()) {
    applyHighlight();
  }
});
document.addEventListener('graph:applyDrill', () => {
  if (getHighlightEnabled() && getHighlightNodeId() && !getDrillNodeId()) {
    applyHighlight();
  }
});

// Handle browser back/forward navigation by restoring state from URL without page reload
globalThis.addEventListener('popstate', () => {
  restoreStateFromUrl();
});

restoreSidebarAndPanelState();
initLegend();
init();
