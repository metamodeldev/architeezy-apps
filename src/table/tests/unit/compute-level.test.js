import { resolveLevel } from '../../js/compute-level.js';
import { state } from '../../js/state.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function elem(id, type, name, parent) {
  return { id, type, name: name ?? type, parent: parent ?? undefined };
}

function rel(id, type, source, target, name) {
  return { id, type, source, target, name: name ?? '' };
}

function setupState(elements, relations) {
  state.allElements = elements;
  state.allRelations = relations;
  state.elemMap = Object.fromEntries(elements.map((e) => [e.id, e]));
}

// ── resolveLevel ─────────────────────────────────────────────────────────────

describe(resolveLevel, () => {
  const sort = { by: 'label', dir: 'asc' };

  function setupResolveLevelState() {
    setupState(
      [
        elem('e1', 'Component', 'Alpha'),
        elem('e2', 'Component', 'Beta'),
        elem('e3', 'Service', 'Gamma'),
        elem('e4', 'Component', 'Delta', 'e1'), // Child of e1
      ],
      [rel('r1', 'Flow', 'e1', 'e2'), rel('r2', 'Flow', 'e2', 'e3'), rel('r3', 'Uses', 'e1', 'e3')],
    );
  }

  // Root level — no parents

  it('root + elementTypes: returns all matching elements', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      { elementTypes: ['Component'], relationItems: [], filter: '' },
      undefined,
      sort,
    );
    expect(nodes.map((n) => n.id)).toStrictEqual(
      ['e4', 'e1', 'e2'].toSorted((a, b) => {
        // Alpha sorted
        const names = { e1: 'Alpha', e2: 'Beta', e4: 'Delta' };
        return names[a].localeCompare(names[b]);
      }),
    );
    expect(nodes.every((n) => n.type === 'Component')).toBe(true);
  });

  it('root + elementTypes: does not include wrong type', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      { elementTypes: ['Component'], relationItems: [], filter: '' },
      undefined,
      sort,
    );
    expect(nodes.find((n) => n.id === 'e3')).toBeUndefined();
  });

  it('root + relationItems dir=out: returns RelNodes for matching relations', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      {
        elementTypes: [],
        relationItems: [{ type: 'Flow', dir: 'out' }],
        filter: '',
      },
      undefined,
      sort,
    );
    expect(nodes.every((n) => n._isRel)).toBe(true);
    expect(nodes.every((n) => n._traverseDir === 'out')).toBe(true);
    expect(nodes.map((n) => n.id).toSorted()).toStrictEqual(['r1', 'r2'].toSorted());
  });

  it('root + relationItems dir=in: wraps relations with _traverseDir=in', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      {
        elementTypes: [],
        relationItems: [{ type: 'Flow', dir: 'in' }],
        filter: '',
      },
      undefined,
      sort,
    );
    expect(nodes.every((n) => n._traverseDir === 'in')).toBe(true);
    expect(nodes.map((n) => n.id).toSorted()).toStrictEqual(['r1', 'r2'].toSorted());
  });

  it('root + filter: restricts by name substring', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      { elementTypes: ['Component'], relationItems: [], filter: 'alp' },
      undefined,
      sort,
    );
    expect(nodes.map((n) => n.id)).toStrictEqual(['e1']);
  });

  // Element parents

  it('element parent + elementTypes: returns children of parent matching type', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      { elementTypes: ['Component'], relationItems: [], filter: '' },
      [state.elemMap['e1']],
      sort,
    );
    expect(nodes.map((n) => n.id)).toStrictEqual(['e4']);
  });

  it('element parent + elementTypes: excludes children of other parents', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      { elementTypes: ['Component'], relationItems: [], filter: '' },
      [state.elemMap['e2']],
      sort,
    );
    expect(nodes).toHaveLength(0);
  });

  it('element parent + relationItems dir=out: finds outgoing relations of parent', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      {
        elementTypes: [],
        relationItems: [{ type: 'Flow', dir: 'out' }],
        filter: '',
      },
      [state.elemMap['e1']],
      sort,
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('r1');
    expect(nodes[0]._traverseDir).toBe('out');
  });

  it('element parent + relationItems dir=in: finds incoming relations of parent', () => {
    setupResolveLevelState();
    const nodes = resolveLevel(
      {
        elementTypes: [],
        relationItems: [{ type: 'Flow', dir: 'in' }],
        filter: '',
      },
      [state.elemMap['e2']],
      sort,
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('r1');
    expect(nodes[0]._traverseDir).toBe('in');
  });

  // RelNode parents

  it('relNode parent + elementTypes: resolves foreign endpoint (dir=out → target)', () => {
    setupResolveLevelState();
    const relNode = {
      ...state.allRelations[0],
      _isRel: true,
      _traverseDir: 'out',
    }; // R1: e1→e2
    const nodes = resolveLevel(
      { elementTypes: ['Component'], relationItems: [], filter: '' },
      [relNode],
      sort,
    );
    expect(nodes.map((n) => n.id)).toStrictEqual(['e2']);
  });

  it('relNode parent + elementTypes: resolves foreign endpoint (dir=in → source)', () => {
    setupResolveLevelState();
    const relNode = {
      ...state.allRelations[0],
      _isRel: true,
      _traverseDir: 'in',
    }; // R1: e1→e2, in → foreign=e1
    const nodes = resolveLevel(
      { elementTypes: ['Component'], relationItems: [], filter: '' },
      [relNode],
      sort,
    );
    expect(nodes.map((n) => n.id)).toStrictEqual(['e1']);
  });

  it('relNode parent + elementTypes: excludes foreign endpoint with wrong type', () => {
    setupResolveLevelState();
    const relNode = {
      ...state.allRelations[0],
      _isRel: true,
      _traverseDir: 'out',
    }; // R1: e1→e2 (Component)
    const nodes = resolveLevel(
      { elementTypes: ['Service'], relationItems: [], filter: '' },
      [relNode],
      sort,
    );
    expect(nodes).toHaveLength(0);
  });
});
