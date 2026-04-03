import { nodeLabel, sortNodes, identifyGroups } from '../../js/compute-helpers.js';

// ── sortNodes ─────────────────────────────────────────────────────────────────

describe(sortNodes, () => {
  const nodes = [
    { id: '1', name: 'Zebra' },
    { id: '2', name: 'apple' },
    { id: '3', name: 'Mango' },
  ];

  it('sorts ascending by name (locale-insensitive case)', () => {
    const sorted = sortNodes(nodes, { by: 'label', dir: 'asc' });
    expect(sorted.map((n) => n.name)).toStrictEqual(['apple', 'Mango', 'Zebra']);
  });

  it('sorts descending', () => {
    const sorted = sortNodes(nodes, { by: 'label', dir: 'desc' });
    expect(sorted.map((n) => n.name)).toStrictEqual(['Zebra', 'Mango', 'apple']);
  });

  it('does not mutate the original array', () => {
    const original = [...nodes];
    sortNodes(nodes, { by: 'label', dir: 'asc' });
    expect(nodes).toStrictEqual(original);
  });

  it('defaults to asc when sort is absent', () => {
    const sorted = sortNodes(nodes);
    expect(sorted[0].name).toBe('apple');
  });

  it('falls back to type then id for label', () => {
    const noName = [
      { id: 'b', type: 'Beta' },
      { id: 'a', type: 'Alpha' },
    ];
    const sorted = sortNodes(noName, { dir: 'asc' });
    expect(sorted[0].type).toBe('Alpha');
  });
});

// ── nodeLabel ─────────────────────────────────────────────────────────────────

describe(nodeLabel, () => {
  it('returns — for null / undefined', () => {
    expect(nodeLabel()).toBe('—');
  });

  it('returns empty string for _isEmptyLeaf', () => {
    expect(nodeLabel({ _isEmptyLeaf: true })).toBe('');
  });

  it('returns element name when present', () => {
    expect(nodeLabel({ name: 'My Component', type: 'Component' })).toBe('My Component');
  });

  it('falls back to type when name is absent', () => {
    expect(nodeLabel({ type: 'Component' })).toBe('Component');
  });

  it('falls back to id when name and type are absent', () => {
    expect(nodeLabel({ id: 'abc123' })).toBe('abc123');
  });

  it('returns ? when node has no name/type/id', () => {
    expect(nodeLabel({})).toBe('?');
  });

  it('uses dataItem name when set', () => {
    const di = {
      _isDataItem: true,
      name: 'Relations',
      elementTypes: [],
      relationItems: [],
    };
    expect(nodeLabel(di)).toBe('Relations');
  });

  it('builds dataItem label from elementTypes when name is blank', () => {
    const di = {
      _isDataItem: true,
      name: '',
      elementTypes: ['App', 'Service'],
      relationItems: [],
    };
    expect(nodeLabel(di)).toBe('App, Service');
  });

  it('builds dataItem label from relationItems when name is blank', () => {
    const di = {
      _isDataItem: true,
      name: '',
      elementTypes: [],
      relationItems: [
        { type: 'Flow', dir: 'out' },
        { type: 'Uses', dir: 'in' },
      ],
    };
    expect(nodeLabel(di)).toBe('→ Flow, ← Uses');
  });

  it('returns … when dataItem name and all config are blank', () => {
    const di = {
      _isDataItem: true,
      name: '',
      elementTypes: [],
      relationItems: [],
    };
    expect(nodeLabel(di)).toBe('…');
  });
});

// ── identifyGroups ────────────────────────────────────────────────────────────

function fr(groupElem, leafId) {
  return {
    groups: [{ elem: groupElem, span: 1, first: true }],
    leafElem: { id: leafId },
  };
}

describe(identifyGroups, () => {
  it('identifies a single contiguous group', () => {
    const g = { id: 'g1' };
    const rows = [fr(g, 'a'), fr(g, 'b'), fr(g, 'c')];
    const groups = identifyGroups(rows, 0);
    expect(groups).toStrictEqual([{ start: 0, end: 3, elemId: 'g1' }]);
  });

  it('identifies two contiguous groups', () => {
    const g1 = { id: 'g1' };
    const g2 = { id: 'g2' };
    const rows = [fr(g1, 'a'), fr(g1, 'b'), fr(g2, 'c')];
    const groups = identifyGroups(rows, 0);
    expect(groups).toStrictEqual([
      { start: 0, end: 2, elemId: 'g1' },
      { start: 2, end: 3, elemId: 'g2' },
    ]);
  });

  it('treats missing group as __ungrouped__', () => {
    const rows = [
      { groups: [], leafElem: { id: 'x' } },
      { groups: [], leafElem: { id: 'y' } },
    ];
    const groups = identifyGroups(rows, 0);
    expect(groups).toHaveLength(1);
    expect(groups[0].elemId).toBe('__ungrouped__');
  });
});
