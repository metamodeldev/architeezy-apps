import { describe, expect, it } from 'bun:test';

import {
  buildAxisItems,
  buildAxisItemsAllLevels,
  collectAllElems,
  getOrigRange,
  recomputeFlatRowGroups,
} from '../../js/compute-axis.js';

// ── buildAxisItems ────────────────────────────────────────────────────────────

describe(buildAxisItems, () => {
  const groups = [
    { start: 0, end: 2, elemId: 'g1' },
    { start: 2, end: 3, elemId: 'g2' },
  ];

  it('returns only leaves when no subtotals and no total', () => {
    const items = buildAxisItems(3, groups, false, false);
    expect(items).toStrictEqual([
      { type: 'leaf', origIdx: 0 },
      { type: 'leaf', origIdx: 1 },
      { type: 'leaf', origIdx: 2 },
    ]);
  });

  it('inserts subtotal after each group', () => {
    const items = buildAxisItems(3, groups, true, false);
    expect(items).toStrictEqual([
      { type: 'leaf', origIdx: 0 },
      { type: 'leaf', origIdx: 1 },
      { type: 'subtotal', groupIdx: 0 },
      { type: 'leaf', origIdx: 2 },
      { type: 'subtotal', groupIdx: 1 },
    ]);
  });

  it('appends total at the end', () => {
    const items = buildAxisItems(3, groups, false, true);
    expect(items.at(-1)).toStrictEqual({ type: 'total' });
  });

  it('includes both subtotals and total', () => {
    const items = buildAxisItems(3, groups, true, true);
    expect(items.filter((i) => i.type === 'subtotal')).toHaveLength(2);
    expect(items.at(-1)).toStrictEqual({ type: 'total' });
  });
});

// ── buildAxisItemsAllLevels ───────────────────────────────────────────────────

function leaf(id, groupElems = []) {
  return {
    groups: groupElems.map((e) => ({ elem: e, span: 1, first: true })),
    leafElem: { id },
  };
}

