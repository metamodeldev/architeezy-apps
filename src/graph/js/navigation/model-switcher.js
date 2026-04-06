/**
 * Model lifecycle management.
 *
 * Handles switching between models and preparing load context.
 *
 * @module navigation/model-switcher
 */

import {
  getCachedModels,
  loadAndDisplayModel,
  modelContentUrl,
  setCurrentModelName,
} from '../model/index.js';
// oxlint-disable-next-line import/no-cycle
import { buildAfterLoadHandler } from './state-restore.js';
import { readUrlParams } from '../routing/index.js';
import { isGraphLoaded } from '../graph/index.js';

/**
 * Prepares the URL parameters and the after-load handler.
 *
 * @returns {Object} Contains urlModelId, afterLoad.
 */
export function prepareLoadContext() {
  const {
    modelId: urlModelId,
    entityId: urlEntityId,
    depth: urlDepth,
    entities: urlEntities,
    relationships: urlRelationships,
    view: urlView,
  } = readUrlParams();

  const hasUrlState =
    urlEntities !== undefined || urlRelationships !== undefined || urlEntityId || urlView;
  const afterLoad = buildAfterLoadHandler(
    hasUrlState,
    urlEntities,
    urlRelationships,
    urlView,
    urlEntityId,
    urlDepth,
  );

  return { urlModelId, afterLoad };
}

/**
 * Helper: attempts to switch to a different model based on URL params.
 *
 * @param {object} params - URL parameters.
 * @param {string} currentModelId - Current model ID.
 * @returns {Promise<boolean>} True if model switch was initiated.
 */
export async function trySwitchModel(params, currentModelId) {
  if (!params.modelId || params.modelId === currentModelId) {
    return false;
  }

  const models = getCachedModels();
  const targetModel = models.find((m) => m.id === params.modelId);
  if (!targetModel) {
    return false;
  }

  const url = modelContentUrl(targetModel);
  if (!url) {
    return false;
  }

  const hasUrlState =
    params.entities !== undefined ||
    params.relationships !== undefined ||
    params.entityId ||
    params.view;

  const afterLoad = buildAfterLoadHandler(
    hasUrlState,
    params.entities,
    params.relationships,
    params.view,
    params.entityId,
    params.depth,
  );

  await loadAndDisplayModel(url, params.modelId, afterLoad);
  if (isGraphLoaded()) {
    setCurrentModelName(targetModel.name);
  }
  return true;
}
