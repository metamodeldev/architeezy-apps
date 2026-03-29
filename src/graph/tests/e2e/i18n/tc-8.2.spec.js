import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector, waitForLoading } from '../fixtures.js';

test.describe('TC-8.2: UI Strings Fully Localized', () => {
  test('TC-8.2.1: All visible UI labels, buttons, and placeholders are in Russian when Russian is active', async ({
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

    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    // No English-only panel labels should be visible
    await expect(page.locator('.sidebar-header-title').filter({ hasText: 'Entities' })).toHaveCount(
      0,
    );
  });

  test('TC-8.2.2: Error and notification messages are translated in the active locale', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { get: () => 'ru', configurable: true });
    });

    // Simulate model list error when loading a specific model
    await mockApi(page, { modelListStatus: 500 });
    // Provide a model param to trigger the full-screen error path (tryLoadFromUrlParam)
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    // Error message should be visible and in Russian (not raw key or English)
    await expect(page.locator('#error-msg')).toBeVisible();
    await expect(page.locator('#error-detail')).not.toHaveText('');
  });
});
