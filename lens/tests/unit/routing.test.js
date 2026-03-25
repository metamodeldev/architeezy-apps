import { describe, it, expect } from 'vitest';
import { buildStateQuery } from '../../js/routing.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function elem(type) {
  return { type };
}

function rel(type) {
  return { type };
}

/** Minimal snapshot with all types visible and no drill/view state. */
function base(overrides = {}) {
  return {
    currentModelId: undefined,
    drillNodeId: undefined,
    drillDepth: 2,
    allElements: [],
    allRelations: [],
    activeElemTypes: new Set(),
    activeRelTypes: new Set(),
    currentView: 'graph',
    ...overrides,
  };
}

// ── empty state ───────────────────────────────────────────────────────────────

describe('buildStateQuery — empty state', () => {
  it('returns an empty string when nothing is set', () => {
    expect(buildStateQuery(base())).toBe('');
  });
});

// ── model param ───────────────────────────────────────────────────────────────

describe('buildStateQuery — model', () => {
  it('includes model= when currentModelId is set', () => {
    const q = buildStateQuery(base({ currentModelId: 'my-model' }));
    expect(q).toBe('model=my-model');
  });

  it('omits model= when currentModelId is undefined', () => {
    const q = buildStateQuery(base({ currentModelId: undefined }));
    expect(q).toBe('');
  });

  it('percent-encodes the model ID', () => {
    const q = buildStateQuery(base({ currentModelId: 'org/my model' }));
    expect(q).toBe('model=org%2Fmy%20model');
  });
});

// ── drill params ──────────────────────────────────────────────────────────────

describe('buildStateQuery — drill', () => {
  it('includes entity= and depth= when drillNodeId is set', () => {
    const q = buildStateQuery(base({ currentModelId: 'm', drillNodeId: 'node-1', drillDepth: 3 }));
    expect(new URLSearchParams(q).get('entity')).toBe('node-1');
    expect(new URLSearchParams(q).get('depth')).toBe('3');
  });

  it('omits entity and depth when drillNodeId is undefined', () => {
    const q = buildStateQuery(base({ currentModelId: 'm', drillNodeId: undefined }));
    expect(q).not.toContain('entity');
    expect(q).not.toContain('depth');
  });

  it('percent-encodes the entity ID', () => {
    const q = buildStateQuery(base({ drillNodeId: 'node a/b', drillDepth: 1 }));
    expect(new URLSearchParams(q).get('entity')).toBe('node a/b');
  });
});

// ── entities param ────────────────────────────────────────────────────────────

describe('buildStateQuery — entities', () => {
  it('omits entities= when all element types are active', () => {
    const elements = [elem('A'), elem('B'), elem('A')];
    const q = buildStateQuery(base({ allElements: elements, activeElemTypes: new Set(['A', 'B']) }));
    expect(q).not.toContain('entities');
  });

  it('includes entities= listing only the active types when some are hidden', () => {
    const elements = [elem('A'), elem('B'), elem('C')];
    const q = buildStateQuery(base({ allElements: elements, activeElemTypes: new Set(['A', 'C']) }));
    const sp = new URLSearchParams(q);
    expect(sp.get('entities')?.split(',')).toEqual(expect.arrayContaining(['A', 'C']));
    expect(sp.get('entities')?.split(',')).not.toContain('B');
  });

  it('omits entities= when all element types are hidden (empty active set matches 0 of N)', () => {
    // 0 active out of 2 total — still a subset, so param IS included
    const elements = [elem('A'), elem('B')];
    const q = buildStateQuery(base({ allElements: elements, activeElemTypes: new Set() }));
    expect(new URLSearchParams(q).get('entities')).toBe('');
  });

  it('omits entities= when there are no element types at all', () => {
    const q = buildStateQuery(base({ allElements: [], activeElemTypes: new Set() }));
    expect(q).not.toContain('entities');
  });

  it('deduplicates element types before comparing', () => {
    // Two elements with the same type — only one unique type, so always all active
    const elements = [elem('A'), elem('A')];
    const q = buildStateQuery(base({ allElements: elements, activeElemTypes: new Set(['A']) }));
    expect(q).not.toContain('entities');
  });

  it('percent-encodes element type names', () => {
    const elements = [elem('Type A'), elem('Type B')];
    const q = buildStateQuery(base({ allElements: elements, activeElemTypes: new Set(['Type A']) }));
    expect(q).toContain('Type%20A');
  });
});

// ── relationships param ───────────────────────────────────────────────────────

describe('buildStateQuery — relationships', () => {
  it('omits relationships= when all relation types are active', () => {
    const relations = [rel('Flow'), rel('Use')];
    const q = buildStateQuery(base({ allRelations: relations, activeRelTypes: new Set(['Flow', 'Use']) }));
    expect(q).not.toContain('relationships');
  });

  it('includes relationships= listing only the active types when some are hidden', () => {
    const relations = [rel('Flow'), rel('Use'), rel('Composition')];
    const q = buildStateQuery(base({ allRelations: relations, activeRelTypes: new Set(['Flow']) }));
    expect(new URLSearchParams(q).get('relationships')).toBe('Flow');
  });

  it('omits relationships= when there are no relation types at all', () => {
    const q = buildStateQuery(base({ allRelations: [], activeRelTypes: new Set() }));
    expect(q).not.toContain('relationships');
  });
});

// ── view param ────────────────────────────────────────────────────────────────

describe('buildStateQuery — view', () => {
  it('includes view=table when currentView is "table"', () => {
    const q = buildStateQuery(base({ currentView: 'table' }));
    expect(q).toBe('view=table');
  });

  it('omits view= when currentView is "graph"', () => {
    const q = buildStateQuery(base({ currentView: 'graph' }));
    expect(q).not.toContain('view');
  });
});

// ── param order and combinations ──────────────────────────────────────────────

describe('buildStateQuery — combinations', () => {
  it('produces all params in order: model, entity, depth, entities, relationships, view', () => {
    const elements = [elem('A'), elem('B')];
    const relations = [rel('Flow'), rel('Use')];
    const q = buildStateQuery({
      currentModelId: 'mdl',
      drillNodeId: 'n1',
      drillDepth: 2,
      allElements: elements,
      allRelations: relations,
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['Flow']),
      currentView: 'table',
    });
    const keys = [...new URLSearchParams(q).keys()];
    expect(keys).toEqual(['model', 'entity', 'depth', 'entities', 'relationships', 'view']);
  });

  it('returns only model= when only a model is loaded with defaults', () => {
    const elements = [elem('A')];
    const relations = [rel('Flow')];
    const q = buildStateQuery({
      currentModelId: 'mdl',
      drillNodeId: undefined,
      drillDepth: 2,
      allElements: elements,
      allRelations: relations,
      activeElemTypes: new Set(['A']),
      activeRelTypes: new Set(['Flow']),
      currentView: 'graph',
    });
    expect(q).toBe('model=mdl');
  });
});
