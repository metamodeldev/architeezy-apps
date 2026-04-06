import { describe, expect, it } from 'bun:test';

import { buildTable } from '../../js/export.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function flatRow(leafName, ...groupDefs) {
  // GroupDefs: [{name, first, span}, ...]
  return {
    groups: groupDefs.map(({ name, first = true, span = 1 }) => ({
      elem: { name },
      first,
      span,
    })),
    leafElem: { name: leafName },
  };
}

function flatCol(leafName, ...groupDefs) {
  return flatRow(leafName, ...groupDefs);
}

// ── no groups on either axis ──────────────────────────────────────────────────

describe('buildTable — flat (no groups)', () => {
  it('produces a single header row + data rows', () => {
    const result = {
      rowAxis: { numGroupLevels: 0, flatRows: [flatRow('R1'), flatRow('R2')] },
      colAxis: { numGroupLevels: 0, flatRows: [flatCol('C1'), flatCol('C2')] },
      grid: [
        ['1', ''],
        ['', '2'],
      ],
    };
    const table = buildTable(result);
    expect(table).toStrictEqual([
      ['', 'C1', 'C2'], // Single col header row (leaf names)
      ['R1', '1', ''], // Row 0
      ['R2', '', '2'], // Row 1
    ]);
  });

  it('handles a single cell matrix', () => {
    const result = {
      rowAxis: { numGroupLevels: 0, flatRows: [flatRow('R')] },
      colAxis: { numGroupLevels: 0, flatRows: [flatCol('C')] },
      grid: [['42']],
    };
    expect(buildTable(result)).toStrictEqual([
      ['', 'C'],
      ['R', '42'],
    ]);
  });

  it('handles empty grid values as empty strings', () => {
    const result = {
      rowAxis: { numGroupLevels: 0, flatRows: [flatRow('R')] },
      colAxis: { numGroupLevels: 0, flatRows: [flatCol('C')] },
      grid: [[undefined]],
    };
    expect(buildTable(result)[1][1]).toBe('');
  });
});

// ── row groups ────────────────────────────────────────────────────────────────

describe('buildTable — row groups', () => {
  it('emits group name only for the first row of each group', () => {
    const g = { name: 'Group A' };
    const result = {
      rowAxis: {
        numGroupLevels: 1,
        flatRows: [
          flatRow('Leaf 1', { ...g, first: true, span: 2 }),
          flatRow('Leaf 2', { ...g, first: false, span: 2 }),
        ],
      },
      colAxis: { numGroupLevels: 0, flatRows: [flatCol('C')] },
      grid: [['1'], ['2']],
    };
    const table = buildTable(result);
    // Col header row: 2 left-pad cells (group + leaf), then col name
    expect(table[0]).toStrictEqual(['', '', 'C']);
    // First data row: group name, leaf name, value
    expect(table[1]).toStrictEqual(['Group A', 'Leaf 1', '1']);
    // Second data row: blank for group (not first), leaf name, value
    expect(table[2]).toStrictEqual(['', 'Leaf 2', '2']);
  });
});

// ── col groups ────────────────────────────────────────────────────────────────

describe('buildTable — col groups', () => {
  it('emits group name only for the first col of each group', () => {
    const g = { name: 'Group B' };
    const result = {
      rowAxis: { numGroupLevels: 0, flatRows: [flatRow('R')] },
      colAxis: {
        numGroupLevels: 1,
        flatRows: [
          flatCol('C1', { ...g, first: true, span: 2 }),
          flatCol('C2', { ...g, first: false, span: 2 }),
        ],
      },
      grid: [['a', 'b']],
    };
    const table = buildTable(result);
    // Group header row: 1 left-pad cell, then group name for first col, blank for second
    expect(table[0]).toStrictEqual(['', 'Group B', '']);
    // Leaf header row: 1 left-pad cell, then leaf col names
    expect(table[1]).toStrictEqual(['', 'C1', 'C2']);
    // Data row
    expect(table[2]).toStrictEqual(['R', 'a', 'b']);
  });
});

// ── groups on both axes ───────────────────────────────────────────────────────

describe('buildTable — groups on both axes', () => {
  it('produces correct header and data layout', () => {
    const rg = { name: 'RowGroup' };
    const cg = { name: 'ColGroup' };
    const result = {
      rowAxis: {
        numGroupLevels: 1,
        flatRows: [
          flatRow('Leaf R1', { ...rg, first: true, span: 2 }),
          flatRow('Leaf R2', { ...rg, first: false, span: 2 }),
        ],
      },
      colAxis: {
        numGroupLevels: 1,
        flatRows: [
          flatCol('Leaf C1', { ...cg, first: true, span: 2 }),
          flatCol('Leaf C2', { ...cg, first: false, span: 2 }),
        ],
      },
      grid: [
        ['1', '2'],
        ['3', '4'],
      ],
    };
    const table = buildTable(result);
    // Col group header row: 2 left-pad cells (row-group + row-leaf columns), col group names
    expect(table[0]).toStrictEqual(['', '', 'ColGroup', '']);
    // Col leaf header row
    expect(table[1]).toStrictEqual(['', '', 'Leaf C1', 'Leaf C2']);
    // Data row 1
    expect(table[2]).toStrictEqual(['RowGroup', 'Leaf R1', '1', '2']);
    // Data row 2 — group col blank
    expect(table[3]).toStrictEqual(['', 'Leaf R2', '3', '4']);
  });
});
