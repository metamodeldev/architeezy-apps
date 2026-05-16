import { describe, expect, it } from 'bun:test';

import { computeVisRelCounts } from '../../js/filter/index.js';
import {
  computeDrillBfs,
  computeDrillScopeIds,
  computeVisibleNodeIds,
  computeFadedNodeIds,
} from '../../js/graph/visibility.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function node(id, type, parent) {
  return parent ? { id, type, parent } : { id, type };
}

function edge(id, type, source, target, isContainment = false) {
  return { id, type, source, target, isContainment };
}

function rel(id, type, source, target) {
  return { id, type, source, target };
}

function elemMap(...nodes) {
  return new Map(nodes.map((n) => [n.id, n]));
}

// ── computeVisRelCounts ───────────────────────────────────────────────────────

describe(computeVisRelCounts, () => {
  it('counts relations when both endpoint types are active', () => {
    const map = elemMap(node('a', 'Actor'), node('b', 'System'));
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'a', 'b')],
      elemMap: map,
      activeElemTypes: new Set(['Actor', 'System']),
      drillVisibleIds: undefined,
    });
    expect(counts).toStrictEqual({ Uses: 1 });
  });

  it('excludes relation when source type is inactive', () => {
    const map = elemMap(node('a', 'Actor'), node('b', 'System'));
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'a', 'b')],
      elemMap: map,
      activeElemTypes: new Set(['System']), // Actor inactive
      drillVisibleIds: undefined,
    });
    expect(counts).toStrictEqual({});
  });

  it('excludes relation when target type is inactive', () => {
    const map = elemMap(node('a', 'Actor'), node('b', 'System'));
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'a', 'b')],
      elemMap: map,
      activeElemTypes: new Set(['Actor']), // System inactive
      drillVisibleIds: undefined,
    });
    expect(counts).toStrictEqual({});
  });

  it('excludes relation when source is not in elemMap (edge to non-element)', () => {
    const map = elemMap(node('b', 'System'));
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'GHOST', 'b')],
      elemMap: map,
      activeElemTypes: new Set(['System']),
      drillVisibleIds: undefined,
    });
    expect(counts).toStrictEqual({});
  });

  it('excludes relation when target is not in elemMap', () => {
    const map = elemMap(node('a', 'Actor'));
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'a', 'GHOST')],
      elemMap: map,
      activeElemTypes: new Set(['Actor']),
      drillVisibleIds: undefined,
    });
    expect(counts).toStrictEqual({});
  });

  it('with drillVisibleIds: excludes relation whose source is outside drill scope', () => {
    const map = elemMap(node('a', 'Actor'), node('b', 'System'));
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'a', 'b')],
      elemMap: map,
      activeElemTypes: new Set(['Actor', 'System']),
      drillVisibleIds: new Set(['b']), // 'a' not in scope
    });
    expect(counts).toStrictEqual({});
  });

  it('with drillVisibleIds: excludes relation whose target is outside drill scope', () => {
    const map = elemMap(node('a', 'Actor'), node('b', 'System'));
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'a', 'b')],
      elemMap: map,
      activeElemTypes: new Set(['Actor', 'System']),
      drillVisibleIds: new Set(['a']), // 'b' not in scope
    });
    expect(counts).toStrictEqual({});
  });

  it('with drillVisibleIds: counts relation when both endpoints are in scope', () => {
    const map = elemMap(node('a', 'Actor'), node('b', 'System'));
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'a', 'b')],
      elemMap: map,
      activeElemTypes: new Set(['Actor', 'System']),
      drillVisibleIds: new Set(['a', 'b']),
    });
    expect(counts).toStrictEqual({ Uses: 1 });
  });

  it('counts multiple relation types and accumulates correctly', () => {
    const map = elemMap(node('a', 'Actor'), node('b', 'System'), node('c', 'DB'));
    const counts = computeVisRelCounts({
      allRelations: [
        rel('r1', 'Uses', 'a', 'b'),
        rel('r2', 'Uses', 'b', 'c'),
        rel('r3', 'Dep', 'a', 'c'),
      ],
      elemMap: map,
      activeElemTypes: new Set(['Actor', 'System', 'DB']),
      drillVisibleIds: undefined,
    });
    expect(counts).toStrictEqual({ Uses: 2, Dep: 1 });
  });

  it('returns empty object when there are no relations', () => {
    expect(
      computeVisRelCounts({
        allRelations: [],
        elemMap: {},
        activeElemTypes: new Set(),
        drillVisibleIds: undefined,
      }),
    ).toStrictEqual({});
  });
});

