import { escHtml, isUUID } from '../../js/utils.js';

// ── escHtml ───────────────────────────────────────────────────────────────────

describe(escHtml, () => {
  it('escapes ampersands', () => {
    expect(escHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than signs', () => {
    expect(escHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater-than signs', () => {
    expect(escHtml('3 > 2')).toBe('3 &gt; 2');
  });

  it('escapes double quotes', () => {
    expect(escHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes all special characters in a combined string', () => {
    expect(escHtml('<a href="x&y">test</a>')).toBe(
      '&lt;a href=&quot;x&amp;y&quot;&gt;test&lt;/a&gt;',
    );
  });

  it('returns an empty string for null', () => {
    expect(escHtml(null)).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(escHtml()).toBe('');
  });

  it('coerces numbers to string', () => {
    expect(escHtml(42)).toBe('42');
  });

  it('returns plain text unchanged when there are no special characters', () => {
    expect(escHtml('hello world')).toBe('hello world');
  });

  it('handles strings that contain only special characters', () => {
    expect(escHtml('&<>"')).toBe('&amp;&lt;&gt;&quot;');
  });
});

// ── isUUID ────────────────────────────────────────────────────────────────────

describe(isUUID, () => {
  it('returns true for a standard UUID', () => {
    expect(isUUID('a1b2c3d4-0000-0000-0000-000000000001')).toBe(true);
  });

  it('returns true for a short UUID-like hex id (8+ hex chars, no dashes)', () => {
    expect(isUUID('abcdef12')).toBe(true);
  });

  it('returns true for a UUID-like id with non-standard segments', () => {
    expect(isUUID('abc00000-xyz')).toBe(false); // Non-hex segment
    expect(isUUID('abc00000-1234')).toBe(true);
  });

  it('returns false for a plain word', () => {
    expect(isUUID('Actor')).toBe(false);
  });

  it('returns false for a short string', () => {
    expect(isUUID('abc')).toBe(false); // Fewer than 8 hex chars
  });

  it('returns false for non-string values', () => {
    expect(isUUID(null)).toBe(false);
    expect(isUUID()).toBe(false);
    expect(isUUID(12_345_678)).toBe(false);
    expect(isUUID({})).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isUUID('')).toBe(false);
  });
});
