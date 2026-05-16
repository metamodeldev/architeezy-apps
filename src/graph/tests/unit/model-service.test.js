import { beforeEach, describe, expect, it } from 'bun:test';

import {
  clear,
  elementTypeCounts,
  getElemMap,
  getElementById,
  getElementsByType,
  getElementsByTypes,
  getElements,
  getErrorMessage,
  getId,
  getIncomingRelations,
  getModelList,
  getNs,
  getOutgoingRelations,
  getRelations,
  getRelationshipsForElement,
  getStatus,
  hasElement,
  hasElements,
  modelContentUrl,
  modelTypeLabel,
  relationTypeCounts,
  setElemMap,
  setElements,
  setErrorMessage,
  setId,
  setModelList,
  setNs,
  setRelations,
  setStatus,
} from '../../js/model/service.js';

// ── fixtures ─────────────────────────────────────────────────────────────────

const sampleElements = [
  { id: 'a', type: 'Actor', name: 'A' },
  { id: 'b', type: 'Actor', name: 'B' },
  { id: 'c', type: 'System', name: 'C' },
  { id: 'd', type: 'DB', name: 'D' },
];

const sampleRelations = [
  { id: 'r1', type: 'Uses', source: 'a', target: 'c' },
  { id: 'r2', type: 'Uses', source: 'b', target: 'c' },
  { id: 'r3', type: 'Reads', source: 'c', target: 'd' },
  // Phantom endpoint — must be excluded from relationTypeCounts
  { id: 'r4', type: 'Ghost', source: 'a', target: 'MISSING' },
];

function elemMapFrom(elems) {
  return new Map(elems.map((e) => [e.id, e]));
}

function loadFixture() {
  setElements(sampleElements);
  setRelations(sampleRelations);
  setElemMap(elemMapFrom(sampleElements));
  setNs('http://test/ns');
  setId('m1');
  setStatus('loaded');
  setErrorMessage('');
}

beforeEach(() => {
  clear();
});

// ── getters/setters round-trip ──────────────────────────────────────────────

describe('state getters/setters', () => {
  it('id is undefined after clear, round-trips through setId', () => {
    expect(getId()).toBeUndefined();
    setId('m42');
    expect(getId()).toBe('m42');
  });

  it('ns round-trips and defaults to empty string after clear', () => {
    expect(getNs()).toBe('');
    setNs('urn:test');
    expect(getNs()).toBe('urn:test');
  });

  it('elements default to [] after clear, round-trip identity is preserved', () => {
    expect(getElements()).toStrictEqual([]);
    setElements(sampleElements);
    // Same reference (caller-supplied array) — service does not copy.
    expect(getElements()).toBe(sampleElements);
  });

  it('relations round-trip', () => {
    setRelations(sampleRelations);
    expect(getRelations()).toBe(sampleRelations);
  });

  it('elemMap round-trips and is a real Map', () => {
    const m = elemMapFrom(sampleElements);
    setElemMap(m);
    expect(getElemMap()).toBe(m);
    expect(getElemMap().get('a')?.name).toBe('A');
  });

  it('modelList round-trips', () => {
    const list = [{ id: 'm1' }];
    setModelList(list);
    expect(getModelList()).toBe(list);
  });

  it('status round-trips through every documented value', () => {
    for (const v of ['idle', 'loading', 'loaded', 'error', 'empty']) {
      setStatus(v);
      expect(getStatus()).toBe(v);
    }
  });

  it('errorMessage round-trips', () => {
    setErrorMessage('boom');
    expect(getErrorMessage()).toBe('boom');
  });
});

// ── clear ────────────────────────────────────────────────────────────────────

describe(clear, () => {
  it('resets every observable piece of state', () => {
    loadFixture();
    setModelList([{ id: 'x' }]);
    setErrorMessage('e');
    clear();

    expect(getElements()).toStrictEqual([]);
    expect(getRelations()).toStrictEqual([]);
    expect(getElemMap().size).toBe(0);
    expect(getNs()).toBe('');
    expect(getId()).toBeUndefined();
    expect(getStatus()).toBe('idle');
    expect(getErrorMessage()).toBe('');
    expect(getModelList()).toStrictEqual([]);
  });

  it('produces a fresh empty Map (not undefined)', () => {
    loadFixture();
    clear();
    const m = getElemMap();
    expect(m).toBeInstanceOf(Map);
    expect(m.size).toBe(0);
  });
});

