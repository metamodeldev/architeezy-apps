import { buildCompactDisplayRows } from '../../js/compact.js';
import { computeMatrix } from '../../js/compute-matrix.js';
import { state } from '../../js/state.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function elem(id, type, name, parent) {
  return { id, type, name: name ?? type, parent: parent ?? undefined };
}

function rel(id, type, source, target, name) {
  return { id, type, source, target, name: name ?? '' };
}

function level(elementTypes = [], relationItems = []) {
  return { elementTypes, relationItems, filter: '', hidden: false };
}

function dataItem(overrides = {}) {
  return {
    id: 'di1',
    name: '',
    elementTypes: [],
    relationItems: [],
    filter: '',
    mode: 'count',
    joinSep: ', ',
    emptyValue: '',
    ...overrides,
  };
}

function setupState(elements, relations) {
  state.allElements = elements;
  state.allRelations = relations;
  state.elemMap = Object.fromEntries(elements.map((e) => [e.id, e]));
}

// ── computeMatrix — integration ───────────────────────────────────────────────

describe(computeMatrix, () => {
  // ── empty / trivial ──────────────────────────────────────────────────────

  it('returns empty axes when def has no configured levels', () => {
    setupState([], []);
    const def = {
      id: 'x',
      rowAxis: { levels: [level()] },
      colAxis: { levels: [level()] },
      cells: [],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {},
    };
    const result = computeMatrix(def);
    expect(result.rowAxis.flatRows).toHaveLength(0);
    expect(result.colAxis.flatRows).toHaveLength(0);
  });

  // ── rows-only axis ───────────────────────────────────────────────────────

  it('builds row axis with elements of specified type', () => {
    setupState(
      [
        elem('e1', 'Component', 'Comp A'),
        elem('e2', 'Component', 'Comp B'),
        elem('e3', 'Service', 'Svc'),
      ],
      [],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Component'])] },
      colAxis: { levels: [level()] },
      cells: [],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {},
    };
    const result = computeMatrix(def);
    expect(result.rowAxis.flatRows).toHaveLength(2);
    expect(result.rowAxis.flatRows.map((r) => r.leafElem.name)).toStrictEqual(['Comp A', 'Comp B']);
  });

  // ── two-axis, no data items (rows × cols) ────────────────────────────────

  it('builds a grid of empty strings when no data items configured', () => {
    setupState([elem('r1', 'Row', 'R1'), elem('c1', 'Col', 'C1')], []);
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Row'])] },
      colAxis: { levels: [level(['Col'])] },
      cells: [],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {},
    };
    const result = computeMatrix(def);
    expect(result.grid).toStrictEqual([['']]);
  });

  // ── Element × Element with relation data item ────────────────────────────

  it('counts relations between row and col elements', () => {
    setupState(
      [elem('a', 'Component', 'A'), elem('b', 'Component', 'B'), elem('c', 'Component', 'C')],
      [rel('r1', 'Flow', 'a', 'b'), rel('r2', 'Flow', 'a', 'b'), rel('r3', 'Flow', 'b', 'c')],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Component'])] },
      colAxis: { levels: [level(['Component'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {},
    };
    const result = computeMatrix(def);
    // Rows: A, B, C; cols: A, B, C
    const rowIds = result.rowAxis.flatRows.map((r) => r.leafElem.id);
    const colIds = result.colAxis.flatRows.map((r) => r.leafElem.id);
    function ri(id) {
      return rowIds.indexOf(id);
    }
    function ci(id) {
      return colIds.indexOf(id);
    }
    expect(result.grid[ri('a')][ci('b')]).toBe('2'); // Two A→B relations
    expect(result.grid[ri('b')][ci('c')]).toBe('1'); // One B→C
    expect(result.grid[ri('a')][ci('c')]).toBe(''); // No A→C
  });

  it('shows relation names in names mode', () => {
    setupState(
      [elem('a', 'Comp', 'A'), elem('b', 'Comp', 'B')],
      [rel('r1', 'Flow', 'a', 'b', 'My Flow')],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'names',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {},
    };
    const result = computeMatrix(def);
    const rowIds = result.rowAxis.flatRows.map((r) => r.leafElem.id);
    const colIds = result.colAxis.flatRows.map((r) => r.leafElem.id);
    expect(result.grid[rowIds.indexOf('a')][colIds.indexOf('b')]).toBe('My Flow');
  });

  // ── showEmptyRows ────────────────────────────────────────────────────────

  it('hides empty rows when showEmptyRows=false (default)', () => {
    setupState([elem('a', 'Comp', 'A'), elem('b', 'Comp', 'B')], [rel('r1', 'Flow', 'a', 'b')]);
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [dataItem({ id: 'di1', relationItems: [{ type: 'Flow', dir: 'out' }] })],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { showEmptyRows: false, showEmptyCols: false },
    };
    const result = computeMatrix(def);
    // B has no outgoing flows, so it should be removed as a row
    const rowIds = result.rowAxis.flatRows.map((r) => r.leafElem.id);
    expect(rowIds).toContain('a');
    expect(rowIds).not.toContain('b');
  });

  it('keeps all rows when showEmptyRows=true', () => {
    setupState([elem('a', 'Comp', 'A'), elem('b', 'Comp', 'B')], [rel('r1', 'Flow', 'a', 'b')]);
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [dataItem({ id: 'di1', relationItems: [{ type: 'Flow', dir: 'out' }] })],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { showEmptyRows: true, showEmptyCols: false },
    };
    const result = computeMatrix(def);
    expect(result.rowAxis.flatRows).toHaveLength(2);
  });

  // ── multi-level axis ─────────────────────────────────────────────────────

  it('builds two-level axis with group and leaf', () => {
    setupState(
      [
        elem('grp', 'Layer', 'Layer1'),
        elem('c1', 'Comp', 'C1', 'grp'),
        elem('c2', 'Comp', 'C2', 'grp'),
      ],
      [],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level()] },
      cells: [],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {},
    };
    const result = computeMatrix(def);
    expect(result.rowAxis.numGroupLevels).toBe(1);
    expect(result.rowAxis.flatRows).toHaveLength(2);
    expect(result.rowAxis.flatRows[0].groups[0].elem.id).toBe('grp');
    expect(result.rowAxis.flatRows[0].groups[0].first).toBe(true);
    expect(result.rowAxis.flatRows[0].groups[0].span).toBe(2);
  });

  it('builds two-level axis: second row group is not first', () => {
    setupState(
      [
        elem('grp', 'Layer', 'Layer1'),
        elem('c1', 'Comp', 'C1', 'grp'),
        elem('c2', 'Comp', 'C2', 'grp'),
      ],
      [],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level()] },
      cells: [],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {},
    };
    const result = computeMatrix(def);
    expect(result.rowAxis.flatRows[1].groups[0].first).toBe(false);
  });

  // ── subtotals include group element's own data ───────────────────────────

  it('subtotal includes group element own relations, not just leaf aggregation', () => {
    setupState(
      [
        elem('grp', 'Layer', 'Layer1'),
        elem('leaf', 'Comp', 'C1', 'grp'),
        elem('target', 'Comp', 'Target'),
      ],
      [
        rel('r1', 'Flow', 'grp', 'target'), // Group element has a relation
        rel('r2', 'Flow', 'leaf', 'target'), // Leaf element has a relation
      ],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowSubtotals: true },
    };
    const result = computeMatrix(def);
    const subRow = result.rowAxis.flatRows.find((r) => r.leafElem._isSubtotal);
    const colIdx = result.colAxis.flatRows.findIndex((c) => c.leafElem.id === 'target');
    const subRowIdx = result.rowAxis.flatRows.indexOf(subRow);
    // Subtotal = group(1) + leaf(1) = 2
    expect(result.grid[subRowIdx][colIdx]).toBe('2');
  });

  // ── subtotals: group visible when only group element has data (no leaf data) ─

  it('group with subtotals is shown when only the group element has data (no leaf relations)', () => {
    setupState(
      [
        elem('grp', 'Layer', 'Layer1'),
        elem('leaf', 'Comp', 'C1', 'grp'),
        elem('target', 'Comp', 'Target'),
      ],
      [rel('r1', 'Flow', 'grp', 'target')], // Only group element has a relation
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowSubtotals: true },
    };
    const result = computeMatrix(def);
    // The leaf row (C1) has no data but must be kept because its group (Layer1) has data.
    const leafRow = result.rowAxis.flatRows.find((r) => r.leafElem.id === 'leaf');
    expect(leafRow).toBeDefined();
    // The subtotal row must exist and show the group element's relation count.
    const subRow = result.rowAxis.flatRows.find((r) => r.leafElem._isSubtotal);
    expect(subRow).toBeDefined();
    const colIdx = result.colAxis.flatRows.findIndex((c) => c.leafElem.id === 'target');
    expect(colIdx).toBeGreaterThanOrEqual(0);
    const subRowIdx = result.rowAxis.flatRows.indexOf(subRow);
    expect(result.grid[subRowIdx][colIdx]).toBe('1');
  });

  it('column is kept when row group element has data with it even if all leaf cells are empty', () => {
    setupState(
      [
        elem('grp', 'Layer', 'Layer1'),
        elem('leaf', 'Comp', 'C1', 'grp'),
        elem('target', 'Comp', 'Target'),
      ],
      [rel('r1', 'Flow', 'grp', 'target')],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowSubtotals: true },
    };
    const result = computeMatrix(def);
    const colIdx = result.colAxis.flatRows.findIndex((c) => c.leafElem.id === 'target');
    expect(colIdx).toBeGreaterThanOrEqual(0);
  });

  // ── rows_data mode ───────────────────────────────────────────────────────

  it('rows_data mode: data item becomes col axis', () => {
    setupState([elem('a', 'Comp', 'A'), elem('b', 'Comp', 'B')], [rel('r1', 'Flow', 'a', 'b')]);
    const di = dataItem({
      id: 'di1',
      relationItems: [{ type: 'Flow', dir: 'out' }],
      mode: 'count',
    });
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Comp'])] },
      colAxis: { levels: [level()] },
      cells: [di],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { showEmptyRows: true, showEmptyCols: true },
    };
    const result = computeMatrix(def);
    // Data item axis goes to cols when only rows + cells are configured
    expect(result.colAxis.flatRows[0].leafElem._isDataItem).toBe(true);
    // Row A has one outgoing Flow relation
    const rowA = result.rowAxis.flatRows.find((r) => r.leafElem.id === 'a');
    const rowAIdx = result.rowAxis.flatRows.indexOf(rowA);
    expect(result.grid[rowAIdx][0]).toBe('1');
  });

  // ── qualIdx ──────────────────────────────────────────────────────────────

  it('populates qualIdx for non-empty cells', () => {
    setupState(
      [elem('a', 'Comp', 'A'), elem('b', 'Comp', 'B')],
      [rel('r1', 'Flow', 'a', 'b', 'R1')],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: {},
    };
    const result = computeMatrix(def);
    const key = `a::b`;
    expect(result.qualIdx.has(key)).toBe(true);
    expect(result.qualIdx.get(key)[0].id).toBe('r1');
  });

  // ── stats ────────────────────────────────────────────────────────────────

  it('stats reflect final grid dimensions', () => {
    setupState([elem('a', 'Comp', 'A'), elem('b', 'Comp', 'B')], [rel('r1', 'Flow', 'a', 'b')]);
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [dataItem({ id: 'di1', relationItems: [{ type: 'Flow', dir: 'out' }] })],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { showEmptyRows: false, showEmptyCols: false },
    };
    const result = computeMatrix(def);
    expect(result.stats.rows).toBe(result.rowAxis.flatRows.length);
    expect(result.stats.cols).toBe(result.colAxis.flatRows.length);
    expect(result.stats.nonEmpty).toBeGreaterThanOrEqual(1);
  });
});

