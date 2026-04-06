import { describe, expect, it } from 'bun:test';

import { LANG, t } from '../../js/i18n.js';

// ── LANG ──────────────────────────────────────────────────────────────────────

describe(LANG, () => {
  it('is "en" in the test environment (no browser navigator)', () => {
    expect(LANG).toBe('en');
  });
});

// ── t() — known keys ──────────────────────────────────────────────────────────

describe('t — static string keys', () => {
  it('returns the English string for a known key', () => {
    expect(t('errorTitle')).toBe('Error');
  });

  it('returns the correct string for another known key', () => {
    expect(t('retryBtn')).toBe('Retry');
  });

  it('returns the string for a key that exists only in one locale', () => {
    expect(t('selectModel')).toBe('Select model…');
  });
});

// ── t() — function-valued keys ────────────────────────────────────────────────

describe('t — function-valued keys', () => {
  it('calls the function with forwarded arguments', () => {
    // DetailRelations is defined as (n) => `Connections (${n})`
    expect(t('detailRelations', 5)).toBe('Connections (5)');
  });

  it('passes multiple arguments to the function', () => {
    expect(t('detailRelations', 0)).toBe('Connections (0)');
    expect(t('detailRelations', 100)).toBe('Connections (100)');
  });
});

// ── t() — fallback behaviour ──────────────────────────────────────────────────

describe('t — fallback', () => {
  it('returns the key itself when the key is not found in any locale', () => {
    expect(t('nonExistentKey_xyz')).toBe('nonExistentKey_xyz');
  });
});
