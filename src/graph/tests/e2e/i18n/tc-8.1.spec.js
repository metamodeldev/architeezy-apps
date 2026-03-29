import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

test.describe('TC-8.1: Browser Language Detection', () => {
  test('TC-8.1.1: Browser set to Russian (ru) loads the application in Russian on first visit', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());

    // Override navigator.language to simulate Russian browser
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { get: () => 'ru', configurable: true });
    });

    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  });

  test('TC-8.1.2: Browser set to unsupported language falls back to English', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());

    // Override navigator.language to simulate French browser (unsupported locale)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', { get: () => 'fr', configurable: true });
    });

    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
