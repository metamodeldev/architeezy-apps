// ── URL ROUTING ─────────────────────────────────────────────────────────────
//
// Single source of truth: syncUrl() reads current state and updates the address
// bar via history.replaceState. Call it whenever any URL-reflected state changes.

import { state } from './state.js';

/**
 * Serialises the current application state into the URL query string and
 * pushes it with `history.replaceState` (no new history entry).
 *
 * Reflected params:
 * - `model`         — current model ID (omitted when no model is loaded)
 * - `entity`        — drill-root node ID (omitted outside drill mode)
 * - `depth`         — BFS depth (omitted outside drill mode)
 * - `entities`      — comma-separated active element types (omitted when all are active)
 * - `relationships` — comma-separated active relationship types (omitted when all are active)
 * - `view`          — "table" (omitted when graph view is active)
 */
export function syncUrl() {
  const parts = [];

  if (state.currentModelId) {
    parts.push(`model=${encodeURIComponent(state.currentModelId)}`);
  }

  if (state.drillNodeId) {
    parts.push(`entity=${encodeURIComponent(state.drillNodeId)}`);
    parts.push(`depth=${state.drillDepth}`);
  }

  // entities — active (visible) types; omitted when all types are visible
  const allETypes = [...new Set(state.allElements.map((e) => e.type))];
  const activeE = allETypes.filter((type) => state.activeElemTypes.has(type));
  if (activeE.length < allETypes.length) {
    parts.push(`entities=${activeE.map(encodeURIComponent).join(',')}`);
  }

  // relationships — active (visible) types; omitted when all types are visible
  const allRTypes = [...new Set(state.allRelations.map((r) => r.type))];
  const activeR = allRTypes.filter((type) => state.activeRelTypes.has(type));
  if (activeR.length < allRTypes.length) {
    parts.push(`relationships=${activeR.map(encodeURIComponent).join(',')}`);
  }

  // view — only when table is active
  if (state.currentView === 'table') {
    parts.push('view=table');
  }

  const q = parts.join('&');
  // eslint-disable-next-line unicorn/no-null
  history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
}

/**
 * Reads and returns the recognised URL query parameters.
 *
 * @returns {{
 *   modelId: string|undefined,
 *   entityId: string|undefined,
 *   depth: number|undefined,
 *   entities: string|undefined,
 *   relationships: string|undefined,
 *   view: string|undefined
 * }}
 */
export function readUrlParams() {
  const sp = new URLSearchParams(location.search);
  return {
    modelId: sp.get('model'),
    entityId: sp.get('entity'),
    depth: sp.has('depth') ? Number(sp.get('depth')) : undefined,
    entities: sp.get('entities') ?? undefined,
    relationships: sp.get('relationships') ?? undefined,
    view: sp.get('view'),
  };
}
