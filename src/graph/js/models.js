// ── MODEL LIST ─────────────────────────────────────────────────────────────

import { apiFetch, BASE } from './auth.js';
import { t } from './i18n.js';
import { escHtml } from './utils.js';

const MODELS_API = `${BASE}/api/models?size=100`;

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
    return `${BASE}/api/models/${scopeSlug}/${projectSlug}/${projectVersion}/${slug}/content?format=json`;
  }
}

// Cached model list — owned here rather than in global state.
let _models = [];

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

/**
 * Sets the cached model list. Called once after a successful model-list fetch.
 *
 * @param {Array} models - List of model objects from the API.
 */
export function setCachedModels(models) {
  _models = models;
}

/**
 * Returns the cached model list.
 *
 * @returns {Array} Cached model objects.
 */
export function getCachedModels() {
  return _models;
}

/**
 * Opens the model-selector modal and focuses the search input. Fetches the model list on first open
 * (or after the cache is cleared); shows a loading placeholder until the list is ready.
 */
export async function openModelSelector() {
  document.getElementById('model-modal').classList.remove('hidden');
  document.getElementById('model-search').value = '';
  document.getElementById('model-search').focus();

  if (!_models.length) {
    document.getElementById('model-list').innerHTML =
      `<div class="model-list-loading">${t('modalLoading')}</div>`;
    try {
      _models = await fetchModelList();
    } catch (error) {
      document.getElementById('model-list').innerHTML =
        `<div class="empty-model-message">${escHtml(error.message)}</div>`;
      return;
    }
  }

  renderModelList(_models, '');
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
  renderModelList(_models, query);
}

/**
 * Updates the header model name label and the document title.
 *
 * @param {string} name - Display name of the loaded model.
 */
export function setCurrentModelName(name) {
  document.getElementById('current-model-name').textContent = name;
  document.title = `${name} — Architeezy Graph`;
  localStorage.setItem('architeezyGraphModelName', name);
}
