import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-8.3: Translation Fallback', () => {
  test('TC-8.3.1: With active Russian locale, UI shows translated strings, not raw keys', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { get: () => 'ru', configurable: true });
    });
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    // With Russian locale active, UI should not show raw key strings or blank labels
    const bodyText = await page.locator('body').textContent();
    // Raw i18n keys would look like camelCase identifiers — verify no obvious raw keys visible
    expect(bodyText).not.toMatch(/\b[a-z][a-zA-Z]{5,}Btn\b/);
    expect(bodyText).not.toMatch(/\b[a-z][a-zA-Z]{5,}Ph\b/);
  });

  test('TC-8.3.2: Unsupported locale falls back to English without crashing', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => {
      localStorage.clear();
      // Simulate German (unsupported) locale — no translation data, falls back to English
      Object.defineProperty(navigator, 'language', { get: () => 'de', configurable: true });
    });

    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    // Application should be fully functional in English (fallback)
    await expect(page.locator('#tab-graph')).toBeVisible();
    await expect(page.locator('#tab-table')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
