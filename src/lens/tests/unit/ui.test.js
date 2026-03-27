import { escHtml } from '../../js/ui.js';

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
