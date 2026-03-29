import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-5.1: Tab Buttons Switch Between Views', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-5.1.1: Clicking "Table" switches to table view; clicking "Graph" returns', async ({
    page,
  }) => {
    await page.locator('#tab-table').click();

    await expect(page.locator('#table-view')).toBeVisible();
    await expect(page.locator('#cy')).toBeHidden();
    await expect(page.locator('#tab-table')).toHaveClass(/active/);
    await expect(page.locator('#tab-graph')).not.toHaveClass(/active/);

    await page.locator('#tab-graph').click();

    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#table-view')).toBeHidden();
    await expect(page.locator('#tab-graph')).toHaveClass(/active/);
    await expect(page.locator('#tab-table')).not.toHaveClass(/active/);
  });
});
