import { expect } from '@playwright/test';

import { loadTestModelFromSelector, mockApi, test, waitForLoading } from './fixtures.js';

test.describe('localStorage persistence', () => {
  test('model URL is remembered and auto-loaded on the next visit', async ({ page }) => {
    await mockApi(page);

    // First visit: load the model from the selector (stores URL in localStorage)
    await page.goto('/lens/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');

    // Second visit: no URL params — model should auto-load from localStorage
    await page.goto('/lens/');
    await waitForLoading(page);

    await expect(page.locator('#model-modal')).toBeHidden();
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });
});
