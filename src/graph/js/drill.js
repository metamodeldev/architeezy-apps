// ── DRILL-DOWN ─────────────────────────────────────────────────────────────
//
// Owns drill-down state (drillNodeId, drillDepth, drillVisibleIds) and all
// UI logic for entering/exiting drill mode.
//
// Visibility.js imports drill state getters from this module (one-way).
// To trigger visibility updates without a reverse import, this module
// Dispatches 'graph:applyDrill' / 'graph:applyVisibility' on document;
// App.js wires the handlers.

import { showDetail } from './detail.js';
import {
  addDrillRootClass,
  applyLayout,
  clearDrillRootNodes,
  restoreLayoutState,
  saveLayoutState,
  setDrillRootNode,
  stopLayout,
} from './graph.js';
import { getElemMap } from './model.js';

// ── DRILL STATE ──────────────────────────────────────────────────────────────

/**
 * When true, the next call to onNodeDrill will skip saving layout state. Used for drill-down
 * entered via URL (deep link) where there is no previous state.
 *
 * @type {boolean}
 */
let _skipLayoutSave = false;

/**
 * Sets the skip flag to control whether layout state is saved on the next drill entry.
 *
 * @param {boolean} flag - True to skip saving layout state.
 */
export function setSkipLayoutSave(flag) {
  _skipLayoutSave = flag;
}

/** @type {string | undefined} ID of the drill-root node; undefined when not in drill mode */
let _drillNodeId;

/** @type {number} BFS depth for drill-down (1–5) */
let _drillDepth = 2;

/**
 * @type {number | undefined} Depth saved before entering drill; restored on exit so highlight is
 *   unaffected
 */
let _savedDepthBeforeDrill;

/** @type {Set<string> | undefined} node IDs visible in drill scope; undefined = full model shown */
let _drillVisibleIds;

/**
 * @type {Set<string> | undefined} node IDs within drill spatial scope (ignoring entity filters);
 *   undefined = full model
 */
let _drillScopeIds;

export function getDrillNodeId() {
  return _drillNodeId;
}

export function getDrillDepth() {
  return _drillDepth;
}

export function getDrillVisibleIds() {
  return _drillVisibleIds;
}

export function getDrillScopeIds() {
  return _drillScopeIds;
}

/** @param {string | undefined} id ID of the drill-root node, or undefined to exit drill mode */
export function setDrillNodeId(id) {
  _drillNodeId = id;
}

/** @param {number} d BFS depth for drill-down (1–5) */
export function setDrillDepth(d) {
  _drillDepth = d;
}

/** @param {Set<string> | undefined} ids Node IDs visible in drill scope, or undefined for full model */
export function setDrillVisibleIds(ids) {
  _drillVisibleIds = ids;
}

/**
 * @param {Set<string> | undefined} ids Node IDs within drill spatial scope (ignoring entity
 *   filters)
 */
export function setDrillScopeIds(ids) {
  _drillScopeIds = ids;
}

/**
 * Resets drillNodeId, drillVisibleIds, and drillScopeIds to undefined. Call on model load or
 * exitDrill.
 */
export function clearDrillState() {
  _drillNodeId = undefined;
  _drillVisibleIds = undefined;
  _drillScopeIds = undefined;
}

// ── DRILL UI ─────────────────────────────────────────────────────────────────

/** Re-applies the .drill-root class after buildCytoscape() recreates the instance. */
export function restoreDrillRootStyle() {
  const id = getDrillNodeId();
  if (id) {
    addDrillRootClass(id);
  }
}

/**
 * Rebuilds the depth picker buttons (1–5) inside `#depth-picker`, marking the currently active
 * depth with the "active" class. Click handling is delegated — see `initDrillEvents`.
 *
 * @param {number} drillDepth - Currently active drill depth.
 */
export function buildDepthPicker(drillDepth) {
  const picker = document.getElementById('depth-picker');
  picker.innerHTML = '';
  for (const d of [1, 2, 3, 4, 5]) {
    const btn = document.createElement('button');
    btn.className = `depth-btn${d === drillDepth ? ' active' : ''}`;
    btn.textContent = d;
    btn.dataset.depth = String(d);
    picker.append(btn);
  }
}