// ── computeDrillBfs ───────────────────────────────────────────────────────────

describe('computeDrillBfs — basic traversal', () => {
  it('isolated root: only root is visible', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 3,
      nodes: [node('root', 'App')],
      edges: [],
      activeElemTypes: new Set(['App']),
      activeRelTypes: new Set(),
      containmentMode: 'none',
    });
    expect([...visibleIds]).toStrictEqual(['root']);
  });

  it('depth 1: includes direct neighbors via active relation type', () => {
    const { visibleIds, nodeDepth } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 1,
      nodes: [node('root', 'App'), node('a', 'Svc'), node('b', 'Svc')],
      edges: [edge('e1', 'Uses', 'root', 'a'), edge('e2', 'Uses', 'root', 'b')],
      activeElemTypes: new Set(['App', 'Svc']),
      activeRelTypes: new Set(['Uses']),
      containmentMode: 'none',
    });
    expect(visibleIds).toContain('a');
    expect(visibleIds).toContain('b');
    expect(nodeDepth.get('a')).toBe(1);
    expect(nodeDepth.get('b')).toBe(1);
  });

  it('depth 2: includes nodes 2 hops away', () => {
    const { visibleIds, nodeDepth } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 2,
      nodes: [node('root', 'A'), node('mid', 'A'), node('far', 'A')],
      edges: [edge('e1', 'Uses', 'root', 'mid'), edge('e2', 'Uses', 'mid', 'far')],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['Uses']),
      containmentMode: 'none',
    });
    expect(visibleIds).toContain('far');
    expect(nodeDepth.get('far')).toBe(2);
  });

  it('stops at drillDepth: node at depth+1 is NOT included', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 1,
      nodes: [node('root', 'A'), node('mid', 'A'), node('far', 'A')],
      edges: [edge('e1', 'Uses', 'root', 'mid'), edge('e2', 'Uses', 'mid', 'far')],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['Uses']),
      containmentMode: 'none',
    });
    expect(visibleIds).toContain('mid');
    expect(visibleIds).not.toContain('far');
  });

  it('traversal works in both edge directions (undirected BFS)', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 1,
      nodes: [node('root', 'A'), node('other', 'A')],
      edges: [edge('e1', 'Uses', 'other', 'root')], // Root is the target, not source
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['Uses']),
      containmentMode: 'none',
    });
    expect(visibleIds).toContain('other');
  });
});

// ── computeDrillBfs — type filtering ─────────────────────────────────────────

describe('computeDrillBfs — type filtering', () => {
  it('excludes nodes whose type is inactive', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 2,
      nodes: [node('root', 'App'), node('filtered', 'Hidden'), node('behind', 'App')],
      edges: [edge('e1', 'Uses', 'root', 'filtered'), edge('e2', 'Uses', 'filtered', 'behind')],
      activeElemTypes: new Set(['App']), // 'Hidden' inactive
      activeRelTypes: new Set(['Uses']),
      containmentMode: 'none',
    });
    expect(visibleIds).not.toContain('filtered');
    // 'behind' is only reachable through the filtered node → also excluded
    expect(visibleIds).not.toContain('behind');
  });

  it('root is always visible even when its type is inactive', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 1,
      nodes: [node('root', 'Filtered'), node('nb', 'Active')],
      edges: [edge('e1', 'Uses', 'root', 'nb')],
      activeElemTypes: new Set(['Active']), // Root type 'Filtered' is inactive
      activeRelTypes: new Set(['Uses']),
      containmentMode: 'none',
    });
    expect(visibleIds).toContain('root');
  });

  it('root traversal continues even when its type is inactive (neighbors are still reached)', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 1,
      nodes: [node('root', 'Filtered'), node('nb', 'Active')],
      edges: [edge('e1', 'Uses', 'root', 'nb')],
      activeElemTypes: new Set(['Active']),
      activeRelTypes: new Set(['Uses']),
      containmentMode: 'none',
    });
    expect(visibleIds).toContain('nb');
  });

  it('ignores edges whose type is not in activeRelTypes', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 2,
      nodes: [node('root', 'A'), node('nb', 'A')],
      edges: [edge('e1', 'Inactive', 'root', 'nb')],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['Uses']), // 'Inactive' not in set
      containmentMode: 'none',
    });
    expect(visibleIds).not.toContain('nb');
  });
});

