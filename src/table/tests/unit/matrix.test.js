import {
  blankDataItem,
  blankLevel,
  cloneDef,
  createDef,
  isDefReady,
  normalizeDef,
} from '../../js/matrix.js';

// ── blankLevel ────────────────────────────────────────────────────────────────

describe(blankLevel, () => {
  it('has the required shape', () => {
    const l = blankLevel();
    expect(l).toMatchObject({
      elementTypes: [],
      relationItems: [],
      filter: '',
      hidden: false,
    });
  });

  it('returns a new object each call', () => {
    expect(blankLevel()).not.toBe(blankLevel());
  });
});

// ── blankDataItem ─────────────────────────────────────────────────────────────

describe(blankDataItem, () => {
  it('has the required shape', () => {
    const d = blankDataItem();
    expect(d).toMatchObject({
      name: '',
      elementTypes: [],
      relationItems: [],
      filter: '',
      mode: 'count',
      joinSep: ', ',
      emptyValue: '',
    });
  });

  it('has an id string', () => {
    expectTypeOf(blankDataItem().id).toBeString();
  });

  it('returns a new object each call', () => {
    expect(blankDataItem()).not.toBe(blankDataItem());
  });
});

// ── createDef ─────────────────────────────────────────────────────────────────

describe(createDef, () => {
  it('has the required top-level shape', () => {
    const def = createDef();
    expect(def).toMatchObject({
      name: '',
      rowAxis: { levels: [expect.any(Object)] },
      colAxis: { levels: [expect.any(Object)] },
      cells: [expect.any(Object)],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {
        showEmptyRows: false,
        showEmptyCols: false,
        rowSubtotals: false,
        colSubtotals: false,
        rowTotals: false,
        colTotals: false,
      },
    });
  });

  it('accepts an optional name', () => {
    expect(createDef('My Matrix').name).toBe('My Matrix');
  });

  it('has a string id', () => {
    expectTypeOf(createDef().id).toBeString();
  });

  it('produces unique ids', () => {
    expect(createDef().id).not.toBe(createDef().id);
  });
});

// ── cloneDef ──────────────────────────────────────────────────────────────────

describe(cloneDef, () => {
  it('returns a deep copy — modifying clone does not affect original', () => {
    const original = createDef('orig');
    const clone = cloneDef(original);
    clone.rowAxis.levels.push(blankLevel());
    expect(original.rowAxis.levels).toHaveLength(1);
  });

  it('assigns a new id', () => {
    const original = createDef();
    expect(cloneDef(original).id).not.toBe(original.id);
  });

  it('preserves name when newName is not supplied', () => {
    const original = createDef('original');
    expect(cloneDef(original).name).toBe('original');
  });

  it('sets new name when supplied', () => {
    const original = createDef('original');
    expect(cloneDef(original, 'copy').name).toBe('copy');
  });
});

// ── isDefReady ────────────────────────────────────────────────────────────────

describe(isDefReady, () => {
  it('returns false for null / undefined', () => {
    expect(isDefReady()).toBe(false);
  });

  it('returns false when both axes are empty', () => {
    expect(isDefReady(createDef())).toBe(false);
  });

  it('returns true when rowAxis has elementTypes', () => {
    const def = createDef();
    def.rowAxis.levels[0].elementTypes = ['Component'];
    expect(isDefReady(def)).toBe(true);
  });

  it('returns true when colAxis has relationItems', () => {
    const def = createDef();
    def.colAxis.levels[0].relationItems = [{ type: 'Flow', dir: 'out' }];
    expect(isDefReady(def)).toBe(true);
  });

  it('returns false when levels exist but all are empty', () => {
    const def = createDef();
    def.rowAxis.levels = [blankLevel(), blankLevel()];
    expect(isDefReady(def)).toBe(false);
  });
});

// ── normalizeDef ──────────────────────────────────────────────────────────────

