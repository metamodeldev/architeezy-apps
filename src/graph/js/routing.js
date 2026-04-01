// ── URL ROUTING ─────────────────────────────────────────────────────────────

import { getDrillDepth, getDrillNodeId } from './drill.js';
import { getActiveElemTypes, getActiveRelTypes } from './filters.js';
import { getAllElements, getAllRelations, getCurrentModelId } from './model.js';
import { getCurrentView } from './ui.js';

/**
 * Pure function: builds the URL query string from a state snapshot.
 *
 * Reflected params: - `model` — current model ID (omitted when falsy) - `entity` — drill-root node
 * ID (omitted outside drill mode) - `depth` — BFS depth (omitted outside drill mode) - `entities` —
 * comma-separated active element types (omitted when all are active) - `relationships` —
 * comma-separated active relationship types (omitted when all are active) - `view` — "table"
 * (omitted when graph view is active)
 *
 * @param {{
 *   currentModelId: string | undefined;
 *   drillNodeId: string | undefined;
 *   drillDepth: number;
 *   allElements: { type: string }[];
 *   allRelations: { type: string }[];
 *   activeElemTypes: Set<string>;
 *   activeRelTypes: Set<string>;
 *   currentView: string;
 * }} snapshot
 *   - Current application state snapshot.
 * @returns {string} Query string without the leading "?", or "" if all params
 * are omitted.
 */
export function buildStateQuery({
  currentModelId,
  drillNodeId,
  drillDepth,
  allElements,
  allRelations,
  activeElemTypes,
  activeRelTypes,
  currentView,
}) {
  const parts = [];

  if (currentModelId) {
    parts.push(`model=${encodeURIComponent(currentModelId)}`);
  }

  if (drillNodeId) {
    parts.push(`entity=${encodeURIComponent(drillNodeId)}`);
    parts.push(`depth=${drillDepth}`);
  }

  // Entities — active (visible) types; omitted when all types are visible
  const allETypes = [...new Set(allElements.map((e) => e.type))];
  const activeE = allETypes.filter((type) => activeElemTypes.has(type));
  if (activeE.length < allETypes.length) {
    parts.push(`entities=${activeE.map((e) => encodeURIComponent(e)).join(',')}`);
  }

  // Relationships — active (visible) types; omitted when all types are visible
  const allRTypes = [...new Set(allRelations.map((r) => r.type))];
  const activeR = allRTypes.filter((type) => activeRelTypes.has(type));
  if (activeR.length < allRTypes.length) {
    parts.push(`relationships=${activeR.map((r) => encodeURIComponent(r)).join(',')}`);
  }

  // View — omit when 'graph' (default), include for other views like 'table'
  if (currentView !== 'graph') {
    parts.push(`view=${currentView}`);
  }

  return parts.join('&');
}

/**
 * Reads and returns the recognised URL query parameters.
 *
 * @returns {{
 *   modelId: string | undefined;
 *   entityId: string | undefined;
 *   depth: number | undefined;
 *   entities: string | undefined;
 *   relationships: string | undefined;
 *   view: string | undefined;
 * }}
 *   The parsed URL parameters.
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

/**
 * Serialises the current application state into the URL query string and updates the address bar
 * via `history.replaceState` or `history.pushState` depending on options. Called whenever any
 * URL-reflected state changes.
 *
 * @param {{ push?: boolean }} [options] - Optional. Set `push: true` to use `pushState` instead of
 *   `replaceState`.
 */
export function syncUrl(options = {}) {
  const { push = false } = options;
  const q = buildStateQuery({
    currentModelId: getCurrentModelId(),
    drillNodeId: getDrillNodeId(),
    drillDepth: getDrillDepth(),
    allElements: getAllElements(),
    allRelations: getAllRelations(),
    activeElemTypes: getActiveElemTypes(),
    activeRelTypes: getActiveRelTypes(),
    currentView: getCurrentView(),
  });
  const url = location.pathname + (q ? '?' + q : '');
  if (push) {
    // oxlint-disable-next-line unicorn/no-null
    history.pushState(null, '', url);
  } else {
    // oxlint-disable-next-line unicorn/no-null
    history.replaceState(null, '', url);
  }
}