// ── computeDrillBfs — containment edges ──────────────────────────────────────

describe('computeDrillBfs — containment edges', () => {
  it('always traverses containment edges regardless of activeRelTypes', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 1,
      nodes: [node('root', 'A'), node('child', 'A')],
      edges: [edge('e1', 'Contains', 'root', 'child', true)], // IsContainment = true
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(), // Empty — but containment is always followed
      containmentMode: 'none',
    });
    expect(visibleIds).toContain('child');
  });
});

// ── computeDrillBfs — compound mode ──────────────────────────────────────────

describe('computeDrillBfs — compound mode', () => {
  it('traverses from parent to children in compound mode', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'parent',
      drillDepth: 1,
      nodes: [node('parent', 'Group'), node('child', 'Item', 'parent')],
      edges: [],
      activeElemTypes: new Set(['Group', 'Item']),
      activeRelTypes: new Set(),
      containmentMode: 'compound',
    });
    expect(visibleIds).toContain('child');
  });

  it('traverses from child to parent in compound mode', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'child',
      drillDepth: 1,
      nodes: [node('parent', 'Group'), node('child', 'Item', 'parent')],
      edges: [],
      activeElemTypes: new Set(['Group', 'Item']),
      activeRelTypes: new Set(),
      containmentMode: 'compound',
    });
    expect(visibleIds).toContain('parent');
  });

  it('traverses compound parent/child links in edge mode', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'child',
      drillDepth: 1,
      nodes: [node('parent', 'Group'), node('child', 'Item', 'parent')],
      edges: [],
      activeElemTypes: new Set(['Group', 'Item']),
      activeRelTypes: new Set(),
      containmentMode: 'edge',
    });
    expect(visibleIds).toContain('parent');
  });
});

// ── computeDrillBfs — cycles and correctness ─────────────────────────────────

