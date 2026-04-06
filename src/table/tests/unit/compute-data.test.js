import { describe, expect, it } from 'bun:test';

import {
  aggregateValues,
  dataItemDisplay,
  resolveDataItemElements,
  resolveDataItemRelations,
} from '../../js/compute-data.js';
import { state } from '../../js/state.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function elem(id, type, name, parent) {
  return { id, type, name: name ?? type, parent: parent ?? undefined };
}

function rel(id, type, source, target, name) {
  return { id, type, source, target, name: name ?? '' };
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

// ── dataItemDisplay ───────────────────────────────────────────────────────────

describe(dataItemDisplay, () => {
  const di = dataItem({ emptyValue: '-' });

  it('returns emptyValue when element list is empty', () => {
    expect(dataItemDisplay(di, [])).toBe('-');
  });

  it('count mode — returns count as string', () => {
    const elements = [
      { name: 'A', id: '1' },
      { name: 'B', id: '2' },
    ];
    expect(dataItemDisplay(dataItem({ mode: 'count' }), elements)).toBe('2');
  });

  it('presence mode — returns ✓ when elements present', () => {
    expect(dataItemDisplay(dataItem({ mode: 'presence' }), [{ name: 'A' }])).toBe('✓');
  });

  it('names mode — returns joined unique names', () => {
    const elements = [
      { name: 'Flow A', id: '1' },
      { name: 'Flow B', id: '2' },
      { name: 'Flow A', id: '3' },
    ];
    expect(dataItemDisplay(dataItem({ mode: 'names', joinSep: ' | ' }), elements)).toBe(
      'Flow A | Flow B',
    );
  });

  it('names mode — uses nodeLabel for elements without explicit name', () => {
    const elements = [{ type: 'Flow', id: '1' }];
    expect(dataItemDisplay(dataItem({ mode: 'names' }), elements)).toBe('Flow');
  });

  it('defaults to count for unknown mode', () => {
    expect(dataItemDisplay(dataItem({ mode: 'unknown' }), [{ name: 'X' }])).toBe('1');
  });
});

// ── aggregateValues ───────────────────────────────────────────────────────────

describe(aggregateValues, () => {
  // Count (default / no dataItem)
  describe('count mode', () => {
    it('sums numeric values', () => {
      expect(aggregateValues(['3', '2', '1'], dataItem({ mode: 'count' }))).toBe('6');
    });

    it('counts non-empty strings when no numeric values', () => {
      expect(aggregateValues(['a', 'b', ''], dataItem({ mode: 'count' }))).toBe('2');
    });

    it('returns empty string when all values are empty', () => {
      expect(aggregateValues(['', '', ''], dataItem({ mode: 'count' }))).toBe('');
    });

    it('works without a dataItem (defaults to count)', () => {
      expect(aggregateValues(['4', '6'])).toBe('10');
    });

    it('handles mixed numeric and non-numeric as numeric sum of numbers only', () => {
      // 'a' is non-numeric so hasNumeric is still false for it, but '3' makes hasNumeric true
      expect(aggregateValues(['3', 'a'], dataItem({ mode: 'count' }))).toBe('3');
    });
  });

  // Presence mode
  describe('presence mode', () => {
    it('returns ✓ when any value is non-empty', () => {
      expect(aggregateValues(['', '✓', ''], dataItem({ mode: 'presence' }))).toBe('✓');
    });

    it('returns empty string when all values are empty', () => {
      expect(aggregateValues(['', ''], dataItem({ mode: 'presence' }))).toBe('');
    });
  });

  // Names mode
  describe('names mode', () => {
    const di = dataItem({ mode: 'names', joinSep: ', ' });

    it('collects and deduplicates names from multiple cells', () => {
      expect(aggregateValues(['A, B', 'B, C'], di)).toBe('A, B, C');
    });

    it('deduplicates across cells', () => {
      expect(aggregateValues(['X', 'X', 'Y'], di)).toBe('X, Y');
    });

    it('returns empty string when all cells are empty', () => {
      expect(aggregateValues(['', ''], di)).toBe('');
    });

    it('trims whitespace around split parts', () => {
      expect(aggregateValues(['  A  ,  B  '], di)).toBe('A, B');
    });

    it('respects custom joinSep when splitting', () => {
      const diPipe = dataItem({ mode: 'names', joinSep: ' | ' });
      expect(aggregateValues(['A | B', 'B | C'], diPipe)).toBe('A | B | C');
    });
  });
});

// ── resolveDataItemElements ───────────────────────────────────────────────────

describe(resolveDataItemElements, () => {
  function setupResolveDataItemElementsState() {
    setupState(
      [
        elem('p', 'Layer', 'Parent'),
        elem('c1', 'Component', 'C1', 'p'),
        elem('c2', 'Component', 'C2', 'p'),
        elem('other', 'Component', 'Other'),
      ],
      [rel('r1', 'Flow', 'p', 'c1'), rel('r2', 'Flow', 'c2', 'p'), rel('r3', 'Uses', 'p', 'other')],
    );
  }

  it('returns empty when parentNode is falsy', () => {
    setupResolveDataItemElementsState();
    expect(resolveDataItemElements(dataItem())).toHaveLength(0);
  });

  it('returns empty when parentNode is a DataItemNode', () => {
    setupResolveDataItemElementsState();
    const di = dataItem({ _isDataItem: true });
    expect(resolveDataItemElements(dataItem(), di)).toHaveLength(0);
  });

  // Element parent — containment fallback

  it('element parent, no relItems: returns direct children matching elementTypes', () => {
    setupResolveDataItemElementsState();
    const di = dataItem({ elementTypes: ['Component'], relationItems: [] });
    const result = resolveDataItemElements(di, state.elemMap['p']);
    expect(result.map((e) => e.id).toSorted()).toStrictEqual(['c1', 'c2'].toSorted());
  });

  it('element parent, no relItems: excludes children not matching type', () => {
    setupResolveDataItemElementsState();
    const di = dataItem({ elementTypes: ['Layer'], relationItems: [] });
    expect(resolveDataItemElements(di, state.elemMap['p'])).toHaveLength(0);
  });

  it('element parent, no relItems, no elementTypes: returns empty', () => {
    setupResolveDataItemElementsState();
    expect(resolveDataItemElements(dataItem(), state.elemMap['p'])).toHaveLength(0);
  });

  // Element parent — via relationItems

  it('element parent + relItems dir=out: returns targets via outgoing relations', () => {
    setupResolveDataItemElementsState();
    const di = dataItem({ relationItems: [{ type: 'Flow', dir: 'out' }] });
    const result = resolveDataItemElements(di, state.elemMap['p']);
    expect(result.map((e) => e.id)).toStrictEqual(['c1']);
  });

  it('element parent + relItems dir=in: returns sources via incoming relations', () => {
    setupResolveDataItemElementsState();
    const di = dataItem({ relationItems: [{ type: 'Flow', dir: 'in' }] });
    const result = resolveDataItemElements(di, state.elemMap['p']);
    expect(result.map((e) => e.id)).toStrictEqual(['c2']);
  });

  it('element parent + relItems + elementTypes: filters results by type', () => {
    setupResolveDataItemElementsState();
    const di = dataItem({
      elementTypes: ['Component'],
      relationItems: [{ type: 'Flow', dir: 'out' }],
    });
    const result = resolveDataItemElements(di, state.elemMap['p']);
    expect(result.map((e) => e.id)).toStrictEqual(['c1']);
  });

  it('element parent + relItems: filter string restricts by name', () => {
    setupResolveDataItemElementsState();
    const di = dataItem({
      relationItems: [{ type: 'Flow', dir: 'out' }],
      filter: 'C2',
    });
    const result = resolveDataItemElements(di, state.elemMap['p']);
    expect(result).toHaveLength(0); // C1 matches Flow out from p, but filter 'C2' excludes it
  });

  // RelNode parent

  it('relNode parent, no relItems, elementTypes: returns foreign endpoint if type matches', () => {
    setupResolveDataItemElementsState();
    const relNode = {
      ...state.allRelations[0],
      _isRel: true,
      _traverseDir: 'out',
    }; // R1: p→c1
    const di = dataItem({ elementTypes: ['Component'] });
    const result = resolveDataItemElements(di, relNode);
    expect(result.map((e) => e.id)).toStrictEqual(['c1']);
  });

  it('relNode parent, no relItems: returns empty when foreign endpoint type does not match', () => {
    setupResolveDataItemElementsState();
    const relNode = {
      ...state.allRelations[0],
      _isRel: true,
      _traverseDir: 'out',
    }; // R1: p→c1 (Component)
    const di = dataItem({ elementTypes: ['Layer'] });
    expect(resolveDataItemElements(di, relNode)).toHaveLength(0);
  });

  it('relNode parent + relItems: returns empty (relation-of-relation not supported)', () => {
    setupResolveDataItemElementsState();
    const relNode = {
      ...state.allRelations[0],
      _isRel: true,
      _traverseDir: 'out',
    };
    const di = dataItem({ relationItems: [{ type: 'Flow', dir: 'out' }] });
    expect(resolveDataItemElements(di, relNode)).toHaveLength(0);
  });
});

// ── resolveDataItemRelations ──────────────────────────────────────────────────

describe(resolveDataItemRelations, () => {
  function setupResolveDataItemRelationsState() {
    setupState(
      [elem('a', 'Comp', 'A'), elem('b', 'Comp', 'B'), elem('c', 'Comp', 'C')],
      [
        rel('r1', 'Flow', 'a', 'b', 'Flow AB'),
        rel('r2', 'Flow', 'a', 'b', 'Flow AB2'),
        rel('r3', 'Flow', 'b', 'c', 'Flow BC'),
        rel('r4', 'Uses', 'a', 'b', 'Uses AB'),
      ],
    );
  }

  it('dir=out: returns relations from rowElem to colElem', () => {
    setupResolveDataItemRelationsState();
    const di = dataItem({ relationItems: [{ type: 'Flow', dir: 'out' }] });
    const result = resolveDataItemRelations(di, state.elemMap['a'], state.elemMap['b']);
    expect(result.map((r) => r.id).toSorted()).toStrictEqual(['r1', 'r2'].toSorted());
  });

  it('dir=in: returns relations from colElem to rowElem (reversed perspective)', () => {
    setupResolveDataItemRelationsState();
    // Dir=in means: rel.target === rowElem && rel.source === colElem
    const di = dataItem({ relationItems: [{ type: 'Flow', dir: 'in' }] });
    const result = resolveDataItemRelations(di, state.elemMap['b'], state.elemMap['a']);
    expect(result.map((r) => r.id).toSorted()).toStrictEqual(['r1', 'r2'].toSorted());
  });

  it('returns empty when no relation connects the pair', () => {
    setupResolveDataItemRelationsState();
    const di = dataItem({ relationItems: [{ type: 'Flow', dir: 'out' }] });
    expect(resolveDataItemRelations(di, state.elemMap['a'], state.elemMap['c'])).toHaveLength(0);
  });

  it('type filter excludes non-matching relation types', () => {
    setupResolveDataItemRelationsState();
    const di = dataItem({ relationItems: [{ type: 'Uses', dir: 'out' }] });
    const result = resolveDataItemRelations(di, state.elemMap['a'], state.elemMap['b']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r4');
  });

  it('multiple relationItems: unions results from all items', () => {
    setupResolveDataItemRelationsState();
    const di = dataItem({
      relationItems: [
        { type: 'Flow', dir: 'out' },
        { type: 'Uses', dir: 'out' },
      ],
    });
    const result = resolveDataItemRelations(di, state.elemMap['a'], state.elemMap['b']);
    expect(result.map((r) => r.id).toSorted()).toStrictEqual(['r1', 'r2', 'r4'].toSorted());
  });

  it('name filter restricts by relation name', () => {
    setupResolveDataItemRelationsState();
    const di = dataItem({
      relationItems: [{ type: 'Flow', dir: 'out' }],
      filter: 'Flow AB2',
    });
    const result = resolveDataItemRelations(di, state.elemMap['a'], state.elemMap['b']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r2');
  });
});
