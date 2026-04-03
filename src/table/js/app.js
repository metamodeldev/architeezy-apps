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
import {
  addDataItem,
  addLevel,
  attachBuilderEvents,
  initBuilder,
  removeDataItem,
  removeLevel,
  renderBuilder,
  toggleDropdown,
  updateDirtyIndicator,
} from './builder.js';
import { computeMatrix } from './compute.js';
import { copyToClipboard, exportCsv } from './export.js';
import { applyLocale, t } from './i18n.js';
import { cloneDef, createDef, isDefReady, normalizeDef } from './matrix.js';
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
import {
  deleteMatrix,
  deleteTemplate,
  getLastDef,
  getSavedMatrices,
  getTemplates,
  saveLastDef,
  saveMatrix,
  saveTemplate,
} from './storage.js';
import { renderTable } from './table.js';
import { hideLoading, hideToast, setTheme, showError, showLoading, showToast } from './ui.js';
import { escHtml, modelContentUrl } from './utils.js';

// ── INIT THEME ───────────────────────────────────────────────────────────────
setTheme(localStorage.getItem('architeezyTheme') ?? 'system');

// ── LAST COMPUTED RESULT ─────────────────────────────────────────────────────
let _lastResult;

// ── REBUILD ──────────────────────────────────────────────────────────────────

/**
 * Recomputes the matrix and re-renders the table. Called whenever the definition changes.
 *
 * @param {object} def - The matrix definition to recompute.
 */
function rebuild(def) {
  state.currentDef = def;
  state.isDirty = true;
  updateDirtyIndicator();
  syncUrl();

  if (!isDefReady(def)) {
    renderTable(undefined, def);
    return;
  }
  try {
    _lastResult = computeMatrix(def);
    renderTable(_lastResult, def);
  } catch (error) {
    showToast(error.message);
    renderTable(undefined, def);
  }
}

// ── LOAD MODEL ───────────────────────────────────────────────────────────────

/**
 * Fetches and loads a model from the given URL, then invokes afterLoad on success.
 *
 * @param {string} url - Content URL of the model to load.
 * @param {string | undefined} modelId - Optional model ID for URL routing.
 * @param {Function | undefined} afterLoad - Callback invoked after a successful load.
 * @param {string} [contentType] - Optional model content type.
 */