describe('computeDrillBfs — cycles', () => {
  it('does not loop infinitely with circular edges', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'a',
      drillDepth: 5,
      nodes: [node('a', 'X'), node('b', 'X'), node('c', 'X')],
      edges: [edge('e1', 'R', 'a', 'b'), edge('e2', 'R', 'b', 'c'), edge('e3', 'R', 'c', 'a')],
      activeElemTypes: new Set(['X']),
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    expect(visibleIds.size).toBe(3); // All three, no duplicates
  });

  it('each node appears in nodeDepth exactly once (first-visit depth wins)', () => {
    const { nodeDepth } = computeDrillBfs({
      rootId: 'a',
      drillDepth: 3,
      // Diamond: a→b, a→c, b→d, c→d
      nodes: [node('a', 'X'), node('b', 'X'), node('c', 'X'), node('d', 'X')],
      edges: [
        edge('e1', 'R', 'a', 'b'),
        edge('e2', 'R', 'a', 'c'),
        edge('e3', 'R', 'b', 'd'),
        edge('e4', 'R', 'c', 'd'),
      ],
      activeElemTypes: new Set(['X']),
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    // 'd' is reachable at depth 2 via both b and c; depth must be 2, not re-recorded
    expect(nodeDepth.get('d')).toBe(2);
  });
});

// ── computeDrillBfs — nodeDepth values ───────────────────────────────────────

describe('computeDrillBfs — nodeDepth', () => {
  it('root has depth 0', () => {
    const { nodeDepth } = computeDrillBfs({
      rootId: 'root',
      drillDepth: 1,
      nodes: [node('root', 'A')],
      edges: [],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(),
      containmentMode: 'none',
    });
    expect(nodeDepth.get('root')).toBe(0);
  });

  it('linear chain: correct depths 0→1→2→3', () => {
    const { nodeDepth } = computeDrillBfs({
      rootId: 'n0',
      drillDepth: 3,
      nodes: [node('n0', 'A'), node('n1', 'A'), node('n2', 'A'), node('n3', 'A')],
      edges: [
        edge('e1', 'R', 'n0', 'n1'),
        edge('e2', 'R', 'n1', 'n2'),
        edge('e3', 'R', 'n2', 'n3'),
      ],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    expect(nodeDepth.get('n0')).toBe(0);
    expect(nodeDepth.get('n1')).toBe(1);
    expect(nodeDepth.get('n2')).toBe(2);
    expect(nodeDepth.get('n3')).toBe(3);
  });
});

// ── computeDrillBfs — termination & extra branches ────────────────────────────

describe('computeDrillBfs — termination and edge cases', () => {
  it('drillDepth = 0 returns only root', () => {
    const { visibleIds, nodeDepth } = computeDrillBfs({
      rootId: 'r',
      drillDepth: 0,
      nodes: [node('r', 'A'), node('x', 'A')],
      edges: [edge('e', 'R', 'r', 'x')],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    expect([...visibleIds]).toStrictEqual(['r']);
    expect(nodeDepth.get('r')).toBe(0);
    expect(nodeDepth.has('x')).toBe(false);
  });

  it('breaks early when frontier becomes empty (no more reachable nodes)', () => {
    // Even with very high drillDepth, must terminate. Cycle ensures coverage of the
    // "if (!frontier.length) break" branch (otherwise the for loop would still terminate).
    const { visibleIds, nodeDepth } = computeDrillBfs({
      rootId: 'r',
      drillDepth: 999,
      nodes: [node('r', 'A'), node('x', 'A')],
      edges: [edge('e', 'R', 'r', 'x')],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    expect(visibleIds.size).toBe(2);
    expect(nodeDepth.get('x')).toBe(1); // Reached at depth 1, then frontier emptied
  });

  it("containmentMode 'none' does NOT add parent/child via compound links", () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'child',
      drillDepth: 1,
      nodes: [node('parent', 'G'), node('child', 'I', 'parent')],
      edges: [],
      activeElemTypes: new Set(['G', 'I']),
      activeRelTypes: new Set(),
      containmentMode: 'none',
    });
    expect(visibleIds).not.toContain('parent');
  });

  it('containment edge connects nodes even when activeRelTypes set is empty', () => {
    // Pins the `activeRelTypes.has(type) || isContainment` (logical OR vs AND).
    const { visibleIds } = computeDrillBfs({
      rootId: 'r',
      drillDepth: 1,
      nodes: [node('r', 'A'), node('x', 'A')],
      // Non-containment edge with a type NOT in activeRelTypes → must NOT be followed
      edges: [edge('e', 'NotActive', 'r', 'x', false)],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['SomethingElse']),
      containmentMode: 'none',
    });
    expect(visibleIds).not.toContain('x');
  });

  it('node without `type` field is excluded by type filter (root exception only)', () => {
    // Pins the optional chaining on `nodeById.get(nodeId)?.type`:
    // a strict access would throw on missing entries; we must just return false.
    const { visibleIds } = computeDrillBfs({
      rootId: 'r',
      drillDepth: 1,
      nodes: [node('r', 'A')], // 'x' is referenced in edges but missing from nodes
      edges: [edge('e', 'R', 'r', 'x')],
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    // 'x' has no type, no entry → activeElemTypes.has(undefined) is false → not visible
    expect(visibleIds).not.toContain('x');
    expect(visibleIds.has('r')).toBe(true);
  });
});

// ── computeDrillScopeIds ──────────────────────────────────────────────────────

describe(computeDrillScopeIds, () => {
  it('returns the root with no edges', () => {
    const ids = computeDrillScopeIds({
      rootId: 'r',
      drillDepth: 3,
      nodes: [node('r', 'A')],
      edges: [],
      activeRelTypes: new Set(),
      containmentMode: 'none',
    });
    expect([...ids]).toStrictEqual(['r']);
  });

  it('ignores type filter — includes nodes regardless of their type', () => {
    // This is the key difference from computeDrillBfs.
    const ids = computeDrillScopeIds({
      rootId: 'r',
      drillDepth: 1,
      nodes: [node('r', 'A'), node('x', 'Hidden')],
      edges: [edge('e', 'R', 'r', 'x')],
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    expect(ids).toContain('x'); // Would be excluded by computeDrillBfs
  });

  it('respects activeRelTypes (skips edges not in set)', () => {
    const ids = computeDrillScopeIds({
      rootId: 'r',
      drillDepth: 1,
      nodes: [node('r', 'A'), node('x', 'A')],
      edges: [edge('e', 'Inactive', 'r', 'x')],
      activeRelTypes: new Set(['Uses']),
      containmentMode: 'none',
    });
    expect(ids).not.toContain('x');
  });

  it('follows containment edges regardless of activeRelTypes', () => {
    const ids = computeDrillScopeIds({
      rootId: 'r',
      drillDepth: 1,
      nodes: [node('r', 'A'), node('x', 'A')],
      edges: [edge('e', 'Contains', 'r', 'x', true)],
      activeRelTypes: new Set(),
      containmentMode: 'none',
    });
    expect(ids).toContain('x');
  });

  it('compound mode traverses parent/child links', () => {
    const idsUp = computeDrillScopeIds({
      rootId: 'child',
      drillDepth: 1,
      nodes: [node('parent', 'G'), node('child', 'I', 'parent')],
      edges: [],
      activeRelTypes: new Set(),
      containmentMode: 'compound',
    });
    expect(idsUp).toContain('parent');

    const idsDown = computeDrillScopeIds({
      rootId: 'parent',
      drillDepth: 1,
      nodes: [node('parent', 'G'), node('child', 'I', 'parent')],
      edges: [],
      activeRelTypes: new Set(),
      containmentMode: 'compound',
    });
    expect(idsDown).toContain('child');
  });

  it('edge mode also traverses compound links', () => {
    const ids = computeDrillScopeIds({
      rootId: 'parent',
      drillDepth: 1,
      nodes: [node('parent', 'G'), node('child', 'I', 'parent')],
      edges: [],
      activeRelTypes: new Set(),
      containmentMode: 'edge',
    });
    expect(ids).toContain('child');
  });

  it("'none' mode skips compound links", () => {
    const ids = computeDrillScopeIds({
      rootId: 'parent',
      drillDepth: 1,
      nodes: [node('parent', 'G'), node('child', 'I', 'parent')],
      edges: [],
      activeRelTypes: new Set(),
      containmentMode: 'none',
    });
    expect(ids).not.toContain('child');
  });

  it('respects drillDepth as a hard cutoff', () => {
    const ids = computeDrillScopeIds({
      rootId: 'a',
      drillDepth: 1,
      nodes: [node('a', 'X'), node('b', 'X'), node('c', 'X')],
      edges: [edge('e1', 'R', 'a', 'b'), edge('e2', 'R', 'b', 'c')],
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    expect(ids).toContain('b');
    expect(ids).not.toContain('c');
  });

  it('linear chain at full depth includes every node', () => {
    const ids = computeDrillScopeIds({
      rootId: 'a',
      drillDepth: 3,
      nodes: [node('a', 'X'), node('b', 'X'), node('c', 'X'), node('d', 'X')],
      edges: [
        edge('e1', 'R', 'a', 'b'),
        edge('e2', 'R', 'b', 'c'),
        edge('e3', 'R', 'c', 'd'),
      ],
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    expect([...ids].sort()).toStrictEqual(['a', 'b', 'c', 'd']);
  });

  it('cycle does not loop infinitely', () => {
    const ids = computeDrillScopeIds({
      rootId: 'a',
      drillDepth: 99,
      nodes: [node('a', 'X'), node('b', 'X'), node('c', 'X')],
      edges: [edge('e1', 'R', 'a', 'b'), edge('e2', 'R', 'b', 'c'), edge('e3', 'R', 'c', 'a')],
      activeRelTypes: new Set(['R']),
      containmentMode: 'none',
    });
    expect(ids.size).toBe(3);
  });
});

// ── computeVisibleNodeIds ─────────────────────────────────────────────────────

const visElements = [
  { id: 'a', type: 'Actor' },
  { id: 'b', type: 'System' },
  { id: 'c', type: 'DB' },
  { id: 'd', type: 'Actor' },
];

describe('computeVisibleNodeIds — normal mode', () => {
  it('showAll = true → all elements visible', () => {
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor']),
      showAll: true,
      drillNodeId: undefined,
      drillScopeIds: undefined,
      highlightEnabled: false,
      highlightNodeId: undefined,
    });
    expect(result).toEqual(new Set(['a', 'b', 'c', 'd']));
  });

  it('type filter: only active types visible', () => {
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor']),
      showAll: false,
      drillNodeId: undefined,
      drillScopeIds: undefined,
      highlightEnabled: false,
      highlightNodeId: undefined,
    });
    expect(result).toEqual(new Set(['a', 'd']));
  });
});

describe('computeVisibleNodeIds — drill mode', () => {
  it('drill: returns drillVisibleIds as-is (BFS already applied type filter)', () => {
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor', 'System']),
      showAll: false,
      drillNodeId: 'a',
      drillVisibleIds: new Set(['a', 'b']), // Pre-filtered by BFS: 'c' filtered out, 'd' outside scope
      highlightEnabled: false,
      highlightNodeId: undefined,
    });
    expect(result).toEqual(new Set(['a', 'b']));
  });
});

describe('computeVisibleNodeIds — highlight mode', () => {
  it('highlight: active types + highlighted node visible', () => {
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor']),
      showAll: false,
      drillNodeId: undefined,
      drillScopeIds: undefined,
      highlightEnabled: true,
      highlightNodeId: 'b', // B: System, not in activeElemTypes but must be visible
    });
    expect(result).toContain('a');
    expect(result).toContain('b'); // Force-visible
    expect(result).toContain('d');
    expect(result).not.toContain('c');
  });

  it('highlightEnabled = true but no highlightNodeId → falls through to normal mode', () => {
    // Pins the AND vs OR on `highlightEnabled && highlightNodeId`
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor']),
      showAll: false,
      drillNodeId: undefined,
      drillScopeIds: undefined,
      highlightEnabled: true,
      highlightNodeId: undefined,
    });
    expect(result).toStrictEqual(new Set(['a', 'd']));
  });

  it('highlightNodeId present but disabled → falls through to normal mode', () => {
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor']),
      showAll: false,
      drillNodeId: undefined,
      drillScopeIds: undefined,
      highlightEnabled: false,
      highlightNodeId: 'b',
    });
    expect(result).not.toContain('b'); // Not force-included
    expect(result).toStrictEqual(new Set(['a', 'd']));
  });
});

