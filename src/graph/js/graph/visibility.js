/**
 * Pure visibility computation functions. No signals, no side effects — only deterministic
 * transformations.
 *
 * @module graph/visibility
 */

// ── BFS HELPERS ───────────────────────────────────────────────────────────────

/**
 * Builds an adjacency list from an array of edges.
 *
 * @param {Array} edges - Edge objects with source, target, type, isContainment.
 * @returns {Map<string, { neighborId: string; type: string; isContainment: boolean }[]>} Adjacency
 *   map.
 */
function buildBfsAdjacencyList(edges) {
  const adj = new Map();
  for (const e of edges) {
    if (!adj.has(e.source)) {
      adj.set(e.source, []);
    }
    if (!adj.has(e.target)) {
      adj.set(e.target, []);
    }
    adj
      .get(e.source)
      .push({ neighborId: e.target, type: e.type, isContainment: Boolean(e.isContainment) });
    adj
      .get(e.target)
      .push({ neighborId: e.source, type: e.type, isContainment: Boolean(e.isContainment) });
  }
  return adj;
}

/**
 * Builds a parent→children index from an array of nodes.
 *
 * @param {Array} nodes - Node objects with id and optional parent.
 * @returns {Map<string, string[]>} Map of parent ID to child IDs.
 */
function buildChildrenIndex(nodes) {
  const childrenOf = new Map();
  for (const n of nodes) {
    if (n.parent) {
      if (!childrenOf.has(n.parent)) {
        childrenOf.set(n.parent, []);
      }
      childrenOf.get(n.parent).push(n.id);
    }
  }
  return childrenOf;
}

// ── BFS ALGORITHMS ────────────────────────────────────────────────────────────

/**
 * Pure: BFS from a drill-root node returning the set of visible node IDs and each node's BFS depth.
 *
 * @param {{
 *   rootId: string;
 *   drillDepth: number;
 *   nodes: { id: string; type: string; parent?: string }[];
 *   edges: { id: string; type: string; source: string; target: string; isContainment?: boolean }[];
 *   activeElemTypes: Set<string>;
 *   activeRelTypes: Set<string>;
 *   containmentMode: string;
 * }} params
 *   - The computation parameters.
 * @returns {{ visibleIds: Set<string>; nodeDepth: Map<string, number> }} Visible node IDs and their
 *   depths.
 */
export function computeDrillBfs({
  rootId,
  drillDepth,
  nodes,
  edges,
  activeElemTypes,
  activeRelTypes,
  containmentMode,
}) {
  const adj = buildBfsAdjacencyList(edges);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = buildChildrenIndex(nodes);

  function isTypeOk(nodeId) {
    return activeElemTypes.has(nodeById.get(nodeId)?.type) || nodeId === rootId;
  }

  function addCompoundNeighbors(nodeId, reachable) {
    const node = nodeById.get(nodeId);
    if (node?.parent) {
      reachable.add(node.parent);
    }
    for (const childId of childrenOf.get(nodeId) ?? []) {
      reachable.add(childId);
    }
  }

  const visible = new Set([rootId]);
  const nodeDepth = new Map([[rootId, 0]]);
  let frontier = [rootId];

  for (let d = 0; d < drillDepth; d++) {
    const next = [];
    for (const nodeId of frontier) {
      const reachable = new Set();
      for (const { neighborId, type, isContainment } of adj.get(nodeId) ?? []) {
        if (activeRelTypes.has(type) || isContainment) {
          reachable.add(neighborId);
        }
      }
      if (containmentMode === 'compound' || containmentMode === 'edge') {
        addCompoundNeighbors(nodeId, reachable);
      }
      for (const neighborId of reachable) {
        if (!visible.has(neighborId) && isTypeOk(neighborId)) {
          visible.add(neighborId);
          nodeDepth.set(neighborId, d + 1);
          next.push(neighborId);
        }
      }
    }
    frontier = next;
    if (!frontier.length) {
      break;
    }
  }

  return { visibleIds: visible, nodeDepth };
}

