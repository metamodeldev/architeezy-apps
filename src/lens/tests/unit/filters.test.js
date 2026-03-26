import { computeFilterCounts } from '../../js/filters.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function elem(id, type) {
  return { id, type };
}

function rel(id, type, source, target) {
  return { id, type, source, target };
}

// ── element type counting ─────────────────────────────────────────────────────

describe('computeFilterCounts — element types', () => {
  it('counts each element type', () => {
    const elements = [elem('a', 'Actor'), elem('b', 'Actor'), elem('c', 'System')];
    const { elemTypeTotals } = computeFilterCounts(elements, []);
    expect(elemTypeTotals).toStrictEqual({ Actor: 2, System: 1 });
  });

  it('returns empty object when there are no elements', () => {
    const { elemTypeTotals } = computeFilterCounts([], []);
    expect(elemTypeTotals).toStrictEqual({});
  });

  it('handles a single element', () => {
    const { elemTypeTotals } = computeFilterCounts([elem('x', 'Widget')], []);
    expect(elemTypeTotals).toStrictEqual({ Widget: 1 });
  });
});

// ── relation type counting ────────────────────────────────────────────────────

describe('computeFilterCounts — relation types', () => {
  it('counts relation types when both endpoints are graph node IDs', () => {
    const elements = [elem('a', 'Actor'), elem('b', 'System')];
    const relations = [rel('r1', 'Flow', 'a', 'b'), rel('r2', 'Flow', 'b', 'a')];
    const { relTypeTotals } = computeFilterCounts(elements, relations);
    expect(relTypeTotals).toStrictEqual({ Flow: 2 });
  });

  it('excludes relations whose source is not a graph node', () => {
    const elements = [elem('a', 'Actor')];
    const relations = [rel('r1', 'Flow', 'UNKNOWN', 'a')];
    const { relTypeTotals } = computeFilterCounts(elements, relations);
    expect(relTypeTotals).toStrictEqual({});
  });

  it('excludes relations whose target is not a graph node', () => {
    const elements = [elem('a', 'Actor')];
    const relations = [rel('r1', 'Flow', 'a', 'UNKNOWN')];
    const { relTypeTotals } = computeFilterCounts(elements, relations);
    expect(relTypeTotals).toStrictEqual({});
  });

  it('excludes relations where both endpoints are missing', () => {
    const relations = [rel('r1', 'Flow', 'x', 'y')];
    const { relTypeTotals } = computeFilterCounts([], relations);
    expect(relTypeTotals).toStrictEqual({});
  });

  it('counts multiple relation types independently', () => {
    const elements = [elem('a', 'Actor'), elem('b', 'System'), elem('c', 'DB')];
    const relations = [
      rel('r1', 'Uses', 'a', 'b'),
      rel('r2', 'Uses', 'b', 'c'),
      rel('r3', 'Dep', 'a', 'c'),
    ];
    const { relTypeTotals } = computeFilterCounts(elements, relations);
    expect(relTypeTotals).toStrictEqual({ Uses: 2, Dep: 1 });
  });

  it('returns empty object when there are no relations', () => {
    const elements = [elem('a', 'Actor')];
    const { relTypeTotals } = computeFilterCounts(elements, []);
    expect(relTypeTotals).toStrictEqual({});
  });
});

// ── combined / independence ───────────────────────────────────────────────────

describe('computeFilterCounts — combined', () => {
  it('elem and rel counts are independent (one missing endpoint does not affect elem count)', () => {
    const elements = [elem('a', 'Actor'), elem('b', 'System')];
    const relations = [
      rel('r1', 'Flow', 'a', 'b'), // Valid
      rel('r2', 'Ghost', 'a', 'MISSING'), // Invalid — should not appear in relTypeTotals
    ];
    const { elemTypeTotals, relTypeTotals } = computeFilterCounts(elements, relations);
    expect(elemTypeTotals).toStrictEqual({ Actor: 1, System: 1 });
    expect(relTypeTotals).toStrictEqual({ Flow: 1 });
  });

  it('does not mutate the input arrays', () => {
    const elements = [elem('a', 'Actor')];
    const relations = [rel('r1', 'Flow', 'a', 'a')];
    const elemsBefore = JSON.stringify(elements);
    const relsBefore = JSON.stringify(relations);
    computeFilterCounts(elements, relations);
    expect(JSON.stringify(elements)).toBe(elemsBefore);
    expect(JSON.stringify(relations)).toBe(relsBefore);
  });

  it('returns fresh objects on each call', () => {
    const elements = [elem('a', 'Actor')];
    const a = computeFilterCounts(elements, []);
    const b = computeFilterCounts(elements, []);
    expect(a.elemTypeTotals).not.toBe(b.elemTypeTotals);
  });
});
