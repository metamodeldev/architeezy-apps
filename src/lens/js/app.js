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
import { exitDrill, onNodeDrill, restoreDrillRootStyle } from './drill.js';
import {
  applyUrlFilters,
  buildFilters,
  filterSearch,
  loadFilterState,
  selectAll,
} from './filters.js';
import { applyLayout, buildCytoscape, fitGraph } from './graph.js';
import { applyLocale, t } from './i18n.js';
import {
  closeModelSelector,
  fetchModelList,
  filterModelList,
  openModelSelector,
  setCurrentModelName,
} from './models.js';
import { parseModel } from './parser.js';
import { readUrlParams, syncUrl } from './routing.js';
import { state } from './state.js';
import { renderTable, switchTableTab } from './table.js';
import {
  hideLoading,
  hideToast,
  setTheme,
  showError,
  showLoading,
  showToast,
  switchView,
  toggleSection,
} from './ui.js';
import { modelContentUrl } from './utils.js';
import { applyDrill, applyVisibility } from './visibility.js';

// ── INIT THEME (immediately, before anything else renders) ──────────────────
setTheme(localStorage.getItem('architeezyTheme') ?? 'system');

// ── WINDOW GLOBALS (for HTML onclick= handlers) ────────────────────────────
globalThis.startAuth = startAuth;
globalThis.signOut = () => {
  signOut();
  init();
};
globalThis.openModelSelector = openModelSelector;
globalThis.closeModelSelector = closeModelSelector;
globalThis.hideToast = hideToast;
globalThis.switchView = (view) => {
  switchView(view, renderTable);
  syncUrl();
};
globalThis.applyLayout = applyLayout;
globalThis.fitGraph = fitGraph;
globalThis.filterModelList = filterModelList;
globalThis.filterSearch = filterSearch;
globalThis.selectAll = selectAll;
globalThis.toggleSection = toggleSection;
globalThis.setTheme = setTheme;
globalThis.setContainmentMode = setContainmentMode;
globalThis.switchTableTab = switchTableTab;
globalThis.renderTable = renderTable;
globalThis.exitDrill = exitDrill;
globalThis.init = init;

// Zoom controls (buttons in HTML use these)
globalThis.zoomIn = () => {
  if (!state.cy) {
    return;
  }
  state.cy.zoom(state.cy.zoom() * 1.3);
  state.cy.center();
};
globalThis.zoomOut = () => {
  if (!state.cy) {
    return;
  }
  state.cy.zoom(state.cy.zoom() * 0.77);
  state.cy.center();
};

// ── AUTH_SUCCESS from popup ─────────────────────────────────────────────────
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'AUTH_SUCCESS') {
    return;
  }
  handleAuthSuccess(e.data.token);
  fetchCurrentUser();
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
function setContainmentMode(mode) {
  state.containmentMode = mode;
  localStorage.setItem('architeezyLensContainment', mode);
  document.getElementById('containment-select').value = mode;
  if (!state.allElements.length) {
    return;
  }
  buildCytoscape({
    onNodeTap: (id) => showDetail(id, (node) => onNodeDrill(node)),
    onNodeDblTap: (node) => onNodeDrill(node),
    onCanvasTap: () => clearDetail(),
  });
  restoreDrillRootStyle();
  if (state.drillNodeId) {
    applyDrill();
  } else {
    applyVisibility();
  }
  applyLayout();
}

// ── LOAD MODEL ─────────────────────────────────────────────────────────────

/**
 * Fetches and loads a model from `url`, then builds the graph, filters, and table. On failure,
 * shows a toast if a model is already visible, otherwise lets the caller detect `state.cy === null`
 * and open the model selector.
 *
 * @param {string} url - Content URL of the model to load.
 * @param {string | undefined} [modelId] - Optional model ID for URL routing.
 * @param {Function | undefined} [afterLoad] - Optional callback invoked after a successful load.
 */
async function loadModel(url, modelId, afterLoad) {
  showLoading(t('loadingModel'));
  try {
    const r = await apiFetch(url);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status} — ${r.statusText}`);
    }
    const data = await r.json();

    Object.assign(state, parseModel(data));
    if (!state.allElements.length) {
      throw new Error(t('noElements'));
    }

    localStorage.setItem('architeezyLensModelUrl', url);
    Object.assign(state, { drillNodeId: undefined, drillVisibleIds: undefined });
    document.getElementById('drill-bar').classList.remove('visible');

    state.currentModelId =
      modelId ?? state.cachedModels.find((m) => modelContentUrl(m) === url)?.id ?? undefined;

    buildCytoscape({
      onNodeTap: (id) => showDetail(id, (node) => onNodeDrill(node)),
      onNodeDblTap: (node) => onNodeDrill(node),
      onCanvasTap: () => clearDetail(),
    });
    buildFilters();
    loadFilterState();
    applyVisibility();
    applyLayout();
    hideLoading();
    document.getElementById('stats-bar').style.display = 'flex';
    renderTable();
    afterLoad?.();
    syncUrl();
  } catch (error) {
    hideLoading();
    if (state.cy) {
      // A model is already displayed — keep it, show a dismissible toast
      showToast(error.message);
    }
    // If no model is loaded, caller (init) detects state.cy===null and opens the selector
  }
}

// ── INIT ───────────────────────────────────────────────────────────────────

/**
 * Application entry point: applies locale, checks auth, fetches the model list, then loads the
 * model from the URL or localStorage. If no model URL is available, opens the model selector
 * modal.
 */
async function init() {
  applyLocale();
  document.getElementById('containment-select').value = state.containmentMode;
  if (isAuthed()) {
    updateAuthUI();
  } else {
    await probeAuth();
  }
  showLoading(t('loadingModels'));
  try {
    state.cachedModels = await fetchModelList();
  } catch (error) {
    showError(error.message);
    return;
  }
  hideLoading();

  // URL params take priority over localStorage
  const {
    modelId: urlModelId,
    entityId: urlEntityId,
    depth: urlDepth,
    entities: urlEntities,
    relationships: urlRelationships,
    view: urlView,
  } = readUrlParams();

  const urlModel = urlModelId ? state.cachedModels.find((m) => m.id === urlModelId) : undefined;
  const targetUrl = urlModel
    ? modelContentUrl(urlModel)
    : localStorage.getItem('architeezyLensModelUrl');
  const targetModelId = urlModel ? urlModelId : undefined;

  const hasUrlState =
    urlEntities !== undefined || urlRelationships !== undefined || urlEntityId || urlView;

  const afterLoad = hasUrlState
    ? () => {
        // Filter state always comes from URL when restoring from a shared link.
        // Absent entities/relationships means all types visible — override localStorage.
        const allETypes = [...new Set(state.allElements.map((e) => e.type))];
        const allRTypes = [...new Set(state.allRelations.map((r) => r.type))];
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
            state.drillDepth = urlDepth;
          }
          const node = state.cy?.getElementById(urlEntityId);
          if (node?.length) {
            onNodeDrill(node);
          }
        }
      }
    : undefined;

  if (targetUrl) {
    await loadModel(targetUrl, targetModelId, afterLoad);

    if (state.cy) {
      const saved = state.cachedModels.find((m) => modelContentUrl(m) === targetUrl);
      if (saved) {
        setCurrentModelName(saved.name);
      }
    } else {
      localStorage.removeItem('architeezyLensModelUrl');
      openModelSelector();
    }
  } else {
    openModelSelector();
  }
}

// ── BOOT ───────────────────────────────────────────────────────────────────

init();
