/**
 * Fetches and loads model data from the API.
 *
 * @module model/loader
 * @package
 */

import { apiFetch } from '../api.js';
import { t } from '../i18n.js';
import { initColorMaps } from '../palette.js';
import { getAllElements, getAllRelations, loadModelData, setCurrentModel } from './state.js';

/**
 * Fetches raw model JSON from `url`, parses it, and stores the result.
 *
 * @param {string} url - Content URL of the model.
 * @returns {Promise<string>} Resolves with the model namespace URI.
 * @throws {Error} On HTTP errors or network failures.
 */
export async function fetchModel(url) {
  const r = await apiFetch(url);
  if (!r.ok) {
    throw new Error(`HTTP ${r.status} — ${r.statusText}`);
  }
  const data = await r.json();
  return loadModelData(data);
}

/**
 * Fetches and loads a model from `url`, dispatching semantic events on completion.
 *
 * On success: dispatches `model:loaded`, then calls `afterLoad` callback, then `graph:syncUrl`. On
 * empty: dispatches `model:empty`. On error: dispatches `model:loadFailed` (and shows toast for
 * auth errors).
 *
 * @param {string} url - Content URL of the model to load.
 * @param {string | undefined} [modelId] - Optional model ID for URL routing.
 * @param {Function | undefined} [afterLoad] - Callback invoked after successful load.
 */
export async function loadAndDisplayModel(url, modelId, afterLoad) {
  await Promise.resolve();
  document.dispatchEvent(
    new CustomEvent('loading:show', { detail: { message: t('loadingModel') } }),
  );
  try {
    const ns = await fetchModel(url);
    const elements = getAllElements();

    if (elements.length === 0) {
      setCurrentModel(modelId, ns);
      document.dispatchEvent(new CustomEvent('model:empty', { detail: { url, modelId, ns } }));
      return;
    }

    initColorMaps(elements, getAllRelations());
    localStorage.setItem('architeezyGraphModelUrl', url);
    setCurrentModel(modelId, ns);

    document.dispatchEvent(new CustomEvent('model:contentLoaded', { detail: { url, modelId, ns } }));
    await afterLoad?.();
    document.dispatchEvent(new CustomEvent('routing:sync'));
  } catch (error) {
    handleLoadError(error);
  } finally {
    document.dispatchEvent(new CustomEvent('loading:hide'));
  }
}

function handleLoadError(error) {
  document.dispatchEvent(new CustomEvent('toast:show', { detail: { message: error.message } }));
  if (error.message === t('authRequired')) {
    document.dispatchEvent(new CustomEvent('auth:errorShown'));
  } else {
    localStorage.removeItem('architeezyGraphModelUrl');
    document.getElementById('cy').classList.add('hidden');
    document.dispatchEvent(new CustomEvent('model:loadFailed', { detail: { error } }));
  }
}
