import { parseModel } from '../../js/model.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function node(eClass, id, data = {}) {
  return { eClass, id, data };
}

// ── namespace resolution ─────────────────────────────────────────────────────

describe('currentModelNs', () => {
  it('resolves root eClass prefix to full URI via ns map', () => {
    const raw = {
      ns: { arch: 'http://example.com/arch' },
      content: [{ eClass: 'arch:Model', data: {} }],
    };
    const { currentModelNs } = parseModel(raw);
    expect(currentModelNs).toBe('http://example.com/arch');
  });

  it('falls back to the prefix itself when not in ns map', () => {
    const raw = { content: [{ eClass: 'unknown:Model', data: {} }] };
    const { currentModelNs } = parseModel(raw);
    expect(currentModelNs).toBe('unknown');
  });

  it('is empty string when root eClass has no prefix', () => {
    const raw = { content: [{ eClass: 'Model', data: {} }] };
    const { currentModelNs } = parseModel(raw);
    expect(currentModelNs).toBe('');
  });
});

// ── modelNsMap ───────────────────────────────────────────────────────────────

describe('modelNsMap', () => {
  it('is returned as-is when present', () => {
    const ns = { a: 'http://a', b: 'http://b' };
    const { modelNsMap } = parseModel({ ns, content: [] });
    expect(modelNsMap).toStrictEqual(ns);
  });

  it('defaults to empty object when ns is absent', () => {
    const { modelNsMap } = parseModel({ content: [] });
    expect(modelNsMap).toStrictEqual({});
  });
});

// ── rule 3: graph nodes ──────────────────────────────────────────────────────

describe('graph nodes (rule 3)', () => {
  it('parses a simple node', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            items: [node('ns:Element', 'e1', { name: 'Foo' })],
          },
        },
      ],
    };
    const { allElements, allRelations } = parseModel(raw);
    expect(allElements).toHaveLength(1);
    expect(allElements[0]).toMatchObject({
      id: 'e1',
      type: 'Element',
      ns: 'ns',
      name: 'Foo',
    });
    expect(allRelations).toHaveLength(0);
  });

  it('uses label/title as fallback name', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            items: [
              node('ns:A', 'a1', { label: 'LabelA' }),
              node('ns:B', 'b1', { title: 'TitleB' }),
            ],
          },
        },
      ],
    };
    const { allElements } = parseModel(raw);
    expect(allElements[0].name).toBe('LabelA');
    expect(allElements[1].name).toBe('TitleB');
  });

  it('falls back to type when no name/label/title', () => {
    const raw = {
      content: [{ eClass: 'ns:Root', data: { items: [node('ns:Widget', 'w1')] } }],
    };
    const { allElements } = parseModel(raw);
    expect(allElements[0].name).toBe('Widget');
  });

  it('populates doc from documentation/description/doc', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            items: [node('ns:A', 'a1', { documentation: 'doc text' })],
          },
        },
      ],
    };
    const { allElements } = parseModel(raw);
    expect(allElements[0].doc).toBe('doc text');
  });

  it('adds node to elemMap', () => {
    const raw = {
      content: [{ eClass: 'ns:Root', data: { items: [node('ns:E', 'e1')] } }],
    };
    const { elemMap } = parseModel(raw);
    expect(elemMap['e1']).toBeDefined();
    expect(elemMap['e1'].type).toBe('E');
  });

  it('sets parent for nested nodes', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            items: [
              node('ns:Parent', 'p1', {
                children: [node('ns:Child', 'c1')],
              }),
            ],
          },
        },
      ],
    };
    const { allElements } = parseModel(raw);
    const child = allElements.find((e) => e.id === 'c1');
    expect(child.parent).toBe('p1');
  });

  it('does NOT set parent when containing node is a relation, not an element', () => {
    // Rule 1 edge acts as parentId for recursion, but since it is not in elemMap,
    // Child nodes inside it must have parent = undefined.
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            edges: [
              {
                eClass: 'ns:Edge',
                id: 'edge1',
                data: {
                  source: 'src-0000000',
                  target: 'tgt-0000000',
                  // Embedded node inside the edge
                  extras: [node('ns:Label', 'lbl1')],
                },
              },
            ],
          },
        },
      ],
    };
    const { allElements } = parseModel(raw);
    const lbl = allElements.find((e) => e.id === 'lbl1');
    expect(lbl.parent).toBeUndefined();
  });
});