/**
 * Pure: BFS returning all node IDs within the drill spatial scope, ignoring entity type filters.
 *
 * @param {{
 *   rootId: string;
 *   drillDepth: number;
 *   nodes: { id: string; type: string; parent?: string }[];
 *   edges: { id: string; type: string; source: string; target: string; isContainment?: boolean }[];
 *   activeRelTypes: Set<string>;
 *   containmentMode: string;
 * }} params
 *   - The computation parameters.
 * @returns {Set<string>} The set of node IDs within drill scope.
 */
export function computeDrillScopeIds({
  rootId,
  drillDepth,
  nodes,
  edges,
  activeRelTypes,
  containmentMode,
}) {
  const adj = buildBfsAdjacencyList(edges);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = buildChildrenIndex(nodes);

  const visible = new Set([rootId]);
  let frontier = [rootId];

  for (let d = 0; d < drillDepth; d++) {
    const next = [];
    for (const nodeId of frontier) {
      const reachable = new Set();
      for (const { neighborId, type, isContainment } of adj.get(nodeId) ?? []) {
        if (activeRelTypes.has(type) || isContainment) {
          reachable.add(neighborId);
        }
      }
      if (containmentMode === 'compound' || containmentMode === 'edge') {
        const node = nodeById.get(nodeId);
        if (node?.parent) {
          reachable.add(node.parent);
        }
        for (const childId of childrenOf.get(nodeId) ?? []) {
          reachable.add(childId);
        }
      }
      for (const neighborId of reachable) {
        if (!visible.has(neighborId)) {
          visible.add(neighborId);
          next.push(neighborId);
        }
      }
    }
    frontier = next;
    if (!frontier.length) {
      break;
    }
  }

  return visible;
}

/**
 * Computes the final set of visible node IDs.
 *
 * @param {{
 *   allElements: { id: string; type: string }[];
 *   activeElemTypes: Set<string>;
 *   showAll: boolean;
 *   drillNodeId: string | undefined;
 *   drillVisibleIds: Set<string> | undefined;
 *   highlightEnabled: boolean;
 *   highlightNodeId: string | undefined;
 * }} params
 *   - Configuration object containing element data and filter settings.
 * @returns {Set<string>} Set of node IDs that should be rendered.
 */
export function computeVisibleNodeIds({
  allElements,
  activeElemTypes,
  showAll,
  drillNodeId,
  drillVisibleIds,
  highlightEnabled,
  highlightNodeId,
}) {
  // 1. Фильтрация по типам
  const visibleFromFilter = showAll
    ? new Set(allElements.map((e) => e.id))
    : new Set(allElements.filter((e) => activeElemTypes.has(e.type)).map((e) => e.id));

  // 2. Режим подсветки: видны активные типы + сам highlighted узел
  if (highlightEnabled && highlightNodeId) {
    return new Set([...visibleFromFilter, highlightNodeId]);
  }

  // 3. Режим drill: использовать drillVisibleIds напрямую (BFS уже учитывает тип-фильтр)
  if (drillNodeId && drillVisibleIds) {
    return drillVisibleIds;
  }

  // 4. Нормальный режим
  return visibleFromFilter;
}

/**
 * Computes the set of node IDs that should be visually faded.
 *
 * @param {{
 *   visibleNodeIds: Set<string>;
 *   highlightEnabled: boolean;
 *   highlightNodeId: string | undefined;
 *   highlightReachableIds: Set<string> | undefined;
 *   drillNodeId: string | undefined;
 *   drillScopeIds: Set<string> | undefined;
 * }} params
 *   - Configuration object containing visibility state and settings.
 * @returns {Set<string>} Set of node IDs that should be faded.
 */
export function computeFadedNodeIds({
  visibleNodeIds,
  highlightEnabled,
  highlightNodeId,
  highlightReachableIds,
  drillNodeId,
  drillScopeIds,
}) {
  const faded = new Set();

  if (highlightEnabled && highlightNodeId) {
    const reachable = highlightReachableIds ?? new Set();
    for (const id of visibleNodeIds) {
      if (id !== highlightNodeId && !reachable.has(id)) {
        faded.add(id);
      }
    }
    return faded;
  }

  if (drillNodeId && drillScopeIds) {
    for (const id of drillScopeIds) {
      if (!visibleNodeIds.has(id)) {
        faded.add(id);
      }
    }
    return faded;
  }

  return faded;
}
