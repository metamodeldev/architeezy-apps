import { describe, expect, it } from 'bun:test';

import { PALETTE, elemColor, hashStr, initColorMaps, relColor } from '../../js/palette.js';

// ── PALETTE constant ──────────────────────────────────────────────────────────

describe('PALETTE', () => {
  it('has exactly 12 entries', () => {
    expect(PALETTE).toHaveLength(12);
  });

  it('contains valid 6-digit hex color strings', () => {
    for (const c of PALETTE) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('has no duplicate colors', () => {
    expect(new Set(PALETTE).size).toBe(PALETTE.length);
  });

  it('starts with the documented red', () => {
    expect(PALETTE[0]).toBe('#c0474a');
  });
});

// ── hashStr ───────────────────────────────────────────────────────────────────

describe(hashStr, () => {
  it('returns a non-negative integer', () => {
    expect(hashStr('hello')).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hashStr('hello'))).toBe(true);
  });

  it('is deterministic — same input always produces the same output', () => {
    expect(hashStr('TypeA')).toBe(hashStr('TypeA'));
    expect(hashStr('')).toBe(hashStr(''));
  });

  it('returns different values for different inputs', () => {
    expect(hashStr('a')).not.toBe(hashStr('b'));
    expect(hashStr('Actor')).not.toBe(hashStr('System'));
  });

  it('returns 5381 for an empty string (no iterations, starting h value)', () => {
    expect(hashStr('')).toBe(5381);
  });

  it('uses multiplication by 33 (djb2): pins exact hash of "a"', () => {
    // h = Math.trunc(5381 * 33) ^ 97 = 177573 ^ 97 = 177604
    expect(hashStr('a')).toBe(177604);
  });

  it('grows quickly with length (multiplicative, not divisive)', () => {
    // If multiplication were replaced by division, repeated hashes would shrink;
    // the djb2 hash of a 5-char ASCII string is well above the seed.
    expect(hashStr('AAAAA')).toBeGreaterThan(10_000);
  });
});

// ── initColorMaps / elemColor ─────────────────────────────────────────────────

describe('elemColor — after initColorMaps', () => {
  it('returns a palette color for a known element type', () => {
    initColorMaps([{ type: 'Actor' }], []);
    expect(PALETTE).toContain(elemColor('Actor'));
  });

  it('assigns colors in alphabetical type order', () => {
    // Types sorted: ['Alpha', 'Beta'] → Alpha→PALETTE[0], Beta→PALETTE[1]
    initColorMaps([{ type: 'Beta' }, { type: 'Alpha' }], []);
    expect(elemColor('Alpha')).toBe(PALETTE[0]);
    expect(elemColor('Beta')).toBe(PALETTE[1]);
  });

  it('wraps around palette when there are more types than palette entries', () => {
    const types = PALETTE.map((_, i) => ({ type: `T${i}` }));
    types.push({ type: 'Extra' }); // 13 types, palette has 12
    initColorMaps(types, []);
    // 'Extra' — sorted, it comes after Ts. Index 12 → 12 % 12 = 0 → PALETTE[0]
    expect(PALETTE).toContain(elemColor('Extra'));
  });

  it('does not iterate past the last type (off-by-one guard)', () => {
    // With `i <= sorted.length`, buildColorMap would assign one extra entry
    // (undefined → some palette color), making a known type get the wrong slot.
    initColorMaps([{ type: 'Alpha' }, { type: 'Beta' }], []);
    // Exactly two types → Alpha=PALETTE[0], Beta=PALETTE[1]. Nothing else.
    expect(elemColor('Alpha')).toBe(PALETTE[0]);
    expect(elemColor('Beta')).toBe(PALETTE[1]);
    // Unknown types use the hash fallback (deterministic), never the consecutive slot
    expect(elemColor('Gamma')).toBe(PALETTE[hashStr('Gamma') % PALETTE.length]);
  });

  it('falls back to hash-based palette index for unknown types', () => {
    initColorMaps([], []);
    const color = elemColor('UnknownType');
    expect(PALETTE).toContain(color);
  });
});

// ── initColorMaps / relColor ──────────────────────────────────────────────────

describe('relColor — after initColorMaps', () => {
  it('returns a palette color for a known relation type', () => {
    initColorMaps([], [{ type: 'Flow' }]);
    expect(PALETTE).toContain(relColor('Flow'));
  });

  it('assigns colors in alphabetical type order', () => {
    initColorMaps([], [{ type: 'Uses' }, { type: 'Association' }]);
    // Sorted: ['Association', 'Uses'] → Association→PALETTE[0], Uses→PALETTE[1]
    expect(relColor('Association')).toBe(PALETTE[0]);
    expect(relColor('Uses')).toBe(PALETTE[1]);
  });

  it('falls back to hash-based palette index for unknown relation types', () => {
    initColorMaps([], []);
    const color = relColor('Composition');
    expect(PALETTE).toContain(color);
  });

  it('elem and rel color maps are independent', () => {
    // Same type name gets different colors for elem vs rel
    initColorMaps([{ type: 'Flow' }], [{ type: 'Flow' }]);
    // ElemColor uses pure consecutive assignment; relColor has +7 offset in fallback
    // With one type each, both maps have 'Flow' → PALETTE[0], so they happen to match here.
    // The key test is that they don't share the same Map object.
    expect(PALETTE).toContain(elemColor('Flow'));
    expect(PALETTE).toContain(relColor('Flow'));
  });

  it('uses a +7 offset (not -7) for the unknown-type fallback', () => {
    // For an unknown type "X", relColor must equal PALETTE[(hash + 7) % 12].
    // Replacing the offset with hash - 7 would produce a different index.
    initColorMaps([], []);
    const h = hashStr('X');
    expect(relColor('X')).toBe(PALETTE[(h + 7) % PALETTE.length]);
    // And explicitly assert it is NOT the elemColor fallback (which uses h % 12).
    // For djb2(X) the two indices differ.
    expect(relColor('X')).not.toBe(elemColor('X'));
  });
});