// ── compact form (rowTabular: false) ─────────────────────────────────────────

describe('compact form (rowTabular: false)', () => {
  function setupCompact() {
    setupState(
      [
        elem('grp', 'Layer', 'Layer1'),
        elem('leaf1', 'Comp', 'C1', 'grp'),
        elem('leaf2', 'Comp', 'C2', 'grp'),
        elem('target', 'Comp', 'Target'),
      ],
      [rel('r1', 'Flow', 'grp', 'target'), rel('r2', 'Flow', 'leaf1', 'target')],
    );
  }

  it('preserves numGroupLevels for compact axis (display ordering is done in table.js)', () => {
    setupCompact();
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowTabular: false },
    };
    const result = computeMatrix(def);
    // In the new architecture, numGroupLevels is kept as-is; table.js handles display ordering.
    expect(result.rowAxis.numGroupLevels).toBe(1);
  });

  it('produces subtotal rows with _groupLevel for each group level', () => {
    setupCompact();
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowTabular: false },
    };
    const result = computeMatrix(def);
    const rows = result.rowAxis.flatRows;
    // In compact mode, subtotals are produced at each group level via buildAxisItemsAllLevels.
    // The group subtotal row has _isSubtotal: true and _groupLevel: 0 (for the Layer level).
    const subtotalRows = rows.filter((r) => r.leafElem._isSubtotal);
    const level0Rows = subtotalRows.filter((r) => r.leafElem._groupLevel === 0);
    const groupRow = level0Rows.find((r) => r.leafElem._groupRef?.id === 'grp');
    expect(groupRow).toBeDefined();
    // Leaf rows come before the subtotal in flatRows order (display order is in table.js).
    const groupRowIdx = rows.indexOf(groupRow);
    const nonSubtotalRows = rows.filter((r) => !r.leafElem._isSubtotal);
    const leafRowIdxs = nonSubtotalRows
      .filter((r) => !r.leafElem._isGrandTotal)
      .map((r) => rows.indexOf(r));
    expect(leafRowIdxs.every((i) => i < groupRowIdx)).toBe(true);
  });

  it('group subtotal row carries aggregated data (group element own data + leaf data)', () => {
    setupCompact();
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowTabular: false },
    };
    const result = computeMatrix(def);
    const rows = result.rowAxis.flatRows;
    const colIdx = result.colAxis.flatRows.findIndex((c) => c.leafElem.id === 'target');
    const groupRow = rows
      .filter((r) => r.leafElem._isSubtotal)
      .find((r) => r.leafElem._groupLevel === 0);
    const groupRowIdx = rows.indexOf(groupRow);
    expect(groupRowIdx).toBeGreaterThanOrEqual(0);
    // Grp has r1, leaf1 has r2 → aggregate = 2
    expect(result.grid[groupRowIdx][colIdx]).toBe('2');
  });

  it('group row is shown when only group element has data (no leaf data)', () => {
    setupState(
      [
        elem('grp', 'Layer', 'Layer1'),
        elem('leaf', 'Comp', 'C1', 'grp'),
        elem('target', 'Comp', 'Target'),
      ],
      [rel('r1', 'Flow', 'grp', 'target')],
    );
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowTabular: false },
    };
    const result = computeMatrix(def);
    const rows = result.rowAxis.flatRows;
    const colIdx = result.colAxis.flatRows.findIndex((c) => c.leafElem.id === 'target');
    const groupRow = rows
      .filter((r) => r.leafElem._isSubtotal)
      .find((r) => r.leafElem._groupLevel === 0);
    const groupRowIdx = rows.indexOf(groupRow);
    expect(groupRowIdx).toBeGreaterThanOrEqual(0);
    expect(result.grid[groupRowIdx][colIdx]).toBe('1');
  });

  it('leaf rows show only their own data, not ancestor group data', () => {
    setupCompact();
    // Grp→target (r1), leaf1→target (r2), leaf2 has no relation to target
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowTabular: false },
    };
    const result = computeMatrix(def);
    const rows = result.rowAxis.flatRows;
    const colIdx = result.colAxis.flatRows.findIndex((c) => c.leafElem.id === 'target');
    const leaf1Idx = rows.findIndex((r) => r.leafElem.id === 'leaf1');
    const leaf2Idx = rows.findIndex((r) => r.leafElem.id === 'leaf2');
    // Leaf1 has r2→target (count=1); grp's r1 must NOT appear in the leaf row
    expect(result.grid[leaf1Idx][colIdx]).toBe('1');
    // Leaf2 has no relation to target
    expect(result.grid[leaf2Idx][colIdx]).toBe('');
  });

  it('grand total row is preserved at the end when rowTotals is also enabled', () => {
    setupCompact();
    const def = {
      id: 'x',
      rowAxis: { levels: [level(['Layer']), level(['Comp'])] },
      colAxis: { levels: [level(['Comp'])] },
      cells: [
        dataItem({
          id: 'di1',
          relationItems: [{ type: 'Flow', dir: 'out' }],
          mode: 'count',
        }),
      ],
      rowSort: { by: 'label', dir: 'asc' },
      colSort: { by: 'label', dir: 'asc' },
      settings: { rowTabular: false, rowTotals: true },
    };
    const result = computeMatrix(def);
    const rows = result.rowAxis.flatRows;
    const last = rows[rows.length - 1];
    expect(last.leafElem._isGrandTotal).toBe(true);
  });
});