async function loadModel(url, modelId, afterLoad, contentType = '') {
  showLoading(t('loadingModel'));
  try {
    const r = await apiFetch(url);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status} — ${r.statusText}`);
    }
    const data = await r.json();

    parseModel(data);
    if (!state.allElements.length) {
      throw new Error(t('noElements'));
    }

    localStorage.setItem('architeezyTableModelUrl', url);

    let resolvedModelId = modelId;
    let resolvedContentType = contentType;
    if (!resolvedModelId) {
      const found = state.cachedModels.find((m) => modelContentUrl(m) === url);
      if (found) {
        resolvedModelId = found.id ?? undefined;
        if (!resolvedContentType) {
          resolvedContentType = found.contentType ?? '';
        }
      }
    }
    state.currentModelId = resolvedModelId;
    state.currentModelContentType = resolvedContentType;

    hideLoading();

    // Restore or create matrix definition
    afterLoad?.();
  } catch (error) {
    hideLoading();
    if (_lastResult) {
      showToast(error.message);
    }
    // State.allElements will be empty; caller detects this
  }
}

// ── APPLY DEFINITION ─────────────────────────────────────────────────────────

/**
 * Applies a definition to the builder and rebuilds.
 *
 * @param {object} def - The matrix definition to apply.
 * @param {boolean} [markClean] - When true, clears the dirty flag after applying.
 */
function applyDef(def, markClean = false) {
  state.currentDef = def;
  state.isDirty = !markClean;
  renderBuilder(def);
  updateSavedDropdown();
  updateTemplatesDropdown();
  rebuild(def);
}

// ── SAVED / TEMPLATES DROPDOWNS ──────────────────────────────────────────────

function updateSavedDropdown() {
  const list = document.getElementById('saved-dropdown');
  if (!list) {
    return;
  }
  const matrices = getSavedMatrices();
  if (!matrices.length) {
    list.innerHTML = `<div class="dd-empty">${t('noSaved')}</div>`;
    return;
  }
  list.innerHTML = matrices
    .map(
      (m) => `
    <div class="dd-item" data-id="${escHtml(m.id)}">
      <span class="dd-item-name">${escHtml(m.name || t('namePh'))}</span>
      <button class="dd-del-btn" data-id="${escHtml(m.id)}" title="${t('deleteConfirm')}">✕</button>
    </div>`,
    )
    .join('');

  for (const item of list.querySelectorAll('.dd-item')) {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.dd-del-btn')) {
        const id = e.target.closest('.dd-del-btn').dataset.id;
        deleteMatrix(id);
        updateSavedDropdown();
        return;
      }
      const id = item.dataset.id;
      const found = getSavedMatrices().find((m) => m.id === id);
      if (found) {
        applyDef(normalizeDef(cloneDef(found, found.name)) ?? createDef(), true);
        toggleDropdown('');
      }
    });
  }
}

function updateTemplatesDropdown() {
  const list = document.getElementById('templates-dropdown');
  if (!list) {
    return;
  }
  const templates = getTemplates();
  if (!templates.length) {
    list.innerHTML = `<div class="dd-empty">${t('noTemplates')}</div>`;
    return;
  }
  list.innerHTML = templates
    .map(
      (m) => `
    <div class="dd-item" data-id="${escHtml(m.id)}">
      <span class="dd-item-name">${escHtml(m.name || t('namePh'))}</span>
      <button class="dd-del-btn" data-id="${escHtml(m.id)}" title="${t('deleteConfirm')}">✕</button>
    </div>`,
    )
    .join('');

  for (const item of list.querySelectorAll('.dd-item')) {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.dd-del-btn')) {
        const id = e.target.closest('.dd-del-btn').dataset.id;
        deleteTemplate(id);
        updateTemplatesDropdown();
        return;
      }
      const id = item.dataset.id;
      const found = getTemplates().find((m) => m.id === id);
      if (found) {
        applyDef(normalizeDef(cloneDef(found, found.name)) ?? createDef());
        showToast(t('templateApplied'));
        toggleDropdown('');
      }
    });
  }
}

// ── SAVE ACTIONS ─────────────────────────────────────────────────────────────

globalThis.doSaveMatrix = function doSaveMatrix() {
  const def = state.currentDef;
  if (!def) {
    return;
  }
  if (!def.name) {
    // eslint-disable-next-line no-alert
    const name = globalThis.prompt(t('savePrompt'), t('namePh'));
    // eslint-disable-next-line unicorn/no-null
    if (name === null) {
      return;
    }
    def.name = name;
    document.getElementById('matrix-name-input').value = name;
  }
  const result = saveMatrix(def);
  if (result === 'limit_reached') {
    showToast(t('limitReached'));
    return;
  }
  state.isDirty = false;
  saveLastDef(def);
  updateDirtyIndicator();
  updateSavedDropdown();
  showToast(t('savedOk'));
};

globalThis.doSaveTemplate = function doSaveTemplate() {
  const def = state.currentDef;
  if (!def) {
    return;
  }
  // eslint-disable-next-line no-alert
  const name = globalThis.prompt(t('templateSavePrompt'), def.name || t('templateNamePh'));
  // eslint-disable-next-line unicorn/no-null
  if (name === null) {
    return;
  }
  const tmpl = cloneDef(def, name);
  const result = saveTemplate(tmpl);
  if (result === 'limit_reached') {
    showToast(t('limitReached'));
    return;
  }
  updateTemplatesDropdown();
  showToast(t('templateSavedOk'));
};

globalThis.doNewMatrix = function doNewMatrix() {
  const def = createDef();
  applyDef(def);
};

globalThis.doExportCsv = function doExportCsv() {
  if (!_lastResult) {
    return;
  }
  exportCsv(_lastResult, state.currentDef?.name);
};

globalThis.doCopyClipboard = async function doCopyClipboard() {
  if (!_lastResult) {
    return;
  }
  try {
    await copyToClipboard(_lastResult);
    showToast('✓ Copied');
  } catch {
    showToast('Copy failed');
  }
};

globalThis.addLevel = addLevel;
globalThis.removeLevel = removeLevel;
globalThis.addDataItem = addDataItem;
globalThis.removeDataItem = removeDataItem;
globalThis.toggleDropdown = toggleDropdown;

// ── SIDEBAR TOGGLE ───────────────────────────────────────────────────────────

globalThis.toggleSidebar = function toggleSidebar() {
  const sidebar = document.getElementById('builder-sidebar');
  const btn = document.getElementById('sidebar-toggle-btn');
  const collapsed = sidebar.classList.toggle('collapsed');
  btn.textContent = collapsed ? '›' : '‹';
  btn.title = collapsed ? 'Show builder' : 'Hide builder';
};

// ── SECTION TOGGLE ───────────────────────────────────────────────────────────

globalThis.toggleSection = function toggleSection(id) {
  const sec = document.getElementById(id);
  const icon = document.getElementById(`icon-${id}`);
  if (!sec) {
    return;
  }
  const collapsed = sec.classList.toggle('bl-collapsed');
  if (icon) {
    icon.classList.toggle('rotated', collapsed);
  }
};

// Ensure collapsed class works on bl-section-body elements
// (bl-collapsed hides the section body via CSS)

// ── WINDOW GLOBALS ───────────────────────────────────────────────────────────

globalThis.startAuth = startAuth;
globalThis.signOut = () => {
  signOut();
  init();
};
globalThis.openModelSelector = openModelSelector;
globalThis.closeModelSelector = closeModelSelector;
globalThis.hideToast = hideToast;
globalThis.filterModelList = filterModelList;
globalThis.setTheme = setTheme;
globalThis.init = init;

// ── AUTH_SUCCESS from popup ──────────────────────────────────────────────────
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'AUTH_SUCCESS') {
    return;
  }
  handleAuthSuccess(e.data.token);
  fetchCurrentUser();
  init();
});

// ── loadModel event from models.js ───────────────────────────────────────────
document.addEventListener('loadModel', (e) => {
  const { url, modelId, contentType } = e.detail;
  loadModel(
    url,
    modelId,
    () => {
      // After model loaded: restore last def or start fresh
      const lastDef = getLastDef();
      const def = lastDef ? (normalizeDef(cloneDef(lastDef)) ?? createDef()) : createDef();
      applyDef(def, Boolean(lastDef));
    },
    contentType,
  );
});

// ── INIT ─────────────────────────────────────────────────────────────────────

function _afterModelLoad(targetUrl) {
  if (state.allElements.length) {
    const saved = state.cachedModels.find((m) => modelContentUrl(m) === targetUrl);
    if (saved) {
      setCurrentModelName(saved.name);
    }
    updateSavedDropdown();
    updateTemplatesDropdown();
  } else {
    localStorage.removeItem('architeezyTableModelUrl');
    if (!state.currentDef) {
      applyDef(createDef(), true);
    }
    openModelSelector();
  }
}

async function init() {
  applyLocale();
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

  initBuilder((def) => {
    rebuild(def);
    saveLastDef(def);
  });
  attachBuilderEvents();

  // Guarantee state.currentDef is always set before the user can interact with
  // The sidebar buttons.  applyDef() will overwrite this once a real model
  // Definition is available (after model load or saved matrix restore).
  if (!state.currentDef) {
    state.currentDef = createDef();
    renderBuilder(state.currentDef);
  }

  const { modelId: urlModelId, def: urlDef } = readUrlParams();

  const urlModel = urlModelId ? state.cachedModels.find((m) => m.id === urlModelId) : undefined;
  const targetUrl = urlModel
    ? modelContentUrl(urlModel)
    : localStorage.getItem('architeezyTableModelUrl');
  const targetModelId = urlModel?.id;
  const targetContentType = urlModel?.contentType ?? '';

  if (targetUrl) {
    await loadModel(
      targetUrl,
      targetModelId,
      () => {
        const rawDef = urlDef ? cloneDef(urlDef) : (getLastDef() ?? createDef());
        const def = normalizeDef(rawDef) ?? createDef();
        applyDef(def, !urlDef);
      },
      targetContentType,
    );
    _afterModelLoad(targetUrl);
  } else {
    // No model cached — initialise a blank def so sidebar buttons work
    applyDef(createDef(), true);
    openModelSelector();
  }
}

// ── BOOT ─────────────────────────────────────────────────────────────────────
init();
