import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import {
  computeVisRelCounts,
  getActiveElemTypes,
  getActiveRelTypes,
  getElemTypeTotals,
  getRelTypeTotals,
  initializeFilterService,
  setActiveElemTypes,
  setActiveRelTypes,
  setAllElemTypes,
  setAllRelTypes,
  setElemTypeTotals,
  setFilterTypes,
  setRelTypeTotals,
  setScopeElemCounts,
  setVisRelCounts,
  scopeElemCounts,
  toggleElemType,
  toggleRelType,
  visRelCounts,
} from '../../js/filter/service.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function elem(id, type) {
  return { id, type };
}
function rel(id, type, source, target) {
  return { id, type, source, target };
}

const sampleElements = [
  elem('a', 'Actor'),
  elem('b', 'Actor'),
  elem('c', 'System'),
  elem('d', 'DB'),
];
const sampleRelations = [
  rel('r1', 'Uses', 'a', 'c'),
  rel('r2', 'Uses', 'b', 'c'),
  rel('r3', 'Reads', 'c', 'd'),
];

// Reset module state before each test to avoid leakage between cases.
beforeEach(() => {
  initializeFilterService(sampleElements, sampleRelations);
});

afterEach(() => {
  setScopeElemCounts(undefined);
  setVisRelCounts(undefined);
});

// ── initializeFilterService ──────────────────────────────────────────────────

describe(initializeFilterService, () => {
  it('populates element type totals from the model', () => {
    expect(getElemTypeTotals()).toStrictEqual({ Actor: 2, System: 1, DB: 1 });
  });

  it('populates relationship type totals from the model', () => {
    expect(getRelTypeTotals()).toStrictEqual({ Uses: 2, Reads: 1 });
  });

  it('activates every element type by default', () => {
    expect(getActiveElemTypes()).toStrictEqual(new Set(['Actor', 'System', 'DB']));
  });

  it('activates every relationship type by default', () => {
    expect(getActiveRelTypes()).toStrictEqual(new Set(['Uses', 'Reads']));
  });
});

// ── getActiveElemTypes / getActiveRelTypes ───────────────────────────────────

describe('getActiveElemTypes / getActiveRelTypes', () => {
  it('returns a fresh copy each call (caller cannot mutate internal state)', () => {
    const first = getActiveElemTypes();
    first.delete('Actor');
    // Internal state must be unaffected.
    expect(getActiveElemTypes().has('Actor')).toBe(true);
  });

  it('relation copy is independent too', () => {
    const r = getActiveRelTypes();
    r.add('Bogus');
    expect(getActiveRelTypes().has('Bogus')).toBe(false);
  });
});

// ── toggleElemType / toggleRelType ───────────────────────────────────────────

describe(toggleElemType, () => {
  it('returns false and removes type when previously active', () => {
    expect(toggleElemType('Actor')).toBe(false);
    expect(getActiveElemTypes().has('Actor')).toBe(false);
  });

  it('returns true and adds type when previously inactive', () => {
    toggleElemType('Actor'); // Remove
    expect(toggleElemType('Actor')).toBe(true); // Add back
    expect(getActiveElemTypes().has('Actor')).toBe(true);
  });

  it('does not affect other types', () => {
    toggleElemType('Actor');
    expect(getActiveElemTypes()).toStrictEqual(new Set(['System', 'DB']));
  });
});

describe(toggleRelType, () => {
  it('toggles a relation type off then back on', () => {
    expect(toggleRelType('Uses')).toBe(false);
    expect(getActiveRelTypes().has('Uses')).toBe(false);
    expect(toggleRelType('Uses')).toBe(true);
    expect(getActiveRelTypes().has('Uses')).toBe(true);
  });
});

// ── setAllElemTypes / setAllRelTypes ─────────────────────────────────────────

describe(setAllElemTypes, () => {
  it('true → activates every type in the full-model registry', () => {
    setActiveElemTypes(new Set()); // Clear first
    setAllElemTypes(true);
    expect(getActiveElemTypes()).toStrictEqual(new Set(['Actor', 'System', 'DB']));
  });

  it('false → empties the active set', () => {
    setAllElemTypes(false);
    expect(getActiveElemTypes().size).toBe(0);
  });
});

describe(setAllRelTypes, () => {
  it('true → activates every relation type', () => {
    setActiveRelTypes(new Set());
    setAllRelTypes(true);
    expect(getActiveRelTypes()).toStrictEqual(new Set(['Uses', 'Reads']));
  });

  it('false → empties the active relation set', () => {
    setAllRelTypes(false);
    expect(getActiveRelTypes().size).toBe(0);
  });
});

// ── setActiveElemTypes / setActiveRelTypes ───────────────────────────────────

