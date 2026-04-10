/**
 * DrillService — Reactive state and business logic for drill-down mode.
 *
 * @module drill/service
 */

import { elementTypeCounts, getElemMap } from '../model/index.js';
import { pushState } from '../router/index.js';
import { signal, effect } from '../signals/index.js';

// ── PRIVATE SIGNALS ─────────────────────────────────────────────────────────────

const _drillNodeId = signal();
const _drillDepth = signal(2);

// ── SKIP-LAYOUT-SAVE FLAG ────────────────────────────────────────────────────

let _skipNextLayoutSave = false;

// ── SKIP-URL-SYNC FLAG ───────────────────────────────────────────────────────

/**
 * Set to true before signal mutations triggered by URL restoration (popstate) so that
 * subscribeDrillToUrl does not push a new history entry and destroy forward history.
 */
let _restoringFromUrl = false;

/**
 * Consumes the skip-layout-save flag. Returns true once (on URL-restore entry) then resets to
 * false.
 *
 * @returns {boolean} True if layout save should be skipped for the next drill enter.
 */
export function consumeSkipLayoutSave() {
  const val = _skipNextLayoutSave;
  _skipNextLayoutSave = false;
  return val;
}

// ── PUBLIC SIGNALS ───────────────────────────────────────────────────────────────

export const drillNodeId = _drillNodeId.asReadonly();
export const [drillDepth, setDrillDepth] = _drillDepth.asPair();

// ── ACTIONS ─────────────────────────────────────────────────────────────────────

/** Clears all drill-related state. */
export function clearDrillState() {
  _drillNodeId.value = undefined;
}

let _initialized = false;

/** Initializes the service. */
export function initializeDrillService() {
  if (_initialized) {
    disposeDrillService();
  }
  _initialized = true;
}

/** Disposes the DrillService. */
export function disposeDrillService() {
  _initialized = false;
}

// ── PUBLIC ACTIONS (entry points) ───────────────────────────────────────────────

/**
 * Enters drill mode on the specified node.
 *
 * @param {string} nodeId - Identifier of the node to drill into.
 */
export function onNodeDrill(nodeId) {
  _drillNodeId.value = nodeId;
}

/** Exits drill mode. */
export function exitDrill() {
  clearDrillState();
}

/**
 * Changes drill depth.
 *
 * @param {number} newDepth - New depth value (1-5).
 */
export function changeDepth(newDepth) {
  _drillDepth.value = newDepth;
}

// ── URL RESTORE ───────────────────────────────────────────────────────────────

/**
 * Applies drill state from URL parameters.
 *
 * @param {string | undefined} entityId - Node ID to drill into, or undefined/empty to exit drill.
 * @param {number | undefined} depth - Drill depth.
 */
export function restoreFromUrl(entityId, depth) {
  if (!entityId) {
    if (_drillNodeId.value) {
      _restoringFromUrl = true;
      clearDrillState();
    }
    return;
  }
  if (depth !== undefined) {
    _drillDepth.value = depth;
  }
  if (getElemMap().has(entityId)) {
    _restoringFromUrl = true;
    _skipNextLayoutSave = true;
    onNodeDrill(entityId);
  }
}

// ── URL SYNC ──────────────────────────────────────────────────────────────────

/** Registers a reactive effect that pushes drill state (entity + depth) to browser history. */
export function subscribeDrillToUrl() {
  let prevDrillNodeId = _drillNodeId.value;
  effect(() => {
    if (Object.keys(elementTypeCounts.value).length === 0) {
      return;
    }
    const nodeId = _drillNodeId.value;
    const depth = _drillDepth.value;
    if (_restoringFromUrl) {
      _restoringFromUrl = false;
      prevDrillNodeId = nodeId;
      return;
    }
    if (nodeId !== undefined) {
      if (!getElemMap().has(nodeId)) {
        // Node no longer exists (model switched); discard stale drill state silently.
        prevDrillNodeId = undefined;
        return;
      }
      pushState({ entity: nodeId, depth });
    } else if (prevDrillNodeId !== undefined) {
      pushState({ entity: undefined, depth: undefined });
    }
    prevDrillNodeId = nodeId;
  });
}
