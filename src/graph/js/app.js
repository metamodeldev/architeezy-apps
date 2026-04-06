/**
 * Application entry point.
 *
 * Initializes feature modules and loads the initial model.
 *
 * @module app
 * @package
 */

// ── ENTRY POINT ────────────────────────────────────────────────────────────────

import {
  isAuthed,
  probeAuth,
  updateAuthUI,
  init as initAuth,
} from './auth/index.js';
import { registerDrillUrlParams, init as initDrillDown } from './drill-down/index.js';
import { applyVisibility, initializeFilters, initFilter, registerFilterUrlParams } from './filter/index.js';
import {
  getContainmentMode,
  getCy,
  isGraphLoaded,
  isTooltipsEnabled,
  setTooltipsEnabled,
  init as initGraph,
  rebuildGraph,
} from './graph/index.js';

import { applyLocale } from './i18n.js';
import {
  clearModelData,
  handleNoTargetUrl,
  handleTargetLoad,
  init as initModel,
  registerModelUrlParams,
  setCachedModels,
  tryLoadFromLocalStorage,
  tryLoadFromUrlParam,
} from './model/index.js';
import { prepareLoadContext, restoreStateFromUrl } from './navigation/index.js';
import { wireSyncUrlListener } from './routing/index.js';
import {
  hideLoading,
  initDetail,
  initEvents,
  initLegend,
  initLegendModule,
  restoreSidebarAndPanelState,
  setTheme,
  registerViewUrlParams,
} from './ui/index.js';

import { init as initHighlight } from './highlight/index.js';
import { initSearch } from './search/index.js';
import { initTable, initializeTable } from './table/index.js';
import { init as initGraphExport } from './graph-export/index.js';

// ── INIT SEQUENCE ──────────────────────────────────────────────────────────────

async function initDOM() {
  // Do not hide loading here; it will be hidden after model load or when selector opens
  applyLocale();

  // Theme
  let storedTheme;
  try {
    storedTheme = localStorage.getItem('architeezyTheme');
  } catch {
    // Ignore storage errors
  }
  setTheme(storedTheme ?? 'system');

  // Containment select initial value
  document.getElementById('containment-select').value = getContainmentMode();

  // Layout select: restore saved preference or keep HTML default (fcose)
  const layoutSelect = document.getElementById('layout-select');
  if (layoutSelect) {
    const savedLayout = localStorage.getItem('architeezyGraphLayout');
    const validLayouts = ['fcose', 'dagre', 'cose', 'breadthfirst', 'grid', 'circle'];
    if (savedLayout && validLayouts.includes(savedLayout)) {
      layoutSelect.value = savedLayout;
    }
  }

  // Auth
  if (isAuthed()) {
    updateAuthUI();
  } else {
    await probeAuth();
  }
}

function initEventBridges() {
  document.addEventListener('auth:signOut', () => {
    clearModelData();
    setCachedModels([]);
  });
  document.addEventListener('model:contentLoaded', () => {
    if (!isGraphLoaded()) {
      initGraph();
      const cy = getCy();
      initGraphFeatureModules(cy);
    } else {
      rebuildGraph(getContainmentMode());
      initializeFilters();
      applyVisibility();
      initializeTable();
    }
  });
}

function initUIModules() {
  // Register URL param handlers
  registerModelUrlParams();
  registerFilterUrlParams();
  registerDrillUrlParams();
  registerViewUrlParams();

  // Toggle tooltips switch
  document.getElementById('tooltips-toggle').checked = isTooltipsEnabled();
  document.getElementById('tooltips-toggle').addEventListener('change', (e) => {
    setTooltipsEnabled(e.target.checked);
  });

  // Initialize UI modules
  initEvents(boot); // Wires sidebar, tabs, theme, toast, retry
  initDetail(); // Listens to graph:nodeTap, graph:nodeDrilled, detail:requestShow
  initLegendModule(); // Listens to graph:stateChange, highlight:legendUpdate
  initLegend(); // Restores position/visibility, wires drag
  initModel(); // Wires model selector modal, loadModel event, model:loadFailed
  initAuth(boot); // Wires auth-btn, signout-btn, message listener

  restoreSidebarAndPanelState();

  // URL sync + popstate
  wireSyncUrlListener();
  globalThis.addEventListener('popstate', restoreStateFromUrl);
}

async function loadInitialModel(afterLoad) {
  const { urlModelId } = prepareLoadContext();

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
    // Note: filter initialization moved to initGraphFeatureModules()
  } else {
    handleNoTargetUrl(urlModelId);
  }
}

function initGraphFeatureModules(cy) {
  // Initialize filter state and UI after graph is built and before applying filter visibility
  initializeFilters();
  initFilter(cy);
  // Render initial table after filter state is ready
  initializeTable();
  initDrillDown(cy);
  initHighlight(cy);
  initSearch();
  initTable();
  initGraphExport();
}

function restoreNavigationState() {
  restoreStateFromUrl();
}

async function boot() {
  await initDOM();
  initEventBridges();
  initUIModules();
  await loadInitialModel(async () => {
    // graph init and feature modules are handled by the model:contentLoaded listener
    // in initEventBridges; here we only need to restore navigation state
    restoreNavigationState();
  });
}

boot();
