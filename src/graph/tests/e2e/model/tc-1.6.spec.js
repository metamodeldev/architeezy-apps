import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-1.6: URL State During Browser Navigation', () => {
  test('TC-1.6.1: URL updates when filter state changes', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await expect(page).toHaveURL(/entities=ApplicationComponent/);

    await mockApi(page);
    await page.goto(page.url());
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
  });
});