describe(buildAxisItemsAllLevels, () => {
  it('0 group levels → only leaf items', () => {
    const flatRows = [leaf('a'), leaf('b'), leaf('c')];
    const items = buildAxisItemsAllLevels(flatRows, 0);
    expect(items).toStrictEqual([
      { type: 'leaf', origIdx: 0 },
      { type: 'leaf', origIdx: 1 },
      { type: 'leaf', origIdx: 2 },
    ]);
  });

  it('1 group level, 2 groups of 2 → leaves then subtotal per group (first group)', () => {
    const g1 = { id: 'g1' };
    const g2 = { id: 'g2' };
    const flatRows = [leaf('a', [g1]), leaf('b', [g1]), leaf('c', [g2]), leaf('d', [g2])];
    const items = buildAxisItemsAllLevels(flatRows, 1);
    // Expected order: a, b, subtotal(g1), c, d, subtotal(g2)
    expect(items[0]).toStrictEqual({ type: 'leaf', origIdx: 0 });
    expect(items[1]).toStrictEqual({ type: 'leaf', origIdx: 1 });
    expect(items[2]).toMatchObject({
      type: 'subtotal',
      _groupElem: g1,
      _groupLevel: 0,
      origRange: [0, 1],
    });
    expect(items[3]).toStrictEqual({ type: 'leaf', origIdx: 2 });
    expect(items[4]).toStrictEqual({ type: 'leaf', origIdx: 3 });
  });

  it('1 group level, 2 groups of 2 → second group subtotal', () => {
    const g1 = { id: 'g1' };
    const g2 = { id: 'g2' };
    const flatRows = [leaf('a', [g1]), leaf('b', [g1]), leaf('c', [g2]), leaf('d', [g2])];
    const items = buildAxisItemsAllLevels(flatRows, 1);
    expect(items[5]).toMatchObject({
      type: 'subtotal',
      _groupElem: g2,
      _groupLevel: 0,
      origRange: [2, 3],
    });
  });

  it('2 group levels (nested) → inner subtotals then outer subtotal', () => {
    const outer = { id: 'outer' };
    const inner1 = { id: 'inner1' };
    const inner2 = { id: 'inner2' };
    const flatRows = [
      { groups: [{ elem: outer }, { elem: inner1 }], leafElem: { id: 'a' } },
      { groups: [{ elem: outer }, { elem: inner1 }], leafElem: { id: 'b' } },
      { groups: [{ elem: outer }, { elem: inner2 }], leafElem: { id: 'c' } },
    ];
    const items = buildAxisItemsAllLevels(flatRows, 2);
    const subtotals = items.filter((i) => i.type === 'subtotal');
    // Inner1 subtotal (level=1), inner2 subtotal (level=1), outer subtotal (level=0)
    expect(subtotals).toHaveLength(3);
    const outerSub = subtotals.find((s) => s._groupLevel === 0);
    expect(outerSub).toBeDefined();
    expect(outerSub._groupElem.id).toBe('outer');
    expect(outerSub.origRange).toStrictEqual([0, 1, 2]);
    const level1Subs = subtotals.filter((s) => s._groupLevel === 1);
    const inner1Sub = level1Subs.find((s) => s._groupElem.id === 'inner1');
    expect(inner1Sub).toBeDefined();
  });

  it('2 group levels (nested) → inner1 subtotal has correct origRange', () => {
    const outer = { id: 'outer' };
    const inner1 = { id: 'inner1' };
    const inner2 = { id: 'inner2' };
    const flatRows = [
      { groups: [{ elem: outer }, { elem: inner1 }], leafElem: { id: 'a' } },
      { groups: [{ elem: outer }, { elem: inner1 }], leafElem: { id: 'b' } },
      { groups: [{ elem: outer }, { elem: inner2 }], leafElem: { id: 'c' } },
    ];
    const items = buildAxisItemsAllLevels(flatRows, 2);
    const subtotals = items.filter((i) => i.type === 'subtotal');
    const level1Subs = subtotals.filter((s) => s._groupLevel === 1);
    const inner1Sub = level1Subs.find((s) => s._groupElem.id === 'inner1');
    expect(inner1Sub.origRange).toStrictEqual([0, 1]);
  });

  it('subtotals have correct origRange and _groupLevel', () => {
    const g = { id: 'g' };
    const flatRows = [leaf('x', [g]), leaf('y', [g])];
    const items = buildAxisItemsAllLevels(flatRows, 1);
    const sub = items.find((i) => i.type === 'subtotal');
    expect(sub.origRange).toStrictEqual([0, 1]);
    expect(sub._groupLevel).toBe(0);
    expect(sub._groupElem).toBe(g);
  });

  it('with includeTotal=true appends a total item', () => {
    const g = { id: 'g' };
    const flatRows = [leaf('a', [g]), leaf('b', [g])];
    const items = buildAxisItemsAllLevels(flatRows, 1, true);
    expect(items.at(-1)).toStrictEqual({ type: 'total' });
  });

  it('0 group levels with includeTotal → leaves + total', () => {
    const flatRows = [leaf('a'), leaf('b')];
    const items = buildAxisItemsAllLevels(flatRows, 0, true);
    expect(items.filter((i) => i.type === 'leaf')).toHaveLength(2);
    expect(items.at(-1)).toStrictEqual({ type: 'total' });
  });
});

// ── getOrigRange ──────────────────────────────────────────────────────────────

describe(getOrigRange, () => {
  const groups = [
    { start: 0, end: 2, elemId: 'g1' },
    { start: 2, end: 4, elemId: 'g2' },
  ];

  it('leaf → returns [origIdx]', () => {
    expect(getOrigRange({ type: 'leaf', origIdx: 3 }, groups, 4)).toStrictEqual([3]);
  });

  it('subtotal → returns range of its group', () => {
    expect(getOrigRange({ type: 'subtotal', groupIdx: 1 }, groups, 4)).toStrictEqual([2, 3]);
  });

  it('total → returns all indices', () => {
    expect(getOrigRange({ type: 'total' }, groups, 4)).toStrictEqual([0, 1, 2, 3]);
  });

  it('subtotal with origRange uses origRange directly (does not consult groups)', () => {
    // Groups is empty — if code tries groups[item.groupIdx].start it would throw
    const item = { type: 'subtotal', origRange: [2, 3, 4] };
    expect(getOrigRange(item, [], 10)).toStrictEqual([2, 3, 4]);
  });

  it('subtotal without origRange falls back to groupIdx', () => {
    const groups2 = [{ start: 1, end: 3 }];
    const item = { type: 'subtotal', groupIdx: 0 };
    expect(getOrigRange(item, groups2, 3)).toStrictEqual([1, 2]);
  });
});

// ── collectAllElems ───────────────────────────────────────────────────────────

