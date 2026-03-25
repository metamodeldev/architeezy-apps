// ── MODEL LIST ─────────────────────────────────────────────────────────────

import { state } from './state.js';
import { apiFetch } from './auth.js';
import { t } from './i18n.js';
import { escHtml, modelTypeLabel, modelContentUrl } from './utils.js';
import { MODELS_API } from './constants.js';

/**
 * Fetches the full paginated model list from the API. Follows `_links.next` until all pages are consumed.
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

/** Opens the model-selector modal and focuses the search input. */
export function openModelSelector() {
  document.getElementById('model-modal').classList.remove('hidden');
  document.getElementById('model-search').value = '';
  renderModelList(state.cachedModels, '');
  document.getElementById('model-search').focus();
}

/** Closes the model-selector modal. */
export function closeModelSelector() {
  document.getElementById('model-modal').classList.add('hidden');
}

/**
 * Renders the model list inside the modal, filtered by `query`. Items without a resolvable content URL are shown as
 * disabled.
 *
 * @param {Array} models - List of model objects from the API.
 * @param {string} query - Filter string (matched against name, type label, and description).
 */
export function renderModelList(models, query) {
  const q = query.toLowerCase();
  const container = document.getElementById('model-list');
  const currentUrl = localStorage.getItem('architeezyLensModelUrl');
  container.innerHTML = '';

  models.forEach((model) => {
    const typeLabel = modelTypeLabel(model.contentType);
    const url = modelContentUrl(model);
    if (
      q &&
      !model.name.toLowerCase().includes(q) &&
      !typeLabel.toLowerCase().includes(q) &&
      !(model.description ?? '').toLowerCase().includes(q)
    ) {
      return;
    }

    const item = document.createElement('div');
    item.className = `model-item${url === currentUrl ? ' active' : ''}`;
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
        // loadModel is in app.js; use a custom event to avoid circular dependency
        document.dispatchEvent(
          new CustomEvent('loadModel', {
            detail: { url, modelId: model.id ?? undefined },
          }),
        );
      });
    } else {
      item.style.opacity = '0.4';
      item.style.cursor = 'not-allowed';
    }
    container.appendChild(item);
  });

  if (!container.children.length) {
    container.innerHTML = `<div class="model-list-loading">${t('noResults')}</div>`;
  }
}

/**
 * Re-renders the model list using the cached model array, filtered by `query`. Bound to the search input's `oninput`
 * event.
 *
 * @param {string} query - Search string typed by the user.
 */
export function filterModelList(query) {
  renderModelList(state.cachedModels, query);
}

/**
 * Updates the header model name label and the document title.
 *
 * @param {string} name - Display name of the loaded model.
 */
export function setCurrentModelName(name) {
  document.getElementById('current-model-name').textContent = name;
  document.title = `${name} — Architeezy Lens`;
}
