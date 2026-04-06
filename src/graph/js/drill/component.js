/**
 * DrillPanelComponent — UI handling for drill-down mode.
 *
 * @module drill/component
 */

import { getElemMap } from '../model/index.js';
import { effect } from '../signals/index.js';
import {
  changeDepth,
  drillDepth,
  drillNodeId,
  exitDrill,
  initializeDrillService,
} from './service.js';

// ============ UI RENDERING ============

/**
 * Rebuilds depth picker buttons (1-5).
 *
 * @param {number} depth - Current drill depth value.
 */
export function buildDepthPicker(depth) {
  const picker = document.getElementById('depth-picker');
  if (!picker) {
    return;
  }
  picker.innerHTML = '';
  for (const d of [1, 2, 3, 4, 5]) {
    const btn = document.createElement('button');
    btn.className = `depth-btn${d === depth ? ' active' : ''}`;
    btn.textContent = d;
    btn.dataset.depth = String(d);
    picker.append(btn);
  }
}

/** Updates active state for navigation breadcrumbs. */
export function updateNavActiveState() {
  const modelBtn = document.getElementById('drill-exit-btn');
  const drillLabel = document.getElementById('drill-label');
  if (!modelBtn || !drillLabel) {
    return;
  }

  const isDrilling = drillNodeId.value !== undefined;

  if (isDrilling) {
    modelBtn.classList.remove('active');
    drillLabel.classList.add('active');
  } else {
    drillLabel.classList.remove('active');
    modelBtn.classList.add('active');
  }
}

// ============ DOM EVENTS ============

/** Wires depth picker clicks and exit button. */
function wireDomEvents() {
  const depthPicker = document.getElementById('depth-picker');
  if (depthPicker) {
    depthPicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.depth-btn[data-depth]');
      if (!btn) {
        return;
      }
      const newDepth = Number(btn.dataset.depth);
      changeDepth(newDepth);
    });
  }

  const exitBtn = document.getElementById('drill-exit-btn');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => exitDrill());
  }
}

// ============ REACTIVE EFFECTS ============

/** Sets up effect that updates drill UI (depth picker, breadcrumb labels) when state changes. */
function setupUiEffect() {
  effect(() => {
    const nodeId = drillNodeId.value;
    const depth = drillDepth.value;

    buildDepthPicker(depth);

    const crumbSep = document.getElementById('crumb-entity-sep');
    const drillLabel = document.getElementById('drill-label');

    if (crumbSep) {
      crumbSep.classList.toggle('hidden', nodeId === undefined);
    }
    if (drillLabel) {
      drillLabel.classList.toggle('hidden', nodeId === undefined);
      if (nodeId) {
        const elem = getElemMap().get(nodeId);
        drillLabel.textContent = elem?.name ?? nodeId;
      }
    }

    updateNavActiveState();
  });
}

// ============ INITIALIZATION ============

/**
 * Initializes drill-down component.
 *
 * @param {any} _cy - Cytoscape instance (unused, for compatibility).
 */
export function initDrillComponent(_cy) {
  wireDomEvents();
  buildDepthPicker(drillDepth.value);
  setupUiEffect();
  updateNavActiveState();
}

/**
 * Initializes the drill module: service reactive effects and UI component.
 *
 * @param {any} [cy] - Cytoscape instance (passed through to component for compatibility).
 */
export function init(cy) {
  initializeDrillService();
  initDrillComponent(cy);
}
