/**
 * Model selection and listing functionality.
 *
 * @module model/selector
 * @package
 */

import { apiFetch, BASE_URL } from '../api.js';
import { isAuthErrorShown, setAuthErrorShown } from '../auth/index.js';
import { t } from '../i18n.js';
import { escHtml } from '../utils.js';
import { loadAndDisplayModel } from './loader.js';
import { getAllElements, getCachedModels, setCachedModels } from './state.js';

const MODELS_API = `${BASE_URL}/api/models?size=100`;

/**
 * Derives a short human-readable label from a model's `contentType` string.
 *
 * @param {string | undefined} contentType - The model's MIME-type-like content type.
 * @returns {string} Short label, or "?" when no recognisable pattern is found.
 */
export function modelTypeLabel(contentType) {
  if (!contentType) {
    return '?';
  }
  const m = contentType.match(/\/metamodel\/([^/]+)\//);
  if (m) {
    return m[1].toUpperCase();
  }
  const hash = contentType.split('#')[1];
  return hash ? hash.replace(/Model$/, '') : '?';
}

/**
 * Resolves the content fetch URL for a model object returned by the API. Prefers the
 * `_links.content` HAL link; falls back to constructing the canonical API path from the model's
 * slug fields.
 *
 * @param {object} model - A model object from the API model list.
 * @returns {string | undefined} The content URL, or undefined if it cannot be resolved.
 */
export function modelContentUrl(model) {
  const links = model._links?.content;
  if (Array.isArray(links) && links[0]?.href) {
    return links[0].href.replaceAll(/\{[^}]*\}/g, '');
  }
  if (links?.href) {
    return links.href.replaceAll(/\{[^}]*\}/g, '');
  }
  const { scopeSlug, projectSlug, projectVersion, slug } = model;
  if (scopeSlug && projectSlug && projectVersion && slug) {
    return `${BASE_URL}/api/models/${scopeSlug}/${projectSlug}/${projectVersion}/${slug}/content?format=json`;
  }
}

// Cached model list - now in model/state.js

/**
 * Fetches the full paginated model list from the API. Follows `_links.next` until all pages are
 * consumed.
 *
 * @returns {Promise<Array>} Resolved list of model objects.
 * @throws {Error} If any page request fails or the list is empty.
 */
export async function fetchModelList() {
  const models = [];
  let url = MODELS_API;
  while (url) {
    // eslint-disable-next-line no-await-in-loop
    const r = await apiFetch(url);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }
    // eslint-disable-next-line no-await-in-loop
    const data = await r.json();
    models.push(...(data._embedded?.models ?? []));
    const next = data._links?.next?.href;
    url = next && next !== url ? next : undefined;
  }
  if (!models.length) {
    throw new Error(t('emptyModelList'));
  }
  return models;
}

// GetCachedModels and setCachedModels are exported from ./state.js
export { getCachedModels, setCachedModels } from './state.js';

/**
 * Opens the model-selector modal and focuses the search input. Fetches the model list on first open
 * (or after the cache is cleared); shows a loading placeholder until the list is ready.
 */
export async function openModelSelector() {
  document.getElementById('model-modal').classList.remove('hidden');
  document.getElementById('model-search').value = '';
  document.getElementById('model-search').focus();

  if (!getCachedModels().length) {
    document.getElementById('model-list').innerHTML =
      `<div class="model-list-loading">${t('modalLoading')}</div>`;
    try {
      setCachedModels(await fetchModelList());
    } catch (error) {
      document.getElementById('model-list').innerHTML =
        `<div class="empty-model-message">${escHtml(error.message)}</div>`;
      return;
    }
  }

  renderModelList(getCachedModels(), '');
}

/** Closes the model-selector modal. */
export function closeModelSelector() {
  document.getElementById('model-modal').classList.add('hidden');
}

/**
 * Renders the model list inside the modal, filtered by `query`. Items without a resolvable content
 * URL are shown as disabled.
 *
 * @param {Array} models - List of model objects from the API.
 * @param {string} query - Filter string (matched against name, type label, and description).
 */
export function renderModelList(models, query) {
  const q = query.toLowerCase();
  const container = document.getElementById('model-list');
  const currentUrl = localStorage.getItem('architeezyGraphModelUrl');
  container.innerHTML = '';

  for (const model of models) {
    const typeLabel = modelTypeLabel(model.contentType);
    const url = modelContentUrl(model);
    if (
      q &&
      !model.name.toLowerCase().startsWith(q) &&
      !typeLabel.toLowerCase().startsWith(q) &&
      !(model.description ?? '').toLowerCase().startsWith(q)
    ) {
      continue;
    }

    const item = document.createElement('div');
    item.className = `model-item${url === currentUrl ? ' active' : ''}`;
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.innerHTML = `
      <div class="model-item-icon">📐</div>
      <div class="model-item-info">
        <div class="model-item-name" title="${escHtml(model.name)}">${escHtml(model.name)}</div>
        <div class="model-item-meta">
          <span class="model-type-badge">${escHtml(typeLabel)}</span>
          ${model.description ? `<span class="model-item-desc">${escHtml(model.description)}</span>` : ''}
        </div>
      </div>`;

    if (url) {
      item.addEventListener('click', () => {
        closeModelSelector();
        setCurrentModelName(model.name);
        // Push a new history entry for model switch (major transition)
        const newUrl = new URL(location.href);
        newUrl.searchParams.set('model', model.id ?? undefined);
        // oxlint-disable-next-line unicorn/no-null
        history.pushState(null, '', newUrl);
        // LoadModel is in app.js; use a custom event to avoid circular dependency
        document.dispatchEvent(
          new CustomEvent('loadModel', {
            detail: { url, modelId: model.id ?? undefined },
          }),
        );
      });
    } else {
      item.classList.add('disabled');
    }
    container.append(item);
  }

  if (!container.children.length) {
    container.innerHTML = `<div class="model-list-loading">${t('noResults')}</div>`;
  }
}

