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
  fitGraph,
  setDrillRootNode,
} from './graph.js';
import { getElemMap } from './model.js';

// ── DRILL STATE ──────────────────────────────────────────────────────────────

/** @type {string | undefined} ID of the drill-root node; undefined when not in drill mode */
let _drillNodeId;

/** @type {number} BFS depth for drill-down (1–5) */
let _drillDepth = 2;

/** @type {Set<string> | undefined} node IDs visible in drill scope; undefined = full model shown */
let _drillVisibleIds;

export function getDrillNodeId() {
  return _drillNodeId;
}

export function getDrillDepth() {
  return _drillDepth;
}

export function getDrillVisibleIds() {
  return _drillVisibleIds;
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

/** Resets drillNodeId and drillVisibleIds to undefined. Call on model load or exitDrill. */
export function clearDrillState() {
  _drillNodeId = undefined;
  _drillVisibleIds = undefined;
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
    applyLayout();
    document.dispatchEvent(new CustomEvent('graph:syncUrl'));
  });
}

/**
 * Enters drill-down mode centred on the node with `nodeId`. Shows the drill bar, builds the depth
 * picker, applies the BFS visibility, re-runs the layout, and opens the detail panel for the drill
 * root.
 *
 * @param {string} nodeId - ID of the node to drill into.
 */
export function onNodeDrill(nodeId) {
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
  document.dispatchEvent(new CustomEvent('graph:syncUrl'));
}

/**
 * Exits drill-down mode and restores the full-model view. Hides the drill bar, clears drill state,
 * reapplies full visibility, fits the graph, and re-renders the table if it is active.
 */
export function exitDrill() {
  clearDrillRootNodes();
  clearDrillState();
  document.getElementById('crumb-entity-sep').classList.add('hidden');
  document.getElementById('drill-label').classList.add('hidden');
  document.getElementById('settings-depth-row').classList.add('hidden');
  document.dispatchEvent(new CustomEvent('graph:applyVisibility'));
  fitGraph();
  document.dispatchEvent(new CustomEvent('graph:syncUrl'));
}
