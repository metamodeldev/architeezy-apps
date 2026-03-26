import { computeDrillBfs, computeVisRelCounts } from '../../js/visibility.js';

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
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
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

  it('does NOT traverse compound parent/child links in non-compound mode', () => {
    const { visibleIds } = computeDrillBfs({
      rootId: 'child',
      drillDepth: 1,
      nodes: [node('parent', 'Group'), node('child', 'Item', 'parent')],
      edges: [],
      activeElemTypes: new Set(['Group', 'Item']),
      activeRelTypes: new Set(),
      containmentMode: 'edge', // Compound links not traversed
    });
    expect(visibleIds).not.toContain('parent');
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