/**
 * Re-renders the model list using the cached model array, filtered by `query`. Bound to the search
 * input's `oninput` event.
 *
 * @param {string} query - Search string typed by the user.
 */
export function filterModelList(query) {
  renderModelList(getCachedModels(), query);
}

/**
 * Updates the header model name label and the document title.
 *
 * @param {string} name - Display name of the loaded model.
 */
export function setCurrentModelName(name) {
  document.getElementById('current-model-name').textContent = name;
  document.title = `${name} — Architeezy Graph`;
}

/** Wires model selector modal events. */
export function wireModelSelectorEvents() {
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
    if (e.key === 'Escape') {
      closeModelSelector();
      e.preventDefault();
      return;
    }

    const modelItems = [...modal.querySelectorAll('.model-item:not([disabled])')];

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      let targetIndex;
      if (document.activeElement === modal) {
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

// ── URL PARAM HELPERS ─────────────────────────────────────────────────────────

/**
 * Tries to load model from URL modelId parameter.
 *
 * @param {string} urlModelId - Model ID from URL query parameter.
 * @returns {Promise<string | undefined>} Content URL on success, undefined on failure.
 */
export async function tryLoadFromUrlParam(urlModelId) {
  try {
    const models = await fetchModelList();
    setCachedModels(models);
  } catch {
    return;
  }
  const urlModel = getCachedModels().find((m) => m.id === urlModelId);
  if (urlModel) {
    setCurrentModelName(urlModel.name);
    return modelContentUrl(urlModel);
  }
}

/**
 * Tries to get model URL from localStorage.
 *
 * @returns {string | undefined} Model content URL if present in storage, undefined otherwise.
 */
export function tryLoadFromLocalStorage() {
  const url = localStorage.getItem('architeezyGraphModelUrl');
  return url ?? undefined;
}

// ── LOAD ORCHESTRATION ─────────────────────────────────────────────────────────

/**
 * Handles loading when a target URL is resolved. Calls loadAndDisplayModel, then updates model name
 * or opens selector on failure.
 *
 * @param {string} targetUrl - The URL of the model to load.
 * @param {string} [targetModelId] - The model ID, if available.
 * @param {Function} [afterLoad] - Callback to run after the model is loaded.
 */
export async function handleTargetLoad(targetUrl, targetModelId, afterLoad) {
  setAuthErrorShown(false);
  await loadAndDisplayModel(targetUrl, targetModelId, afterLoad);

  // Check if graph was built (non-empty model)
  if (getAllElements().length > 0) {
    // Try to get model name from localStorage first (for persistence restoration)
    const persistedName = localStorage.getItem('architeezyGraphModelName');
    if (persistedName) {
      setCurrentModelName(persistedName);
    } else {
      const saved = getCachedModels().find((m) => modelContentUrl(m) === targetUrl);
      if (saved) {
        setCurrentModelName(saved.name);
      }
    }
  } else {
    if (!isAuthErrorShown()) {
      // For empty models, treat as a valid load if a specific model was requested via URL.
      // In that case, we keep the modal closed and just ensure graph container is hidden
      // (since graph won't be built). For a generic load with no modelId, show selector.
      if (targetModelId) {
        // Set model name if available from cache
        const saved = getCachedModels().find((m) => modelContentUrl(m) === targetUrl);
        if (saved) {
          setCurrentModelName(saved.name);
        }
        // Ensure graph container remains hidden (no graph to show)
        document.getElementById('cy').classList.add('hidden');
        // Ensure table-view is not hidden so user can switch to it
        document.getElementById('table-view')?.classList.remove('hidden');
        // Do NOT open the model selector; the empty model is considered loaded.
      } else {
        // No specific model requested → open selector to choose a model
        localStorage.removeItem('architeezyGraphModelUrl');
        document.getElementById('cy').classList.add('hidden');
        openModelSelector();
      }
    }
  }
}

/**
 * Handles the case when no target URL is available.
 *
 * @param {string} [urlModelId] - The model ID from URL, if any.
 */
export function handleNoTargetUrl(urlModelId) {
  document.dispatchEvent(new CustomEvent('loading:hide'));
  document.getElementById('cy').classList.add('hidden');
  if (urlModelId) {
    document.dispatchEvent(
      new CustomEvent('toast:show', { detail: { message: t('modelNotFound') } }),
    );
  }
  openModelSelector();
}

/** Initializes model selector module: wires DOM events, handles model:loadFailed. */
export function init() {
  wireModelSelectorEvents();
  document.addEventListener('model:loadFailed', () => {
    openModelSelector();
  });
  document.addEventListener('loadModel', (e) => {
    loadAndDisplayModel(e.detail.url, e.detail.modelId);
  });
}