// ── rule 1: standalone edges ─────────────────────────────────────────────────

describe('standalone edges (rule 1)', () => {
  it('creates a relation when node has both source and target', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            rels: [
              node('ns:Flow', 'r1', {
                source: 'src-0000000',
                target: 'tgt-0000000',
                name: 'flow',
              }),
            ],
          },
        },
      ],
    };
    const { allRelations, allElements } = parseModel(raw);
    expect(allRelations).toHaveLength(1);
    expect(allRelations[0]).toMatchObject({
      id: 'r1',
      type: 'Flow',
      source: 'src-0000000',
      target: 'tgt-0000000',
      name: 'flow',
    });
    expect(allElements).toHaveLength(0);
  });

  it('uses empty string for name when absent', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            rels: [
              node('ns:Dep', 'r2', {
                source: 'aaa-00000000',
                target: 'bbb-00000000',
              }),
            ],
          },
        },
      ],
    };
    const { allRelations } = parseModel(raw);
    expect(allRelations[0].name).toBe('');
  });
});

// ── rule 2: embedded reference edges ─────────────────────────────────────────

describe('embedded reference edges (rule 2)', () => {
  it('creates a relation from parent to target when only target is set', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            items: [
              node('ns:Component', 'comp1', {
                refs: [node('ns:Ref', 'ref1', { target: 'other-00000' })],
              }),
            ],
          },
        },
      ],
    };
    const { allRelations } = parseModel(raw);
    expect(allRelations).toHaveLength(1);
    expect(allRelations[0]).toMatchObject({
      id: 'ref1',
      type: 'Ref',
      source: 'comp1',
      target: 'other-00000',
    });
  });

  it('does NOT create an embedded ref when there is no parentId', () => {
    // Nodes at root data level have no parentId, so rule 2 should not fire
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: { items: [node('ns:Ref', 'r1', { target: 'x-000000' })] },
        },
      ],
    };
    const { allRelations, allElements } = parseModel(raw);
    // No source → rule 2 requires parentId, which is undefined at top level.
    // Falls through to rule 3 and becomes an element instead.
    expect(allRelations).toHaveLength(0);
    expect(allElements).toHaveLength(1);
  });
});

// ── UUID string items → implicit edges ───────────────────────────────────────

describe('uUID array items', () => {
  it('creates an implicit relation from parent to each UUID string', () => {
    const uuid1 = 'a1b2c3d4-0000-0000-0000-000000000001';
    const uuid2 = 'a1b2c3d4-0000-0000-0000-000000000002';
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            items: [
              node('ns:Comp', 'comp1', {
                usedBy: [uuid1, uuid2],
              }),
            ],
          },
        },
      ],
    };
    const { allRelations } = parseModel(raw);
    expect(allRelations).toHaveLength(2);
    expect(allRelations[0]).toMatchObject({
      type: 'usedBy',
      source: 'comp1',
      target: uuid1,
    });
    expect(allRelations[1]).toMatchObject({
      type: 'usedBy',
      source: 'comp1',
      target: uuid2,
    });
  });

  it('ignores non-UUID strings in arrays', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            items: [node('ns:X', 'x1', { tags: ['foo', 'bar'] })],
          },
        },
      ],
    };
    const { allRelations } = parseModel(raw);
    expect(allRelations).toHaveLength(0);
  });
});

// ── EStringToStringMapEntry filtering ────────────────────────────────────────