// ── computed signals ────────────────────────────────────────────────────────

describe('elementTypeCounts', () => {
  it('returns an empty object when no elements are loaded', () => {
    expect(elementTypeCounts.value).toStrictEqual({});
  });

  it('counts each element type after loading', () => {
    setElements(sampleElements);
    expect(elementTypeCounts.value).toStrictEqual({ Actor: 2, System: 1, DB: 1 });
  });

  it('re-evaluates when elements change', () => {
    setElements(sampleElements);
    expect(elementTypeCounts.value.Actor).toBe(2);
    setElements([{ id: 'x', type: 'Actor' }]);
    expect(elementTypeCounts.value).toStrictEqual({ Actor: 1 });
  });
});

describe('relationTypeCounts', () => {
  it('counts only relations with both endpoints present in elements', () => {
    setElements(sampleElements);
    setRelations(sampleRelations);
    // r4 ('Ghost') has MISSING target → excluded
    expect(relationTypeCounts.value).toStrictEqual({ Uses: 2, Reads: 1 });
  });

  it('returns empty object when there are no relations', () => {
    setElements(sampleElements);
    expect(relationTypeCounts.value).toStrictEqual({});
  });

  it('returns empty when relations exist but all endpoints are missing', () => {
    setRelations(sampleRelations);
    // No elements loaded → every relation has missing endpoints
    expect(relationTypeCounts.value).toStrictEqual({});
  });
});

describe('hasElements', () => {
  it('is false when elements is empty', () => {
    expect(hasElements.value).toBe(false);
  });

  it('is true when at least one element is loaded', () => {
    setElements([{ id: 'a', type: 'X' }]);
    expect(hasElements.value).toBe(true);
  });

  it('is false again after clear', () => {
    setElements([{ id: 'a', type: 'X' }]);
    clear();
    expect(hasElements.value).toBe(false);
  });
});

// ── query helpers ───────────────────────────────────────────────────────────

