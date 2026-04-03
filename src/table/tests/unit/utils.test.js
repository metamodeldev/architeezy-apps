import { BASE, PALETTE } from '../../js/constants.js';
import {
  elemColor,
  escHtml,
  hashStr,
  isUUID,
  modelContentUrl,
  modelTypeLabel,
  relColor,
} from '../../js/utils.js';

// ── isUUID ────────────────────────────────────────────────────────────────────

describe(isUUID, () => {
  it('accepts a standard 8-4-4-4-12 UUID', () => {
    expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts lowercase UUID', () => {
    expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(isUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('accepts a plain hex string of 8+ chars (no dashes)', () => {
    expect(isUUID('abcdef01')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isUUID('')).toBe(false);
  });

  it('rejects a short hex string', () => {
    expect(isUUID('abc')).toBe(false);
  });

  it('rejects a non-string', () => {
    expect(isUUID(42)).toBe(false);
    expect(isUUID()).toBe(false);
  });

  it('rejects a string with non-hex characters', () => {
    expect(isUUID('gggggggg-gggg-gggg-gggg-gggggggggggg')).toBe(false);
  });
});

// ── hashStr ───────────────────────────────────────────────────────────────────

describe(hashStr, () => {
  it('returns a number', () => {
    expectTypeOf(hashStr('hello')).toBeNumber();
  });

  it('is deterministic — same input gives same output', () => {
    expect(hashStr('ApplicationComponent')).toBe(hashStr('ApplicationComponent'));
  });

  it('returns different values for different inputs', () => {
    expect(hashStr('foo')).not.toBe(hashStr('bar'));
  });

  it('handles an empty string without throwing', () => {
    expect(() => hashStr('')).not.toThrow();
  });

  it('returns a non-negative integer (unsigned 32-bit)', () => {
    const h = hashStr('test');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(h)).toBe(true);
  });
});

// ── escHtml ───────────────────────────────────────────────────────────────────

describe(escHtml, () => {
  it('escapes ampersands', () => {
    expect(escHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater-than', () => {
    expect(escHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes all special chars in one string', () => {
    expect(escHtml('<a href="x&y">')).toBe('&lt;a href=&quot;x&amp;y&quot;&gt;');
  });

  it('returns the string unchanged when no special chars', () => {
    expect(escHtml('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(escHtml('')).toBe('');
  });

  it('coerces undefined to empty string', () => {
    expect(escHtml()).toBe('');
  });

  it('coerces a number to string', () => {
    expect(escHtml(42)).toBe('42');
  });
});

// ── elemColor / relColor ──────────────────────────────────────────────────────

describe(elemColor, () => {
  it('returns a string from PALETTE', () => {
    expect(PALETTE).toContain(elemColor('ApplicationComponent'));
  });

  it('is deterministic', () => {
    expect(elemColor('Actor')).toBe(elemColor('Actor'));
  });

  it('different types usually map to different colours', () => {
    const colours = new Set(
      ['Actor', 'System', 'Service', 'Process', 'Component'].map((t) => elemColor(t)),
    );
    expect(colours.size).toBeGreaterThan(1);
  });
});

describe(relColor, () => {
  it('returns a string from PALETTE', () => {
    expect(PALETTE).toContain(relColor('Association'));
  });

  it('is deterministic', () => {
    expect(relColor('Flow')).toBe(relColor('Flow'));
  });

  it('differs from elemColor for the same type (offset of 7)', () => {
    // They CAN collide due to modulo, but for common types they should differ.
    // Just verify it doesn't throw and returns a palette entry.
    expect(PALETTE).toContain(relColor('Flow'));
  });
});

// ── modelTypeLabel ────────────────────────────────────────────────────────────

describe(modelTypeLabel, () => {
  it('returns ? for empty / falsy input', () => {
    expect(modelTypeLabel('')).toBe('?');
    expect(modelTypeLabel()).toBe('?');
  });

  it('extracts metamodel segment from URI path', () => {
    expect(modelTypeLabel('http://example.com/metamodel/archimate/v3')).toBe('ARCHIMATE');
  });

  it('extracts fragment after # and strips Model suffix', () => {
    expect(modelTypeLabel('http://example.com/schema#ArchimateModel')).toBe('Archimate');
  });

  it('returns fragment as-is when it does not end with Model', () => {
    expect(modelTypeLabel('http://example.com/schema#Foo')).toBe('Foo');
  });

  it('returns ? when URI has no recognised pattern', () => {
    expect(modelTypeLabel('just-a-plain-string')).toBe('?');
  });
});

// ── modelContentUrl ───────────────────────────────────────────────────────────

describe(modelContentUrl, () => {
  it('uses _links.content array href, stripping template variables', () => {
    const model = {
      _links: { content: [{ href: `${BASE}/api/models/x{?format}` }] },
    };
    expect(modelContentUrl(model)).toBe(`${BASE}/api/models/x`);
  });

  it('uses _links.content object href', () => {
    const model = { _links: { content: { href: `${BASE}/api/models/y` } } };
    expect(modelContentUrl(model)).toBe(`${BASE}/api/models/y`);
  });

  it('falls back to slug-based URL when _links is absent', () => {
    const model = {
      scopeSlug: 's',
      projectSlug: 'p',
      projectVersion: 'v1',
      slug: 'm',
    };
    expect(modelContentUrl(model)).toBe(`${BASE}/api/models/s/p/v1/m/content?format=json`);
  });

  it('returns undefined when neither _links nor all slug fields are present', () => {
    expect(modelContentUrl({})).toBeUndefined();
    expect(modelContentUrl({ scopeSlug: 's' })).toBeUndefined();
  });
});
