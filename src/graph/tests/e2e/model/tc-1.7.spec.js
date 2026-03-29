import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

test.describe('TC-1.7: Invalid Deep Link Fallback', () => {
  test('TC-1.7.1: Unknown model ID in ?model= falls back to selector', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=nonexistent-model');
    await page.locator('#loading').waitFor({ state: 'hidden' });

    await expect(page.locator('#model-modal')).toBeVisible();
  });
});