// ── buildCompactDisplayRows ───────────────────────────────────────────────────

// Helper: build a "real" augmented flatRows as produced by buildAxisItemsAllLevels.
// We construct minimal flatRows manually for predictability.
function makeFlatRows(spec) {
  // Spec is an array of {type, groupElems, id} descriptors
  // Type: 'leaf' | 'subtotal' | 'grandTotal'
  return spec.map((s) => {
    if (s.type === 'grandTotal') {
      return {
        groups: [],
        leafElem: { _isGrandTotal: true, id: '__grand_total__' },
      };
    }
    if (s.type === 'subtotal') {
      return {
        groups: (s.groupElems ?? []).map((e) => ({
          elem: e,
          span: 1,
          first: true,
        })),
        leafElem: {
          _isSubtotal: true,
          id: `sub_${s.id}`,
          _groupRef: s.groupRef,
          _groupLevel: s.groupLevel ?? 0,
        },
      };
    }
    // Leaf
    return {
      groups: (s.groupElems ?? []).map((e) => ({
        elem: e,
        span: 1,
        first: true,
      })),
      leafElem: { id: s.id },
    };
  });
}

describe(buildCompactDisplayRows, () => {
  it('0 group levels → leaf rows in order', () => {
    const flatRows = makeFlatRows([
      { type: 'leaf', id: 'a', groupElems: [] },
      { type: 'leaf', id: 'b', groupElems: [] },
    ]);
    const result = buildCompactDisplayRows(flatRows, 0, () => false);
    expect(result.map((r) => r.origIdx)).toStrictEqual([0, 1]);
    expect(result.every((r) => !r.isGroupHeader)).toBe(true);
    expect(result.every((r) => r.indent === 0)).toBe(true);
  });

  it('1 group level: group header before leaves', () => {
    const g1 = { id: 'g1' };
    // Compact layout order: leaf0, leaf1, subtotal(g1) — processRange emits header first
    const flatRows = makeFlatRows([
      { type: 'leaf', id: 'a', groupElems: [g1] },
      { type: 'leaf', id: 'b', groupElems: [g1] },
      {
        type: 'subtotal',
        id: 'sub1',
        groupRef: g1,
        groupLevel: 0,
        groupElems: [g1],
      },
    ]);
    const result = buildCompactDisplayRows(flatRows, 1, () => false);
    // Header at indent=0, children at indent=1
    const header = result.find((r) => r.isGroupHeader);
    expect(header).toBeDefined();
    expect(header.indent).toBe(0);
    expect(header.origIdx).toBe(2); // Points to subtotal row
    const leaves = result.filter((r) => !r.isGroupHeader);
    expect(leaves.length).toBeGreaterThanOrEqual(2);
    expect(leaves.every((r) => r.indent === 1)).toBe(true);
  });

  it('grand total row appears at end with indent=0 and isGroupHeader=false', () => {
    const g1 = { id: 'g1' };
    const flatRows = makeFlatRows([
      { type: 'leaf', id: 'a', groupElems: [g1] },
      {
        type: 'subtotal',
        id: 's1',
        groupRef: g1,
        groupLevel: 0,
        groupElems: [g1],
      },
      { type: 'grandTotal' },
    ]);
    const result = buildCompactDisplayRows(flatRows, 1, () => false);
    const last = result[result.length - 1];
    expect(flatRows[last.origIdx].leafElem._isGrandTotal).toBe(true);
    expect(last.indent).toBe(0);
    expect(last.isGroupHeader).toBe(false);
  });

  it('group with all-empty leaves → noChildren=true on header', () => {
    const g1 = { id: 'g1' };
    const flatRows = makeFlatRows([
      { type: 'leaf', id: 'a', groupElems: [g1] },
      { type: 'leaf', id: 'b', groupElems: [g1] },
      {
        type: 'subtotal',
        id: 's1',
        groupRef: g1,
        groupLevel: 0,
        groupElems: [g1],
      },
    ]);
    // All leaves are "empty"
    const result = buildCompactDisplayRows(flatRows, 1, (i) => !flatRows[i].leafElem._isSubtotal);
    const header = result.find((r) => r.isGroupHeader);
    expect(header).toBeDefined();
    expect(header.noChildren).toBe(true);
  });

  it('multiple groups at same level each produce a header', () => {
    const g1 = { id: 'g1' };
    const g2 = { id: 'g2' };
    const flatRows = makeFlatRows([
      { type: 'leaf', id: 'a', groupElems: [g1] },
      {
        type: 'subtotal',
        id: 's1',
        groupRef: g1,
        groupLevel: 0,
        groupElems: [g1],
      },
      { type: 'leaf', id: 'b', groupElems: [g2] },
      {
        type: 'subtotal',
        id: 's2',
        groupRef: g2,
        groupLevel: 0,
        groupElems: [g2],
      },
    ]);
    const result = buildCompactDisplayRows(flatRows, 1, () => false);
    const headers = result.filter((r) => r.isGroupHeader);
    expect(headers).toHaveLength(2);
  });

  it('2 group levels: outer header → inner header → leaves', () => {
    const outer = { id: 'outer' };
    const inner = { id: 'inner' };
    const flatRows = makeFlatRows([
      { type: 'leaf', id: 'a', groupElems: [outer, inner] },
      {
        type: 'subtotal',
        id: 'inner_sub',
        groupRef: inner,
        groupLevel: 1,
        groupElems: [outer, inner],
      },
      {
        type: 'subtotal',
        id: 'outer_sub',
        groupRef: outer,
        groupLevel: 0,
        groupElems: [outer],
      },
    ]);
    const result = buildCompactDisplayRows(flatRows, 2, () => false);
    // Outer header at indent=0, inner header at indent=1, leaf at indent=2
    const headers = result.filter((r) => r.isGroupHeader);
    const outerHdr = headers.find((r) => r.indent === 0);
    const innerHdr = headers.find((r) => r.indent === 1);
    expect(outerHdr).toBeDefined();
    expect(innerHdr).toBeDefined();
    const nonHeaders = result.filter((r) => !r.isGroupHeader);
    const leaves = nonHeaders.filter((r) => !flatRows[r.origIdx].leafElem._isGrandTotal);
    expect(leaves.every((r) => r.indent === 2)).toBe(true);
  });
});
