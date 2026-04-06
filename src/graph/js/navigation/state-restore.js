/**
 * State restoration for navigation.
 *
 * Applies navigation state to the current model.
 *
 * @module navigation/state-restore
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
  getCurrentModelId,
  getElementTypeCounts,
  getRelationshipTypeCounts,
} from '../model/index.js';
// oxlint-disable-next-line import/no-cycle
import { trySwitchModel } from './model-switcher.js';
import { readUrlParams } from '../routing/index.js';
import { renderTable } from '../table/index.js';
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
    // View
    if (urlView === 'table') {
      switchView('table', renderTable);
    } else if (urlView === 'graph') {
      switchView('graph', renderTable);
    }
    // Drill
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

// ── CURRENT MODEL STATE RESTORATION ───────────────────────────────────────────

/**
 * Restores application state on the currently loaded model (no model switch).
 *
 * @param {object} params - URL parameters (as returned by readUrlParams).
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
    switchView(targetView, renderTable);
    if (targetView === 'graph') {
      resizeCy();
    }
  }

  if (params.entityId) {
    if (params.depth !== undefined) {
      setDrillDepth(params.depth);
    }
    if (hasGraphNode(params.entityId)) {
      onNodeDrill(params.entityId, { skipUrlSync: true });
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
