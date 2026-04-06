/**
 * Model loader — startup and navigation-driven model loading.
 *
 * Owns: initial model resolution, model switching on popstate, trySwitchModel helper. Does NOT
 * restore filter / view / drill state — each module handles that via its own router.js.
 *
 * @module model/loader
 * @package
 */

import { hideLoading } from '../notification/index.js';
import { navParams, params } from '../router/index.js';
import { effect, untrack } from '../signals/index.js';
import { open as openModelSelector } from './selector.js';
import {
  fetchModelList,
  getId,
  getModelList,
  getStatus,
  load,
  modelContentUrl,
  setCurrentModelName,
  setModelList,
} from './service.js';

// ── BOOT HELPERS ──────────────────────────────────────────────────────────────

/**
 * Tries to resolve a content URL for the model ID given in the URL param. Fetches and caches the
 * model list as a side-effect.
 *
 * @param {string} urlModelId - Model ID from the URL.
 * @returns {Promise<string | undefined>} Content URL, or undefined if not found.
 */
async function loadFromUrlParam(urlModelId) {
  try {
    const models = await fetchModelList();
    setModelList(models);
  } catch {
    return;
  }
  const urlModel = getModelList().find((m) => m.id === urlModelId);
  if (urlModel) {
    setCurrentModelName(urlModel.name);
    return modelContentUrl(urlModel);
  }
}

/**
 * Returns a persisted model URL from localStorage, or undefined.
 *
 * @returns {string | undefined} The model URL or undefined if not found.
 */
function loadFromLocalStorage() {
  return localStorage.getItem('architeezyGraphModelUrl') ?? undefined;
}

/**
 * Resolves and loads the initial model at application startup. Priority: URL `model` param →
 * localStorage → open selector.
 */
export async function loadInitialModel() {
  const modelId = params.value.model;

  let targetUrl;
  if (modelId) {
    targetUrl = await loadFromUrlParam(modelId);
  }

  if (!targetUrl) {
    targetUrl = loadFromLocalStorage();
  }

  if (targetUrl) {
    try {
      await load(modelId, targetUrl);
      // Restore model name from localStorage when loading from persisted URL (no URL param)
      if (!modelId) {
        const savedName = localStorage.getItem('architeezyGraphModelName');
        if (savedName) {
          setCurrentModelName(savedName);
        }
      }
    } catch {
      // Loading failed (e.g., 404). Clear invalid reference and fall through to selector.
      hideLoading();
      openModelSelector();
    }
  } else {
    // No model to load: fetch model list to populate selector, then open selector.
    try {
      const models = await fetchModelList();
      setModelList(models);
    } catch {
      // Ignore fetch errors; selector will still open (possibly empty)
    }
    hideLoading();
    openModelSelector();
  }
}

// ── NAVIGATION HELPER ─────────────────────────────────────────────────────────

/**
 * Switches to a different model when the URL `model` param changes on popstate. Does NOT restore
 * filter / view / drill — those modules react to getStatus() === 'loaded'.
 *
 * @param {object} nav - Raw URL params from navParams.
 * @param {string | undefined} currentModelId - Model ID before navigation.
 * @returns {Promise<boolean>} True if a model switch was initiated.
 */
async function trySwitchModel(nav, currentModelId) {
  if (!nav.model || nav.model === currentModelId) {
    return false;
  }
  const models = getModelList();
  const targetModel = models.find((m) => m.id === nav.model);
  if (!targetModel) {
    return false;
  }
  const url = modelContentUrl(targetModel);
  if (!url) {
    return false;
  }
  await load(nav.model, url);
  if (getStatus() === 'loaded') {
    setCurrentModelName(targetModel.name);
  }
  return true;
}

// ── REACTIVE NAVIGATION ───────────────────────────────────────────────────────

// Switch model on back/forward navigation when the `model` URL param changes.
effect(() => {
  const nav = navParams.value;
  if (!nav) {
    return;
  } // Skip boot
  untrack(async () => {
    const prevId = getId();
    if (nav.model && nav.model !== prevId) {
      await trySwitchModel(nav, prevId);
      // Filter/view/drill react to getStatus() === 'loaded' in their own router.js files
    }
    // If model unchanged, filter/view/drill react to navParams directly in their router.js files
  });
});
