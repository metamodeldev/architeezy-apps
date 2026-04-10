/**
 * Model Selector Component - Reactive Service-Based Architecture
 *
 * UI component for selecting models from the ModelService. Uses signals for state management and
 * effects for DOM updates.
 *
 * @module model/selector
 * @package
 */

import { t } from '../i18n.js';
import { showLoading } from '../notification/index.js';
import { pushState } from '../router/index.js';
import { effect, signal } from '../signals/index.js';
import { escHtml } from '../utils.js';
import {
  fetchModelList,
  getModelList,
  getModelName,
  load,
  modelContentUrl,
  modelTypeLabel,
  setCurrentModelName,
  setModelList,
} from './service.js';

// ── PRIVATE SIGNALS ─────────────────────────────────────────────────────────────

/** @type {import('../signals').Signal<string>} */
const _searchQuery = signal('', 'model-search-query');

/** @type {import('../signals').Signal<boolean>} */
const _isModalOpen = signal(false, 'model-modal-open');

/** @type {import('../signals').Signal<boolean>} */
const _listLoading = signal(false, 'model-list-loading');

/** @type {import('../signals').Signal<string>} */
const _error = signal('', 'model-error');

// ── COMPUTED ────────────────────────────────────────────────────────────────────

// ── PUBLIC FUNCTIONS ───────────────────────────────────────────────────────────

/** Opens the model selector modal. Resets search, focuses input, and fetches model list if needed. */
export async function open() {
  _isModalOpen.value = true;
  _searchQuery.value = '';
  _error.value = '';

  const modelList = getModelList();
  if (modelList.length === 0) {
    _listLoading.value = true;
    try {
      await fetchModelListInternal();
    } catch {
      // Error is set in fetchModelListInternal
    } finally {
      _listLoading.value = false;
    }
  }

  // Render the model list after ensuring data is loaded
  renderModelList();

  // Focus search input after modal opens
  setTimeout(() => {
    const searchInput = document.getElementById('model-search');
    if (searchInput) {
      searchInput.focus();
    }
  }, 0);
}

/** Closes the model selector modal. */
export function close() {
  _isModalOpen.value = false;
}

/**
 * Updates the search query.
 *
 * @param {string} q - Search query
 */
export function setSearchQuery(q) {
  _searchQuery.value = q;
  // Re-render the list whenever search query changes
  renderModelList();
}

/**
 * Selects a model and updates application state.
 *
 * @param {object} model - The selected model object
 */
export async function selectModel(model) {
  close();

  try {
    const url = modelContentUrl(model);
    if (!url) {
      throw new Error(t('invalidModelUrl'));
    }
    const modelName = model.name;
    showLoading(t('loadingModel'));
    // Push current state to create new history entry before loading.
    // Clear drill params so the new model starts without stale entity/depth.
    pushState({ model: model.id, entity: undefined, depth: undefined });
    // Load the model (will hide loading on completion)
    await load(model.id, url);
    if (modelName) {
      setCurrentModelName(modelName);
    }
  } catch (error) {
    console.error('Failed to select model:', error);
    showErrorInModal(t('modelSelectError') + ': ' + error.message);
  }
}

/** Internal async fetch for model list. Sets loading and error states. */
async function fetchModelListInternal() {
  _error.value = '';
  try {
    const models = await fetchModelList();
    setModelList(models);
  } catch (error) {
    _error.value = error.message || t('unknownError');
    throw error;
  }
}

/** Renders the model list to the DOM. */
function renderModelList() {
  const container = document.getElementById('model-list');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  const query = _searchQuery.value.toLowerCase();
  let models = getModelList();

  // Apply search filter
  if (query) {
    models = models.filter((model) => {
      const typeLabel = modelTypeLabel(model.contentType);
      return (
        model.name.toLowerCase().startsWith(query) ||
        typeLabel.toLowerCase().startsWith(query) ||
        (model.description ?? '').toLowerCase().startsWith(query)
      );
    });
  }

  // Only include models with a valid content URL
  models = models.filter((model) => {
    const url = modelContentUrl(model);
    return url !== undefined;
  });

  const currentUrl = localStorage.getItem('architeezyGraphModelUrl');

  if (models.length === 0) {
    if (_listLoading.value) {
      container.innerHTML = `<div class="model-list-loading">${t('modalLoading')}</div>`;
    } else if (_error.value) {
      showErrorInModal(_error.value);
    } else if (query) {
      container.innerHTML = `<div class="model-list-loading">${t('noResults')}</div>`;
    } else {
      container.innerHTML = `<div class="empty-model-message">${t('emptyModelList')}</div>`;
    }
    return;
  }

  for (const model of models) {
    const itemEl = createModelItemElement(model, currentUrl);
    container.append(itemEl);
  }
}

/**
 * Creates the icon element for a model item.
 *
 * @returns {HTMLElement} The icon element
 */
function createModelIcon() {
  const icon = document.createElement('div');
  icon.className = 'model-item-icon';
  icon.textContent = '📐';
  return icon;
}

/**
 * Creates the meta element (badge and optional description) for a model item.
 *
 * @param {string} typeLabel - The formatted type label
 * @param {object} model - Model object containing optional description
 * @returns {HTMLElement} The meta element
 */
