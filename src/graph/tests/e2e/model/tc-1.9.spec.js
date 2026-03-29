import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

test.describe('TC-1.9: Unavailable Stored Model', () => {
  test('TC-1.9.1: Stored model URL that 404s falls back to selector', async ({ page }) => {
    await mockApi(page);

    await page.addInitScript(() => {
      localStorage.setItem(
        'architeezyGraphModelUrl',
        'https://architeezy.com/api/models/test/test/1/legacy-model/content?format=json',
      );
      localStorage.setItem('architeezyGraphModelName', 'Legacy Model');
    });

    await page.route('**/legacy-model/**', (r) => r.fulfill({ status: 404, body: 'Not Found' }));

    await page.goto('/graph/');
    await page.locator('#loading').waitFor({ state: 'hidden' });

    await expect(page.locator('#model-modal')).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem('architeezyGraphModelUrl'));
    expect(stored).toBeNull();
  });
});
