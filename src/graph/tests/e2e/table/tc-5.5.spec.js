import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-5.5: Row Clicks Navigate to Graph', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('TC-5.5.1: Clicking element row switches to graph view', async ({ page }) => {
    await page.locator('#table-body tr').first().click();

    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#table-view')).toBeHidden();
  });
});
