// ── URL ROUTING ─────────────────────────────────────────────────────────────
//
// Single source of truth: syncUrl() reads current state and updates the address
// bar via history.replaceState. Call it whenever any URL-reflected state changes.

import { state } from "./state.js";

export function syncUrl() {
  const parts = [];

  if (state.currentModelId) parts.push(`model=${encodeURIComponent(state.currentModelId)}`);

  if (state.drillNodeId) {
    parts.push(`entity=${encodeURIComponent(state.drillNodeId)}`);
    parts.push(`depth=${state.drillDepth}`);
  }

  // entities — active (visible) types; omitted when all types are visible
  const allETypes = [...new Set(state.allElements.map((e) => e.type))];
  const activeE = allETypes.filter((t) => state.activeElemTypes.has(t));
  if (activeE.length < allETypes.length) {
    parts.push(`entities=${activeE.map(encodeURIComponent).join(",")}`);
  }

  // relationships — active (visible) types; omitted when all types are visible
  const allRTypes = [...new Set(state.allRelations.map((r) => r.type))];
  const activeR = allRTypes.filter((t) => state.activeRelTypes.has(t));
  if (activeR.length < allRTypes.length) {
    parts.push(`relationships=${activeR.map(encodeURIComponent).join(",")}`);
  }

  // view — only when table is active
  if (state.currentView === "table") parts.push("view=table");

  const q = parts.join("&");
  history.replaceState(null, "", location.pathname + (q ? "?" + q : ""));
}

export function readUrlParams() {
  const sp = new URLSearchParams(location.search);
  return {
    modelId: sp.get("model"),
    entityId: sp.get("entity"),
    depth: sp.has("depth") ? Number(sp.get("depth")) : null,
    entities: sp.get("entities"),       // null = absent (all visible); comma-separated active types
    relationships: sp.get("relationships"),
    view: sp.get("view"),
  };
}
