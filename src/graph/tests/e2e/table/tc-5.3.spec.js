import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-5.3: Table Search and Row Count', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('TC-5.3.1: Search filters table rows in real-time', async ({ page }) => {
    await page.locator('#table-search').fill('Component');

    await expect(page.locator('#table-body tr')).toHaveCount(2);
    await expect(page.locator('#table-body tr').filter({ hasText: 'Service X' })).toHaveCount(0);

    await page.locator('#table-search').clear();

    await expect(page.locator('#table-body tr')).toHaveCount(4);
  });

  test('TC-5.3.2: Table count badge reflects current visible rows', async ({ page }) => {
    await expect(page.locator('#table-count')).toContainText('4');

    await page.locator('#table-search').fill('Service');

    await expect(page.locator('#table-count')).toContainText('1');

    await page.locator('#table-search').clear();

    await expect(page.locator('#table-count')).toContainText('4');
  });
});