function flatRow(leafElem, ...groupElems) {
  return {
    groups: groupElems.map((e) => ({ elem: e, span: 1, first: true })),
    leafElem,
  };
}

describe(collectAllElems, () => {
  const gA = { id: 'gA', name: 'Group A' };
  const gB = { id: 'gB', name: 'Group B' };
  const l1 = { id: 'l1', name: 'Leaf 1' };
  const l2 = { id: 'l2', name: 'Leaf 2' };
  const l3 = { id: 'l3', name: 'Leaf 3' };

  it('collects leaf elements only when numGroupLevels=0', () => {
    const rows = [flatRow(l1), flatRow(l2)];
    expect(collectAllElems(rows, [0, 1], 0)).toStrictEqual([l1, l2]);
  });

  it('collects leaf and group elements', () => {
    const rows = [flatRow(l1, gA), flatRow(l2, gA), flatRow(l3, gB)];
    const result = collectAllElems(rows, [0, 1, 2], 1);
    expect(result.map((e) => e.id)).toContain('l1');
    expect(result.map((e) => e.id)).toContain('l2');
    expect(result.map((e) => e.id)).toContain('l3');
    expect(result.map((e) => e.id)).toContain('gA');
    expect(result.map((e) => e.id)).toContain('gB');
  });

  it('deduplicates shared group elements', () => {
    const rows = [flatRow(l1, gA), flatRow(l2, gA)];
    const result = collectAllElems(rows, [0, 1], 1);
    expect(result.filter((e) => e.id === 'gA')).toHaveLength(1);
  });

  it('only collects elements in specified indices', () => {
    const rows = [flatRow(l1, gA), flatRow(l2, gB)];
    const result = collectAllElems(rows, [0], 1);
    expect(result.map((e) => e.id)).toContain('l1');
    expect(result.map((e) => e.id)).not.toContain('l2');
    expect(result.map((e) => e.id)).toContain('gA');
    expect(result.map((e) => e.id)).not.toContain('gB');
  });

  it('excludes virtual nodes', () => {
    const rows = [
      flatRow({ id: 'sub', _isSubtotal: true }),
      flatRow({ id: 'tot', _isGrandTotal: true }),
      flatRow({ id: 'emp', _isEmptyLeaf: true }),
      flatRow(l1),
    ];
    const result = collectAllElems(rows, [0, 1, 2, 3], 0);
    expect(result.map((e) => e.id)).toStrictEqual(['l1']);
  });
});

// ── recomputeFlatRowGroups ────────────────────────────────────────────────────

function frRecompute(groupElem, leafId) {
  return {
    groups: [{ elem: groupElem, span: 999, first: false }],
    leafElem: { id: leafId },
  };
}

describe(recomputeFlatRowGroups, () => {
  it('sets first=true on the first row of each group', () => {
    const g1 = { id: 'g1' };
    const g2 = { id: 'g2' };
    const rows = [frRecompute(g1, 'a'), frRecompute(g1, 'b'), frRecompute(g2, 'c')];
    recomputeFlatRowGroups(rows, 1);
    expect(rows[0].groups[0].first).toBe(true);
    expect(rows[1].groups[0].first).toBe(false);
    expect(rows[2].groups[0].first).toBe(true);
  });

  it('sets correct span values', () => {
    const g = { id: 'g' };
    const rows = [frRecompute(g, 'a'), frRecompute(g, 'b'), frRecompute(g, 'c')];
    recomputeFlatRowGroups(rows, 1);
    expect(rows[0].groups[0].span).toBe(3);
    expect(rows[1].groups[0].span).toBe(3);
    expect(rows[2].groups[0].span).toBe(3);
  });

  it('handles multiple groups independently', () => {
    const g1 = { id: 'g1' };
    const g2 = { id: 'g2' };
    const rows = [frRecompute(g1, 'a'), frRecompute(g2, 'b'), frRecompute(g2, 'c')];
    recomputeFlatRowGroups(rows, 1);
    expect(rows[0].groups[0].span).toBe(1);
    expect(rows[1].groups[0].span).toBe(2);
  });

  it('skips rows with no group at given level', () => {
    const rows = [
      { groups: [], leafElem: { id: 'x' } },
      { groups: [], leafElem: { id: 'y' } },
    ];
    expect(() => recomputeFlatRowGroups(rows, 1)).not.toThrow();
  });
});
