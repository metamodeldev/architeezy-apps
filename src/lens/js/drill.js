// ── DRILL-DOWN ─────────────────────────────────────────────────────────────

import { state } from './state.js';
import { applyLayout, fitGraph } from './graph.js';
import { applyDrill, applyVisibility } from './visibility.js';
import { showDetail } from './detail.js';
import { renderTable } from './table.js';
import { syncUrl } from './routing.js';

/** Re-applies the .drill-root class after buildCytoscape() recreates the instance. */
export function restoreDrillRootStyle() {
  if (state.drillNodeId) {
    state.cy?.$id(state.drillNodeId).addClass('drill-root');
  }
}

/**
 * Rebuilds the depth picker buttons (1–5) inside `#depth-picker`, marking the currently active depth with the "active"
 * class. Each button updates `state.drillDepth`, redrills, reflows the layout, and syncs the URL.
 */
export function buildDepthPicker() {
  const picker = document.getElementById('depth-picker');
  picker.innerHTML = '';
  [1, 2, 3, 4, 5].forEach((d) => {
    const btn = document.createElement('button');
    btn.className = 'depth-btn' + (d === state.drillDepth ? ' active' : '');
    btn.textContent = d;
    btn.addEventListener('click', () => {
      state.drillDepth = d;
      buildDepthPicker();
      applyDrill();
      applyLayout();
      syncUrl();
    });
    picker.appendChild(btn);
  });
}

/**
 * Enters drill-down mode centred on `node`. Shows the drill bar, builds the depth picker, applies the BFS visibility,
 * re-runs the layout, and opens the detail panel for the drill root.
 *
 * @param {cytoscape.NodeSingular} node - The Cytoscape node to drill into.
 */
export function onNodeDrill(node) {
  state.drillNodeId = node.id();

  document.getElementById('drill-bar').classList.add('visible');
  document.getElementById('drill-label').textContent = node.data('label');
  buildDepthPicker();
  applyDrill();

  // Update class after applyDrill's cy.batch() completes so it isn't overridden.
  state.cy.nodes().removeClass('drill-root');
  state.cy.$id(state.drillNodeId).addClass('drill-root');

  applyLayout();
  showDetail(state.drillNodeId, (targetNode) => onNodeDrill(targetNode));
  syncUrl();
}

/**
 * Exits drill-down mode and restores the full-model view. Hides the drill bar, clears drill state, reapplies full
 * visibility, fits the graph, and re-renders the table if it is active.
 */
export function exitDrill() {
  state.cy?.nodes().removeClass('drill-root');
  state.drillNodeId = undefined;
  state.drillVisibleIds = undefined;
  document.getElementById('drill-bar').classList.remove('visible');
  applyVisibility();
  fitGraph();
  if (state.currentView === 'table') {
    renderTable();
  }
  syncUrl();
}