/** Wires a delegated click listener on `#depth-picker`. Called once at app startup. */
export function initDrillEvents() {
  document.getElementById('depth-picker').addEventListener('click', (e) => {
    const btn = e.target.closest('.depth-btn[data-depth]');
    if (!btn) {
      return;
    }
    setDrillDepth(Number(btn.dataset.depth));
    buildDepthPicker(getDrillDepth());
    document.dispatchEvent(new CustomEvent('graph:applyDrill'));
    document.dispatchEvent(new CustomEvent('graph:applyVisibility'));
    // Only re-layout when in drill-down mode; highlight mode does not require relayout
    if (getDrillNodeId()) {
      applyLayout();
    }
    document.dispatchEvent(new CustomEvent('graph:syncUrl'));
  });
}

/**
 * Enters drill-down mode centred on the node with `nodeId`. Shows the drill bar, builds the depth
 * picker, applies the BFS visibility, re-runs the layout, and opens the detail panel for the drill
 * root.
 *
 * @param {string} nodeId - ID of the node to drill into.
 * @param {{ skipUrlSync?: boolean }} [options] - Optional. Set `skipUrlSync: true` to prevent
 *   pushing a new URL state (used during history navigation restoration).
 */
export function onNodeDrill(nodeId, options = {}) {
  // Save current layout state before entering drill mode (only if not already in drill and not skipping)
  if (!_drillNodeId && !_skipLayoutSave) {
    saveLayoutState();
  }
  // Reset skip flag for future entries
  _skipLayoutSave = false;

  // Save current depth so highlight depth is unaffected by depth changes during drill
  _savedDepthBeforeDrill = _drillDepth;
  setDrillNodeId(nodeId);

  document.getElementById('crumb-entity-sep').classList.remove('hidden');
  document.getElementById('drill-label').classList.remove('hidden');
  document.getElementById('drill-label').textContent = getElemMap()[nodeId]?.name ?? nodeId;
  document.getElementById('settings-depth-row').classList.remove('hidden');
  buildDepthPicker(getDrillDepth());
  document.dispatchEvent(new CustomEvent('graph:applyDrill'));

  // Update class after applyDrill's cy.batch() completes so it isn't overridden.
  setDrillRootNode(nodeId);

  applyLayout();
  showDetail(nodeId, (targetId) => onNodeDrill(targetId));
  if (!options.skipUrlSync) {
    document.dispatchEvent(new CustomEvent('graph:syncUrl', { detail: { push: true } }));
  }
}

/**
 * Exits drill-down mode and restores the full-model view. Hides the drill bar, clears drill state,
 * reapplies full visibility, restores the previous layout state if available, or applies a fresh
 * layout if no state was saved (e.g., deep link).
 *
 * @param {{ skipUrlSync?: boolean }} [options] - Optional. Set `skipUrlSync: true` to prevent
 *   updating the URL (used during history navigation restoration).
 */
export function exitDrill(options = {}) {
  // Restore the depth that was active before drill mode so highlight uses the pre-drill depth
  if (_savedDepthBeforeDrill !== undefined) {
    _drillDepth = _savedDepthBeforeDrill;
    _savedDepthBeforeDrill = undefined;
    buildDepthPicker(_drillDepth);
  }
  clearDrillRootNodes();
  clearDrillState();
  document.getElementById('crumb-entity-sep').classList.add('hidden');
  document.getElementById('drill-label').classList.add('hidden');
  document.dispatchEvent(new CustomEvent('graph:applyVisibility'));
  stopLayout();
  // Try to restore the saved layout state; if none, apply a fresh layout
  const restored = restoreLayoutState();
  // Expose for debugging/tests
  globalThis.__lastRestoreSuccess = restored;
  if (!restored) {
    applyLayout();
  }
  if (!options.skipUrlSync) {
    document.dispatchEvent(new CustomEvent('graph:syncUrl'));
  }
}