describe(normalizeDef, () => {
  it('returns undefined for null / undefined input', () => {
    expect(normalizeDef()).toBeUndefined();
  });

  it('is a no-op on an already-current def', () => {
    const def = createDef('test');
    def.rowAxis.levels[0].elementTypes = ['A'];
    const result = normalizeDef(def);
    expect(result).toBe(def);
    expect(result.rowAxis.levels[0].elementTypes).toStrictEqual(['A']);
  });

  it('injects a settings object when absent', () => {
    const def = createDef();
    delete def.settings;
    expect(normalizeDef(def).settings).toStrictEqual({});
  });

  // ── Format 1: top-level rowLevels / colLevels ──────────────────────────────

  it('migrates format-1 rowLevels/colLevels to rowAxis/colAxis', () => {
    const def = {
      id: 'x',
      name: '',
      rowLevels: [{ elementTypes: ['Component'], filter: '' }],
      colLevels: [{ elementTypes: ['Service'], filter: '' }],
      cells: [],
    };
    const result = normalizeDef(def);
    expect(result.rowAxis).toBeDefined();
    expect(result.colAxis).toBeDefined();
    expect(result.rowLevels).toBeUndefined();
    expect(result.colLevels).toBeUndefined();
  });

  // ── Format 2: kind-based levels ───────────────────────────────────────────

  it('migrates format-2 kind=object levels to new format', () => {
    const def = {
      id: 'x',
      name: '',
      rowAxis: {
        levels: [{ kind: 'object', elementTypes: ['App'], filter: '' }],
      },
      colAxis: { levels: [] },
      cells: [],
    };
    const result = normalizeDef(def);
    expect(result.rowAxis.levels[0].relationItems).toStrictEqual([]);
    expect(result.rowAxis.levels[0].elementTypes).toStrictEqual(['App']);
  });

  it('merges format-2 relation level into the following object level', () => {
    const def = {
      id: 'x',
      name: '',
      rowAxis: {
        levels: [
          { kind: 'object', elementTypes: ['App'], filter: '' },
          { kind: 'relation', relationTypes: ['Flow'], direction: 'outgoing' },
          { kind: 'object', elementTypes: ['Service'], filter: '' },
        ],
      },
      colAxis: { levels: [] },
      cells: [],
    };
    const result = normalizeDef(def);
    expect(result.rowAxis.levels).toHaveLength(2);
    expect(result.rowAxis.levels[1].relationItems).toStrictEqual([{ type: 'Flow', dir: 'out' }]);
    expect(result.rowAxis.levels[1].elementTypes).toStrictEqual(['Service']);
  });

  it('converts relation direction=both to two items', () => {
    const def = {
      id: 'x',
      name: '',
      rowAxis: {
        levels: [
          { kind: 'object', elementTypes: ['App'], filter: '' },
          { kind: 'relation', relationTypes: ['Flow'], direction: 'both' },
          { kind: 'object', elementTypes: ['Service'], filter: '' },
        ],
      },
      colAxis: { levels: [] },
      cells: [],
    };
    const result = normalizeDef(def);
    expect(result.rowAxis.levels[1].relationItems).toStrictEqual([
      { type: 'Flow', dir: 'out' },
      { type: 'Flow', dir: 'in' },
    ]);
  });

  // ── Format 3: legacy def.cell → def.cells[0] ─────────────────────────────

  it('migrates format-3 single cell to cells array', () => {
    const def = {
      id: 'x',
      name: '',
      rowAxis: { levels: [] },
      colAxis: { levels: [] },
      cell: { relTypes: ['Flow'], direction: 'row_col', mode: 'count' },
    };
    const result = normalizeDef(def);
    expect(Array.isArray(result.cells)).toBe(true);
    expect(result.cells[0].relationItems).toStrictEqual([{ type: 'Flow', dir: 'out' }]);
    expect(result.cell).toBeUndefined();
  });

  it('migrates direction=col_row to dir=in', () => {
    const def = {
      id: 'x',
      name: '',
      rowAxis: { levels: [] },
      colAxis: { levels: [] },
      cell: { relTypes: ['Flow'], direction: 'col_row', mode: 'count' },
    };
    const result = normalizeDef(def);
    expect(result.cells[0].relationItems).toStrictEqual([{ type: 'Flow', dir: 'in' }]);
  });

  it('inserts a blank cells array when cells is absent', () => {
    const def = {
      id: 'x',
      name: '',
      rowAxis: { levels: [] },
      colAxis: { levels: [] },
    };
    const result = normalizeDef(def);
    expect(Array.isArray(result.cells)).toBe(true);
    expect(result.cells).toHaveLength(1);
  });
});