describe('computeVisibleNodeIds — drill mode edge cases', () => {
  it('drillNodeId set but drillVisibleIds undefined → falls through to normal mode', () => {
    // Pins the AND on `drillNodeId && drillVisibleIds`.
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor']),
      showAll: false,
      drillNodeId: 'a',
      drillVisibleIds: undefined,
      highlightEnabled: false,
      highlightNodeId: undefined,
    });
    expect(result).toStrictEqual(new Set(['a', 'd']));
  });

  it('drillVisibleIds set but drillNodeId undefined → falls through to normal mode', () => {
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor']),
      showAll: false,
      drillNodeId: undefined,
      drillVisibleIds: new Set(['a', 'b', 'c']),
      highlightEnabled: false,
      highlightNodeId: undefined,
    });
    expect(result).toStrictEqual(new Set(['a', 'd']));
  });

  it('highlight takes precedence over drill when both set', () => {
    const result = computeVisibleNodeIds({
      allElements: visElements,
      activeElemTypes: new Set(['Actor']),
      showAll: false,
      drillNodeId: 'a',
      drillVisibleIds: new Set(['a']),
      highlightEnabled: true,
      highlightNodeId: 'c',
    });
    // Highlight branch returns active types + highlighted node, NOT drill set
    expect(result).toContain('a');
    expect(result).toContain('c'); // Force-included
    expect(result).toContain('d'); // Active Actor type
    expect(result).not.toContain('b');
  });
});