function createModelMeta(typeLabel, model) {
  const meta = document.createElement('div');
  meta.className = 'model-item-meta';

  const badge = document.createElement('span');
  badge.className = 'model-type-badge';
  badge.textContent = escHtml(typeLabel);
  meta.append(badge);

  if (model.description) {
    const desc = document.createElement('span');
    desc.className = 'model-item-desc';
    desc.textContent = model.description;
    meta.append(desc);
  }

  return meta;
}

/**
 * Creates a DOM element for a single model item.
 *
 * @param {object} model - Model object
 * @param {string | null} currentUrl - Currently loaded model URL
 * @returns {HTMLElement} The model item DOM element
 */
function createModelItemElement(model, currentUrl) {
  const typeLabel = modelTypeLabel(model.contentType);
  const url = modelContentUrl(model);

  const item = document.createElement('div');
  item.className = `model-item${url === currentUrl ? ' active' : ''}`;
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.dataset.modelId = model.id;

  const icon = createModelIcon();

  const info = document.createElement('div');
  info.className = 'model-item-info';

  const nameEl = document.createElement('div');
  nameEl.className = 'model-item-name';
  nameEl.textContent = model.name;
  nameEl.title = escHtml(model.name);

  const meta = createModelMeta(typeLabel, model);

  info.append(nameEl, meta);
  item.append(icon, info);

  if (!url) {
    item.classList.add('disabled');
    item.setAttribute('aria-disabled', 'true');
  } else {
    item.addEventListener('click', () => {
      selectModel(model);
    });
  }

  return item;
}

/**
 * Displays an error message in the modal list container.
 *
 * @param {string} message - Error message
 */
function showErrorInModal(message) {
  const container = document.getElementById('model-list');
  if (container) {
    container.innerHTML = `<div class="error-message">${escHtml(message)}</div>`;
  }
}

/**
 * Handles keyboard navigation in the modal.
 *
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleModalKeydown(e) {
  if (e.key === 'Escape') {
    close();
    e.preventDefault();
    return;
  }

  const modal = document.getElementById('model-modal');
  if (!modal || !_isModalOpen.value) {
    return;
  }

  const items = modal.querySelectorAll('.model-item:not(.disabled):not([aria-disabled="true"])');

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    let targetIndex;

    if (document.activeElement === modal) {
      targetIndex = e.key === 'ArrowDown' ? 0 : items.length - 1;
    } else {
      const currentIndex = [...items].indexOf(document.activeElement);
      if (currentIndex === -1) {
        return;
      }
      targetIndex = e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

      // Wrap around
      if (targetIndex < 0) {
        targetIndex = items.length - 1;
      }
      if (targetIndex >= items.length) {
        targetIndex = 0;
      }
    }

    if (items[targetIndex]) {
      items[targetIndex].focus();
    }
    e.preventDefault();
  } else if (e.key === 'Enter' || e.key === 'Space') {
    if (document.activeElement.classList.contains('model-item')) {
      document.activeElement.click();
      e.preventDefault();
    }
  }
}

// ── EFFECTS ─────────────────────────────────────────────────────────────────────

/** Sets up effect for loading state. */
function setupLoadingEffect() {
  effect(() => {
    const container = document.getElementById('model-list');
    if (!container) {
      return;
    }

    if (_listLoading.value) {
      container.innerHTML = `<div class="model-list-loading">${t('modalLoading')}</div>`;
    }
  });
}

/** Sets up effect for error display. */
function setupErrorEffect() {
  effect(() => {
    if (_error.value && _isModalOpen.value) {
      showErrorInModal(_error.value);
    }
  });
}

/** Sets up effect to show/hide modal based on _isModalOpen. */
function setupVisibilityEffect() {
  effect(() => {
    const modal = document.getElementById('model-modal');
    if (modal) {
      modal.classList.toggle('hidden', !_isModalOpen.value);
    }
  });
}

// ── EVENT WIRING ───────────────────────────────────────────────────────────────

/** Initializes DOM event listeners. */
function wireEvents() {
  const modal = document.getElementById('model-modal');
  const searchInput = document.getElementById('model-search');
  const closeBtn = document.getElementById('modal-close-btn');
  const currentModelBtn = document.getElementById('current-model-btn');

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      setSearchQuery(e.target.value);
    });
  }

  // Current model button (in header)
  if (currentModelBtn) {
    currentModelBtn.addEventListener('click', open);
  }

  // Backdrop click to close
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        close();
      }
    });

    // Keyboard navigation
    modal.addEventListener('keydown', handleModalKeydown);
  }

  // Global Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _isModalOpen.value) {
      close();
    }
  });
}

// ── PUBLIC API (INIT) ───────────────────────────────────────────────────────────

/** Initializes the model selector component. Sets up effects and event listeners. */
export function initModelSelector() {
  setupLoadingEffect();
  setupErrorEffect();
  setupVisibilityEffect();
  wireEvents();

  // Reactively update the current model name in the header
  effect(() => {
    const name = getModelName();
    const el = document.getElementById('current-model-name');
    if (el) {
      el.textContent = name ?? '';
    }
  });
}
