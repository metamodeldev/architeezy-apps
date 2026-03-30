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
} from './drill.js';
import {
  applyUrlFilters,
  buildFilters,
  filterSearch,
  loadFilterState,
  selectAll,
} from './filters.js';
import {
  applyLayout,
  buildCytoscape,
  fitGraph,
  getContainmentMode,
  hasGraphNode,
  isGraphLoaded,
  resizeCy,
  setContainmentMode,
  zoomIn,
  zoomOut,
} from './graph.js';
import { applyLocale, t } from './i18n.js';
import { exportGraphImage, getExportingState as getImageExportingState } from './image-export.js';
import { initLegend, setLegendEnabled, updateLegend } from './legend.js';
import { getAllElements, getAllRelations, loadModelData, setCurrentModel } from './model.js';
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
import { applyDrill, applyVisibility } from './visibility.js';

// ── INIT THEME (immediately, before anything else renders) ──────────────────
let storedTheme;
try {
  storedTheme = localStorage.getItem('architeezyTheme');
} catch {
  // Leave as undefined
}
setTheme(storedTheme ?? 'system');

function onSignOut() {
  signOut();
  setCachedModels([]);
  showToast(t('signedOut'));
  init();
}

// ── CYTOSCAPE BUILDER HELPER ────────────────────────────────────────────────

/** Builds a new Cytoscape instance from current model state, wiring standard handlers. */
function rebuildCytoscape() {
  buildCytoscape({
    elements: getAllElements(),
    relations: getAllRelations(),
    onNodeTap: (id) => showDetail(id, onNodeDrill),
    onNodeDblTap: onNodeDrill,
    onCanvasTap: () => clearDetail(),
    getDrillNodeId,
  });
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
  document.querySelector('.tab-group').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn[data-view]');
    if (!btn) {
      return;
    }
    switchView(btn.dataset.view, renderTable);
    if (btn.dataset.view === 'graph') {
      resizeCy();
    }
    updateExportButtonState(); // Refresh export button visibility/state
    syncUrl();
  });

  // Layout / graph controls
  document.getElementById('layout-select').addEventListener('change', applyLayout);
  document
    .getElementById('containment-select')
    .addEventListener('change', (e) => onContainmentChange(e.target.value));

  // Refresh layout button (on main controls panel)
  const refreshLayoutBtn = document.getElementById('refresh-layout-btn');
  if (refreshLayoutBtn) {
    refreshLayoutBtn.addEventListener('click', applyLayout);
  }

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
    .addEventListener('input', (e) => filterSearch('elem', e.target.value));
  document
    .getElementById('rel-filter-search')
    .addEventListener('input', (e) => filterSearch('rel', e.target.value));

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
  document.addEventListener('graph:syncUrl', syncUrl);
  updateExportButtonState();
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
  document.getElementById('table-search').addEventListener('input', renderTable);
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
    if (!getAllElements().length) {
      throw new Error(t('noElements'));
    }

    initColorMaps(getAllElements(), getAllRelations());

    localStorage.setItem('architeezyGraphModelUrl', url);
    clearDrillState();
    document.getElementById('crumb-entity-sep').classList.add('hidden');
    document.getElementById('drill-label').classList.add('hidden');

    const currentModelId =
      modelId ?? getCachedModels().find((m) => modelContentUrl(m) === url)?.id ?? undefined;
    setCurrentModel(currentModelId, currentModelNs);

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
  } catch (error) {
    hideLoading();
    showToast(error.message);
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
    }
    // Drill
    if (urlEntityId) {
      if (urlDepth !== undefined) {
        setDrillDepth(urlDepth);
      }
      if (hasGraphNode(urlEntityId)) {
        onNodeDrill(urlEntityId);
      }
    }
  };
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
  if (isAuthed()) {
    updateAuthUI();
  } else {
    await probeAuth();
  }

  // URL params take priority over localStorage
  const {
    modelId: urlModelId,
    entityId: urlEntityId,
    depth: urlDepth,
    entities: urlEntities,
    relationships: urlRelationships,
    view: urlView,
  } = readUrlParams();

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

  if (targetUrl) {
    await loadModel(targetUrl, targetModelId, afterLoad);

    if (isGraphLoaded()) {
      // If model list was fetched (URL param case), update name from the list
      const saved = getCachedModels().find((m) => modelContentUrl(m) === targetUrl);
      if (saved) {
        setCurrentModelName(saved.name);
      }
    } else {
      localStorage.removeItem('architeezyGraphModelUrl');
      localStorage.removeItem('architeezyGraphModelName');
      document.getElementById('cy').classList.add('hidden');
      openModelSelector();
    }
  } else {
    hideLoading();
    document.getElementById('cy').classList.add('hidden');
    openModelSelector();
  }
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
document.getElementById('legend-toggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  setLegendEnabled(enabled);
  // If currently in table view, keep legend hidden regardless of toggle state
  if (getCurrentView() === 'table') {
    document.getElementById('graph-legend').classList.add('hidden');
  }
});
restoreSidebarAndPanelState();
initLegend();
init();
