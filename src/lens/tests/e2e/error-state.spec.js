import { expect } from '@playwright/test';

import { mockApi, test } from './fixtures.js';

test.describe('error state', () => {
  test('shows error panel when model list fetch fails', async ({ page }) => {
    await mockApi(page, { modelListStatus: 500 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');

    await expect(page.locator('#error-msg')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#error-detail')).not.toBeEmpty();
  });

  test('retry button is visible on error', async ({ page }) => {
    await mockApi(page, { modelListStatus: 500 });
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');

    await expect(page.locator('#error-msg')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#error-msg button')).toBeVisible();
  });
});