describe('query helpers', () => {
  beforeEach(loadFixture);

  it('getElementById returns the element when present', () => {
    expect(getElementById('a')?.name).toBe('A');
  });

  it('getElementById returns undefined for unknown id', () => {
    expect(getElementById('GHOST')).toBeUndefined();
  });

  it('getElementsByType returns every element of that type', () => {
    expect(getElementsByType('Actor').map((e) => e.id)).toStrictEqual(['a', 'b']);
  });

  it('getElementsByType returns empty array for unknown type', () => {
    expect(getElementsByType('Nope')).toStrictEqual([]);
  });

  it('getElementsByTypes accepts a Set', () => {
    const result = getElementsByTypes(new Set(['Actor', 'DB']));
    expect(result.map((e) => e.id).sort()).toStrictEqual(['a', 'b', 'd']);
  });

  it('getElementsByTypes accepts an array', () => {
    const result = getElementsByTypes(['System']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c');
  });

  it('getElementsByTypes returns empty for empty input', () => {
    expect(getElementsByTypes([])).toStrictEqual([]);
  });

  it('getRelationshipsForElement includes both incoming and outgoing', () => {
    const result = getRelationshipsForElement('c');
    expect(result.map((r) => r.id).sort()).toStrictEqual(['r1', 'r2', 'r3']);
  });

  it('getRelationshipsForElement returns empty array when element is isolated', () => {
    setElements([{ id: 'iso', type: 'X' }]);
    setRelations([]);
    setElemMap(elemMapFrom([{ id: 'iso', type: 'X' }]));
    expect(getRelationshipsForElement('iso')).toStrictEqual([]);
  });

  it('getOutgoingRelations returns only relations where element is the source', () => {
    expect(getOutgoingRelations('a').map((r) => r.id).sort()).toStrictEqual(['r1', 'r4']);
    expect(getOutgoingRelations('c').map((r) => r.id)).toStrictEqual(['r3']);
  });

  it('getIncomingRelations returns only relations where element is the target', () => {
    expect(getIncomingRelations('c').map((r) => r.id).sort()).toStrictEqual(['r1', 'r2']);
  });

  it('getOutgoingRelations and getIncomingRelations are disjoint on a directed edge', () => {
    const out = new Set(getOutgoingRelations('a').map((r) => r.id));
    const inc = new Set(getIncomingRelations('a').map((r) => r.id));
    for (const id of out) {
      expect(inc.has(id)).toBe(false);
    }
  });

  it('hasElement returns true for known IDs', () => {
    expect(hasElement('a')).toBe(true);
    expect(hasElement('d')).toBe(true);
  });

  it('hasElement returns false for unknown IDs', () => {
    expect(hasElement('GHOST')).toBe(false);
  });
});

// ── modelTypeLabel ──────────────────────────────────────────────────────────

describe(modelTypeLabel, () => {
  it('returns "?" for undefined', () => {
    expect(modelTypeLabel(undefined)).toBe('?');
  });

  it('returns "?" for empty string (falsy guard)', () => {
    expect(modelTypeLabel('')).toBe('?');
  });

  it('extracts and uppercases metamodel segment', () => {
    expect(modelTypeLabel('application/vnd.foo/metamodel/uml/Foo')).toBe('UML');
  });

  it('uppercases lowercase metamodel name', () => {
    expect(modelTypeLabel('x/metamodel/sysml/Bar')).toBe('SYSML');
  });

  it('falls back to fragment after #, stripping trailing "Model"', () => {
    expect(modelTypeLabel('schema#PetriNetModel')).toBe('PetriNet');
  });

  it('returns fragment unchanged when it does not end with "Model"', () => {
    expect(modelTypeLabel('schema#Diagram')).toBe('Diagram');
  });

  it('returns "?" when no metamodel pattern and no # fragment', () => {
    expect(modelTypeLabel('text/plain')).toBe('?');
  });

  it('prefers metamodel pattern over # fragment when both present', () => {
    expect(modelTypeLabel('a/metamodel/bpmn/x#OtherModel')).toBe('BPMN');
  });
});

// ── modelContentUrl ─────────────────────────────────────────────────────────

describe(modelContentUrl, () => {
  it('uses array form of _links.content[0].href and strips URI template variables', () => {
    const url = modelContentUrl({
      _links: { content: [{ href: 'https://api/content{?format,foo}' }] },
    });
    expect(url).toBe('https://api/content');
  });

  it('uses object form of _links.content.href', () => {
    const url = modelContentUrl({
      _links: { content: { href: 'https://api/single{?format}' } },
    });
    expect(url).toBe('https://api/single');
  });

  it('strips multiple URI templates inside the href', () => {
    const url = modelContentUrl({
      _links: { content: { href: 'https://api/{ns}/x{?fmt}/end{?q}' } },
    });
    expect(url).toBe('https://api//x/end');
  });

  it('falls back to canonical API path when slugs are present', () => {
    const url = modelContentUrl({
      scopeSlug: 'org',
      projectSlug: 'proj',
      projectVersion: 'v1',
      slug: 'modelA',
    });
    expect(url).toContain('/api/models/org/proj/v1/modelA/content?format=json');
  });

  it('returns undefined when neither _links nor full slugs are present', () => {
    expect(modelContentUrl({})).toBeUndefined();
  });

  it('returns undefined when slugs are partially present', () => {
    expect(
      modelContentUrl({ scopeSlug: 'org', projectSlug: 'proj', projectVersion: 'v1' }),
    ).toBeUndefined();
  });

  it('prefers _links.content over the slug fallback when both are present', () => {
    const url = modelContentUrl({
      _links: { content: { href: 'https://from-links/x' } },
      scopeSlug: 'org',
      projectSlug: 'proj',
      projectVersion: 'v1',
      slug: 'modelA',
    });
    expect(url).toBe('https://from-links/x');
  });

  it('prefers array form when both array and href object exist on _links.content', () => {
    // Array branch comes first in the function; ensure it wins.
    const url = modelContentUrl({
      _links: { content: [{ href: 'https://from-array' }] },
    });
    expect(url).toBe('https://from-array');
  });

  it('ignores empty array on _links.content (no href[0])', () => {
    const url = modelContentUrl({ _links: { content: [] } });
    expect(url).toBeUndefined();
  });
});