// ── computeFadedNodeIds ───────────────────────────────────────────────────────

describe('computeFadedNodeIds — highlight mode', () => {
  it('fades nodes outside BFS-reachability from highlighted', () => {
    const result = computeFadedNodeIds({
      visibleNodeIds: new Set(['a', 'b', 'c', 'd']),
      highlightEnabled: true,
      highlightNodeId: 'a',
      highlightReachableIds: new Set(['a', 'b']), // 'c' and 'd' not reachable
      drillNodeId: undefined,
      drillScopeIds: undefined,
    });
    expect(result).toContain('c');
    expect(result).toContain('d');
    expect(result).not.toContain('a'); // Highlighted does not fade itself
    expect(result).not.toContain('b'); // Reachable
  });
});

describe('computeFadedNodeIds — drill mode', () => {
  it('fades nodes in scope but not visible (filtered out)', () => {
    const result = computeFadedNodeIds({
      visibleNodeIds: new Set(['a', 'b']), // 'c' filtered out
      highlightEnabled: false,
      highlightNodeId: undefined,
      highlightReachableIds: undefined,
      drillNodeId: 'a',
      drillScopeIds: new Set(['a', 'b', 'c']), // 'c' in scope but not visible
    });
    expect(result).toContain('c');
    expect(result).not.toContain('a');
    expect(result).not.toContain('b');
  });

  it('drillNodeId set but drillScopeIds undefined → empty set', () => {
    // Pins AND on `drillNodeId && drillScopeIds`.
    const result = computeFadedNodeIds({
      visibleNodeIds: new Set(['a', 'b']),
      highlightEnabled: false,
      highlightNodeId: undefined,
      highlightReachableIds: undefined,
      drillNodeId: 'a',
      drillScopeIds: undefined,
    });
    expect(result.size).toBe(0);
  });

  it('drillScopeIds set but drillNodeId undefined → empty set', () => {
    const result = computeFadedNodeIds({
      visibleNodeIds: new Set(['a']),
      highlightEnabled: false,
      highlightNodeId: undefined,
      highlightReachableIds: undefined,
      drillNodeId: undefined,
      drillScopeIds: new Set(['a', 'b']),
    });
    expect(result.size).toBe(0);
  });
});