describe('eStringToStringMapEntry filtering', () => {
  it('skips entries with ecore EStringToStringMapEntry type', () => {
    const ECORE_NS_PREFIX = 'ecore';
    const raw = {
      ns: { [ECORE_NS_PREFIX]: 'http://www.eclipse.org/emf/2002/Ecore' },
      content: [
        {
          eClass: 'ns:Root',
          data: {
            entries: [
              {
                eClass: `${ECORE_NS_PREFIX}:EStringToStringMapEntry`,
                id: 'skip1',
                data: {},
              },
              node('ns:Real', 'real1'),
            ],
          },
        },
      ],
    };
    const { allElements } = parseModel(raw);
    expect(allElements.map((e) => e.id)).not.toContain('skip1');
    expect(allElements.map((e) => e.id)).toContain('real1');
  });

  it('does NOT skip EStringToStringMapEntry from a different namespace', () => {
    const raw = {
      ns: { other: 'http://other.ns' },
      content: [
        {
          eClass: 'ns:Root',
          data: {
            entries: [
              {
                eClass: 'other:EStringToStringMapEntry',
                id: 'kept1',
                data: {},
              },
            ],
          },
        },
      ],
    };
    const { allElements } = parseModel(raw);
    expect(allElements.map((e) => e.id)).toContain('kept1');
  });
});

// ── synthetic IDs ─────────────────────────────────────────────────────────────

function syntheticIdsInput() {
  return {
    content: [{ eClass: 'ns:Root', data: { items: [{ eClass: 'ns:A', data: {} }] } }],
  };
}

describe('synthetic IDs', () => {
  it('assigns synthetic _0, _1, … IDs to nodes without an id field', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: {
            items: [
              { eClass: 'ns:A', data: {} },
              { eClass: 'ns:B', data: {} },
            ],
          },
        },
      ],
    };
    const { allElements } = parseModel(raw);
    expect(allElements[0].id).toBe('_0');
    expect(allElements[1].id).toBe('_1');
  });

  it('resets counter between parseModel calls', () => {
    const first = parseModel(syntheticIdsInput());
    const second = parseModel(syntheticIdsInput());
    expect(first.allElements[0].id).toBe('_0');
    expect(second.allElements[0].id).toBe('_0');
  });
});

// ── pure function / no global mutation ───────────────────────────────────────

describe('purity', () => {
  it('does not mutate the input object', () => {
    const raw = {
      content: [{ eClass: 'ns:Root', data: { items: [node('ns:E', 'e1')] } }],
    };
    const before = JSON.stringify(raw);
    parseModel(raw);
    expect(JSON.stringify(raw)).toBe(before);
  });

  it('two calls with different inputs return independent results', () => {
    const rawA = {
      content: [{ eClass: 'ns:Root', data: { items: [node('ns:A', 'a1')] } }],
    };
    const rawB = {
      content: [{ eClass: 'ns:Root', data: { items: [node('ns:B', 'b1')] } }],
    };
    const a = parseModel(rawA);
    const b = parseModel(rawB);
    expect(a.allElements.map((e) => e.id)).toStrictEqual(['a1']);
    expect(b.allElements.map((e) => e.id)).toStrictEqual(['b1']);
  });
});

// ── edge cases ───────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('handles empty content array', () => {
    const { allElements, allRelations } = parseModel({ content: [] });
    expect(allElements).toHaveLength(0);
    expect(allRelations).toHaveLength(0);
  });

  it('handles raw object without content array (single root form)', () => {
    const raw = { eClass: 'ns:Root', data: { items: [node('ns:E', 'e1')] } };
    const { allElements } = parseModel(raw);
    expect(allElements[0].id).toBe('e1');
  });

  it('skips non-array properties', () => {
    const raw = {
      content: [
        {
          eClass: 'ns:Root',
          data: { items: [node('ns:E', 'e1', { name: 'X', count: 5 })] },
        },
      ],
    };
    // Count is not an array — should not throw or produce spurious edges
    const { allElements, allRelations } = parseModel(raw);
    expect(allElements).toHaveLength(1);
    expect(allRelations).toHaveLength(0);
  });
});
