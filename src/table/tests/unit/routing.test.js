import { readUrlParams } from '../../js/routing.js';

// ── no params ─────────────────────────────────────────────────────────────────

describe('readUrlParams — no params', () => {
  it('returns null modelId and undefined def when search is empty', () => {
    const { modelId, def } = readUrlParams('');
    expect(modelId).toBeNull();
    expect(def).toBeUndefined();
  });
});

// ── model param ───────────────────────────────────────────────────────────────

describe('readUrlParams — model param', () => {
  it('returns the model UUID', () => {
    expect(readUrlParams('?model=550e8400-e29b-41d4-a716-446655440000').modelId).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('returns null when model param is absent', () => {
    expect(readUrlParams('?matrix=abc').modelId).toBeNull();
  });
});

// ── matrix param ─────────────────────────────────────────────────────────────

describe('readUrlParams — matrix param', () => {
  it('decodes a valid base64-encoded JSON matrix def', () => {
    const def = { id: 'test-id', name: 'My Matrix' };
    const encoded = btoa(encodeURIComponent(JSON.stringify(def)));
    expect(readUrlParams(`?matrix=${encoded}`).def).toStrictEqual(def);
  });

  it('returns undefined def when matrix param is absent', () => {
    expect(readUrlParams('?model=abc').def).toBeUndefined();
  });

  it('returns undefined def for malformed base64', () => {
    expect(readUrlParams('?matrix=!!!notbase64!!!').def).toBeUndefined();
  });

  it('returns undefined def for valid base64 but invalid JSON', () => {
    const encoded = btoa(encodeURIComponent('{ not json }'));
    expect(readUrlParams(`?matrix=${encoded}`).def).toBeUndefined();
  });

  it('handles both model and matrix params together', () => {
    const def = { id: 'x', name: '' };
    const encoded = btoa(encodeURIComponent(JSON.stringify(def)));
    const result = readUrlParams(`?model=m1&matrix=${encoded}`);
    expect(result.modelId).toBe('m1');
    expect(result.def).toStrictEqual(def);
  });
});