describe('computeFadedNodeIds — highlight edge cases', () => {
  it('highlightEnabled = true but no highlightNodeId → empty set', () => {
    const result = computeFadedNodeIds({
      visibleNodeIds: new Set(['a', 'b', 'c']),
      highlightEnabled: true,
      highlightNodeId: undefined,
      highlightReachableIds: new Set(['a']),
      drillNodeId: undefined,
      drillScopeIds: undefined,
    });
    expect(result.size).toBe(0);
  });

  it('highlighted node never fades, even when reachable set excludes it', () => {
    // Pins `id !== highlightNodeId && !reachable.has(id)` — removing the first conjunct
    // would put the highlighted node into faded if it is not also in reachable.
    const result = computeFadedNodeIds({
      visibleNodeIds: new Set(['hl', 'x']),
      highlightEnabled: true,
      highlightNodeId: 'hl',
      highlightReachableIds: new Set(), // 'hl' explicitly not in reachable
      drillNodeId: undefined,
      drillScopeIds: undefined,
    });
    expect(result).not.toContain('hl');
    expect(result).toContain('x');
  });

  it('missing highlightReachableIds defaults to empty set (everything fades except highlighted)', () => {
    const result = computeFadedNodeIds({
      visibleNodeIds: new Set(['hl', 'a', 'b']),
      highlightEnabled: true,
      highlightNodeId: 'hl',
      highlightReachableIds: undefined,
      drillNodeId: undefined,
      drillScopeIds: undefined,
    });
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).not.toContain('hl');
  });

  it('no highlight, no drill → empty faded set', () => {
    const result = computeFadedNodeIds({
      visibleNodeIds: new Set(['a', 'b']),
      highlightEnabled: false,
      highlightNodeId: undefined,
      highlightReachableIds: undefined,
      drillNodeId: undefined,
      drillScopeIds: undefined,
    });
    expect(result.size).toBe(0);
  });
});
