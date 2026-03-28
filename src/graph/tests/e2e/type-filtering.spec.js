import { expect } from '@playwright/test';

import { loadTestModelFromSelector, mockApi, test } from './fixtures.js';

test.describe('type filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('unchecking an element type removes it from the table', async ({ page }) => {
    const svcCheckbox = page.locator('input[data-kind="elem"][data-type="ApplicationService"]');
    await svcCheckbox.uncheck();

    await expect(page.locator('#table-body tr').filter({ hasText: 'Service X' })).toHaveCount(0);
    await expect(page.locator('#table-body tr')).toHaveCount(2);
  });

  test('re-checking an element type restores it in the table', async ({ page }) => {
    const svcCheckbox = page.locator('input[data-kind="elem"][data-type="ApplicationService"]');
    await svcCheckbox.uncheck();
    await expect(page.locator('#table-body tr')).toHaveCount(2);

    await svcCheckbox.check();
    await expect(page.locator('#table-body tr')).toHaveCount(3);
  });
});
