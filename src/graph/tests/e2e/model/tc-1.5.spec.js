import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-1.5: Deep Links', () => {
  test('TC-1.5.1: URL ?model= loads model without selector', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(page.locator('#model-modal')).toBeHidden();
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });

  test('TC-1.5.2: URL ?entities= pre-applies filter', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entities=ApplicationComponent');
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
  });
});
