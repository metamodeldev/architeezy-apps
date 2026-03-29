import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

test.describe('TC-10.3: Authentication Initiation', () => {
  test('TC-10.3.1: Clicking "Sign in" opens an authentication popup window', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('#modal-close-btn').click();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.locator('#auth-btn').click(),
    ]);

    await expect(popup).toBeTruthy();
    expect(popup.url()).toContain('/-/auth');
  });

  test('TC-10.3.2: Blocked popup shows an inline error or fallback link', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => {
      localStorage.clear();
      // Override globalThis.open to simulate blocked popup (returns undefined)
      const origOpen = globalThis.open.bind(globalThis);
      globalThis.open = function open(...args) {
        const pop = origOpen(...args);
        pop?.close();
      };
    });
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('#modal-close-btn').click();

    await page.locator('#auth-btn').click();

    // Application should show feedback about blocked popup
    const feedback = page.locator('#toast, #auth-error, a[href*="auth"]');
    await expect(feedback.first()).toBeVisible();
  });
});
