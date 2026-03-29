import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-1.8: Session Persistence', () => {
  test('TC-1.8.1: Last-viewed model auto-loaded on next session', async ({ page }) => {
    // First visit: load Test Architecture via the selector
    await mockApi(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');

    // Second visit: model auto-loads without showing the selector
    await mockApi(page);
    await page.goto('/graph/');
    await waitForLoading(page);

    await expect(page.locator('#model-modal')).toBeHidden();
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });

  test('TC-1.8.2: Filter state persists across page reloads', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
  });
});
