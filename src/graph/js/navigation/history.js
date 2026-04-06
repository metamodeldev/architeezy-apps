/**
 * Navigation state restoration and URL-based navigation.
 *
 * @module navigation/history
 * @package
 */

import {
  exitDrill,
  getDrillNodeId,
  onNodeDrill,
  setDrillDepth,
  setSkipLayoutSave,
} from '../drill-down/index.js';
import {
  applyUrlFilters,
  getActiveElemTypes,
  getActiveRelTypes,
} from '../filter/index.js';
import { getContainmentMode, hasGraphNode, isGraphLoaded, resizeCy } from '../graph/index.js';
import {
  getCachedModels,
  getCurrentModelId,
  getElementTypeCounts,
  getRelationshipTypeCounts,
  loadAndDisplayModel,
  modelContentUrl,
  setCurrentModelName,
} from '../model/index.js';
import { readUrlParams } from '../routing/index.js';
import { getCurrentView, switchView } from '../ui/index.js';

// ── AFTER-LOAD HANDLER ─────────────────────────────────────────────────────────

/**
 * Creates the afterLoad callback based on URL state parameters.
 *
 * @param {boolean} hasUrlState - Whether any URL state parameters are present.
 * @param {string | undefined} urlEntities - Comma-separated entity types from URL.
 * @param {string | undefined} urlRelationships - Comma-separated relationship types from URL.
 * @param {string | undefined} urlView - Desired view from URL ('table' or 'graph').
 * @param {string | undefined} urlEntityId - Entity ID for drill mode from URL.
 * @param {number | undefined} urlDepth - Drill depth from URL.
 * @returns {Function | undefined} Callback to run after model load, or undefined if no URL state.
 */
export function buildAfterLoadHandler(
  hasUrlState,
  urlEntities,
  urlRelationships,
  urlView,
  urlEntityId,
  urlDepth,
) {
  if (!hasUrlState) {
    return;
  }

  return () => {
    const allETypes = Object.keys(getElementTypeCounts());
    const allRTypes = Object.keys(getRelationshipTypeCounts());

    applyUrlFilters(
      urlEntities === undefined ? allETypes : urlEntities.split(',').filter(Boolean),
      urlRelationships === undefined ? allRTypes : urlRelationships.split(',').filter(Boolean),
    );

    if (urlView === 'table') {
      switchView('table');
    } else if (urlView === 'graph') {
      switchView('graph');
    }

    if (urlEntityId) {
      if (urlDepth !== undefined) {
        setDrillDepth(urlDepth);
      }
      if (hasGraphNode(urlEntityId)) {
        setSkipLayoutSave(true);
        const activeElemTypes = getActiveElemTypes();
        const activeRelTypes = getActiveRelTypes();
        const containmentMode = getContainmentMode();
        onNodeDrill(urlEntityId, {
          skipUrlSync: true,
          activeElemTypes,
          activeRelTypes,
          containmentMode,
        });
      }
    }
  };
}

// ── MODEL SWITCHING ───────────────────────────────────────────────────────────

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

// ── CURRENT MODEL STATE RESTORATION ───────────────────────────────────────────

/**
 * Restores application state on the currently loaded model (no model switch).
 *
 * @param {object} params - URL parameters.
 */
export function restoreCurrentModelState(params) {
  const allETypes = Object.keys(getElementTypeCounts());
  const allRTypes = Object.keys(getRelationshipTypeCounts());

  const hasUrlFilters = params.entities !== undefined || params.relationships !== undefined;
  if (hasUrlFilters) {
    applyUrlFilters(
      params.entities === undefined ? allETypes : params.entities.split(',').filter(Boolean),
      params.relationships === undefined
        ? allRTypes
        : params.relationships.split(',').filter(Boolean),
    );
  }

  const targetView = params.view || 'graph';
  if (targetView !== getCurrentView()) {
    if (targetView === 'table') {
      switchView('table');
    } else {
      switchView('graph');
      resizeCy();
    }
  }

  if (params.entityId) {
    if (params.depth !== undefined) {
      setDrillDepth(params.depth);
    }
    if (hasGraphNode(params.entityId)) {
      const activeElemTypes = getActiveElemTypes();
      const activeRelTypes = getActiveRelTypes();
      const containmentMode = getContainmentMode();
      onNodeDrill(params.entityId, {
        skipUrlSync: true,
        activeElemTypes,
        activeRelTypes,
        containmentMode,
      });
    }
  } else if (getDrillNodeId()) {
    exitDrill({ skipUrlSync: true });
  }
}

/** Restores application state from the current URL parameters. */
export async function restoreStateFromUrl() {
  if (!isGraphLoaded()) {
    return;
  }

  const params = readUrlParams();
  const currentModelId = getCurrentModelId();

  const switched = await trySwitchModel(params, currentModelId);
  if (switched) {
    return;
  }

  restoreCurrentModelState(params);
}

// ── LOAD CONTEXT PREPARATION ───────────────────────────────────────────────────

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
