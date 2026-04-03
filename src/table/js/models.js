// ── MODEL LIST ─────────────────────────────────────────────────────────────

import { apiFetch } from './auth.js';
import { MODELS_API } from './constants.js';
import { t } from './i18n.js';
import { state } from './state.js';
import { escHtml, modelContentUrl, modelTypeLabel } from './utils.js';

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

export function openModelSelector() {
  document.getElementById('model-modal').classList.remove('hidden');
  document.getElementById('model-search').value = '';
  renderModelList(state.cachedModels, '');
  document.getElementById('model-search').focus();
}

export function closeModelSelector() {
  document.getElementById('model-modal').classList.add('hidden');
}

export function renderModelList(models, query) {
  const q = query.toLowerCase();
  const container = document.getElementById('model-list');
  const currentUrl = localStorage.getItem('architeezyTableModelUrl');
  container.innerHTML = '';

  for (const model of models) {
    const typeLabel = modelTypeLabel(model.contentType);
    const url = modelContentUrl(model);
    if (
      q &&
      !model.name.toLowerCase().includes(q) &&
      !typeLabel.toLowerCase().includes(q) &&
      !(model.description ?? '').toLowerCase().includes(q)
    ) {
      continue;
    }

    const item = document.createElement('div');
    item.className = `model-item${url === currentUrl ? ' active' : ''}`;
    item.innerHTML = `
      <div class="model-item-icon">⊞</div>
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
        document.dispatchEvent(
          new CustomEvent('loadModel', {
            detail: {
              url,
              modelId: model.id ?? undefined,
              contentType: model.contentType ?? '',
            },
          }),
        );
      });
    } else {
      item.style.opacity = '0.4';
      item.style.cursor = 'not-allowed';
    }
    container.append(item);
  }

  if (!container.children.length) {
    container.innerHTML = `<div class="model-list-loading">${t('noResults')}</div>`;
  }
}

export function filterModelList(query) {
  renderModelList(state.cachedModels, query);
}

export function setCurrentModelName(name) {
  document.getElementById('current-model-name').textContent = name;
  document.title = `${name} — Architeezy Table`;
}
