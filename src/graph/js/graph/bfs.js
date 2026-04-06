/**
 * Breadth-first search graph traversal algorithms.
 *
 * Used by drill-down and highlight.
 *
 * @module graph/bfs
 * @package
 */

/**
 * Builds an adjacency list from an array of edges for BFS traversal.
 *
 * @param {Array} edges - Array of edge objects with source, target, type, and isContainment.
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

/**
 * Pure: BFS from a drill-root node returning the set of visible node IDs and each node's BFS depth.
 *
 * Traversal rules: - Only type-active nodes (plus the root itself) enter the visible set and the
 * frontier. - The root is always traversable even when its type is filtered out. - Edges followed:
 * those in activeRelTypes OR containment edges. - In compound mode, parent↔child links are also
 * traversed.
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
 *   Configuration for BFS traversal
 * @returns {{ visibleIds: Set<string>; nodeDepth: Map<string, number> }} Result with visible IDs
 *   and depth map
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
      if (containmentMode === 'compound') {
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
 * Used to compute "Available" counts for entity types in the filter list during drill-down.
 *
 * @param {{
 *   rootId: string;
 *   drillDepth: number;
 *   nodes: { id: string; type: string; parent?: string }[];
 *   edges: { id: string; type: string; source: string; target: string; isContainment?: boolean }[];
 *   activeRelTypes: Set<string>;
 *   containmentMode: string;
 * }} params
 *   Configuration for drill scope computation
 * @returns {Set<string>} Set of node IDs within the drill scope.
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
      if (containmentMode === 'compound') {
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