describe(setActiveElemTypes, () => {
  it('accepts a Set', () => {
    setActiveElemTypes(new Set(['Actor']));
    expect(getActiveElemTypes()).toStrictEqual(new Set(['Actor']));
  });

  it('accepts an array (converts to Set)', () => {
    setActiveElemTypes(['Actor', 'DB']);
    expect(getActiveElemTypes()).toStrictEqual(new Set(['Actor', 'DB']));
  });

  it('overwrites the previous value (not additive)', () => {
    setActiveElemTypes(['Actor']);
    setActiveElemTypes(['System']);
    expect(getActiveElemTypes()).toStrictEqual(new Set(['System']));
  });
});

describe(setActiveRelTypes, () => {
  it('accepts an array', () => {
    setActiveRelTypes(['Reads']);
    expect(getActiveRelTypes()).toStrictEqual(new Set(['Reads']));
  });

  it('accepts a Set', () => {
    setActiveRelTypes(new Set(['Uses']));
    expect(getActiveRelTypes()).toStrictEqual(new Set(['Uses']));
  });
});

// ── setFilterTypes ───────────────────────────────────────────────────────────

describe(setFilterTypes, () => {
  it('sets both element and relation types when both provided', () => {
    setFilterTypes(['Actor'], ['Uses']);
    expect(getActiveElemTypes()).toStrictEqual(new Set(['Actor']));
    expect(getActiveRelTypes()).toStrictEqual(new Set(['Uses']));
  });

  it('leaves elem types untouched when first argument is undefined', () => {
    const before = getActiveElemTypes();
    setFilterTypes(undefined, ['Uses']);
    expect(getActiveElemTypes()).toStrictEqual(before);
    expect(getActiveRelTypes()).toStrictEqual(new Set(['Uses']));
  });

  it('leaves rel types untouched when second argument is undefined', () => {
    const before = getActiveRelTypes();
    setFilterTypes(['Actor'], undefined);
    expect(getActiveElemTypes()).toStrictEqual(new Set(['Actor']));
    expect(getActiveRelTypes()).toStrictEqual(before);
  });

  it('both undefined → no-op (neither set changes)', () => {
    const beforeE = getActiveElemTypes();
    const beforeR = getActiveRelTypes();
    setFilterTypes(undefined, undefined);
    expect(getActiveElemTypes()).toStrictEqual(beforeE);
    expect(getActiveRelTypes()).toStrictEqual(beforeR);
  });

  it('treats empty array differently from undefined (empty array clears the set)', () => {
    setFilterTypes([], []);
    expect(getActiveElemTypes().size).toBe(0);
    expect(getActiveRelTypes().size).toBe(0);
  });
});

// ── setElemTypeTotals / setRelTypeTotals ─────────────────────────────────────

describe('setElemTypeTotals / setRelTypeTotals', () => {
  it('display totals can be switched independently of the full-model registry', () => {
    setElemTypeTotals({ Actor: 99 });
    expect(getElemTypeTotals()).toStrictEqual({ Actor: 99 });
    setRelTypeTotals({ Uses: 7 });
    expect(getRelTypeTotals()).toStrictEqual({ Uses: 7 });
  });

  it('changing display totals does NOT affect what setAllElemTypes selects', () => {
    setElemTypeTotals({ Foo: 1 });
    setActiveElemTypes(new Set());
    setAllElemTypes(true);
    // Even though display totals changed, the registry still tracks the model's types.
    expect(getActiveElemTypes()).toStrictEqual(new Set(['Actor', 'System', 'DB']));
  });
});

// ── scopeElemCounts / visRelCounts signals ───────────────────────────────────

describe('scopeElemCounts / visRelCounts', () => {
  it('scope counts default to undefined (drill mode off)', () => {
    setScopeElemCounts(undefined);
    expect(scopeElemCounts.value).toBeUndefined();
  });

  it('scope counts reflect last set value', () => {
    setScopeElemCounts({ Actor: 2 });
    expect(scopeElemCounts.value).toStrictEqual({ Actor: 2 });
  });

  it('visRel counts reflect last set value', () => {
    setVisRelCounts({ Uses: 1 });
    expect(visRelCounts.value).toStrictEqual({ Uses: 1 });
  });
});

// ── computeVisRelCounts edge case: elemMap entry without type ────────────────

describe('computeVisRelCounts — endpoint without `type` field', () => {
  it('skips relations whose endpoint has no resolved type', () => {
    // Pins the `srcType && tgtType` guard.
    const elemMap = new Map([
      ['a', { id: 'a', type: 'Actor' }],
      ['b', { id: 'b' /* no type */ }],
    ]);
    const counts = computeVisRelCounts({
      allRelations: [rel('r1', 'Uses', 'a', 'b')],
      elemMap,
      activeElemTypes: new Set(['Actor']),
      drillVisibleIds: undefined,
    });
    expect(counts).toStrictEqual({});
  });
});
