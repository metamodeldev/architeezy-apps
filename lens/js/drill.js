// ── DRILL-DOWN ─────────────────────────────────────────────────────────────

import { state } from "./state.js";
import { applyLayout, fitGraph } from "./graph.js";
import { applyDrill, applyVisibility } from "./filters.js";
import { showDetail } from "./detail.js";
import { renderTable } from "./table.js";
import { syncUrl } from "./routing.js";

// Mark the current drill-root node with isDrillRoot data so Cytoscape applies
// the green-border style. Call after buildCytoscape() to restore the marker.
export function restoreDrillRootStyle() {
  if (state.drillNodeId) state.cy?.$id(state.drillNodeId).addClass("drill-root");
}

export function buildDepthPicker() {
  const picker = document.getElementById("depth-picker");
  picker.innerHTML = "";
  [1, 2, 3, 4, 5].forEach((d) => {
    const btn = document.createElement("button");
    btn.className = "depth-btn" + (d === state.drillDepth ? " active" : "");
    btn.textContent = d;
    btn.addEventListener("click", () => {
      state.drillDepth = d;
      buildDepthPicker();
      applyDrill();
      applyLayout();
      syncUrl();
    });
    picker.appendChild(btn);
  });
}

export function onNodeDrill(node) {
  state.drillNodeId = node.id();

  document.getElementById("drill-bar").classList.add("visible");
  document.getElementById("drill-label").textContent = node.data("label");
  buildDepthPicker();
  applyDrill();

  // Update class after applyDrill's cy.batch() completes so it isn't overridden
  state.cy.nodes().removeClass("drill-root");
  state.cy.$id(state.drillNodeId).addClass("drill-root");

  applyLayout();
  showDetail(state.drillNodeId, (targetNode) => onNodeDrill(targetNode));
  syncUrl();
}

export function exitDrill() {
  state.cy?.nodes().removeClass("drill-root");
  state.drillNodeId = null;
  state.drillVisibleIds = null;
  document.getElementById("drill-bar").classList.remove("visible");
  applyVisibility();
  fitGraph();
  if (state.currentView === "table") renderTable();
  syncUrl();
}
