import { expect } from '@playwright/test';

import { loadTestModelFromSelector, mockApi, test } from './fixtures.js';

test.describe('table column sorting', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('clicking a column header sorts the elements table ascending', async ({ page }) => {
    await page.locator('#table-head th').first().click();

    await expect(page.locator('#table-head th').first()).toHaveClass(/sorted/);
    await expect(page.locator('#table-head th .sort-icon').first()).toHaveText('▲');
  });

  test('clicking the same column header again reverses to descending', async ({ page }) => {
    await page.locator('#table-head th').first().click();
    await page.locator('#table-head th').first().click();

    await expect(page.locator('#table-head th .sort-icon').first()).toHaveText('▼');
  });

  test('clicking a different column clears the sort on the previous one', async ({ page }) => {
    await page.locator('#table-head th').first().click();
    await page.locator('#table-head th').nth(1).click();

    await expect(page.locator('#table-head th').nth(1)).toHaveClass(/sorted/);
    await expect(page.locator('#table-head th').first()).not.toHaveClass(/sorted/);
  });

  test('clicking a table row switches to graph view', async ({ page }) => {
    await page.locator('#table-body tr').first().click();

    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#table-view')).toBeHidden();
  });

  test('relationships tab supports column sorting', async ({ page }) => {
    await page.locator('#ttab-rels').click();
    await page.locator('#table-head th').first().click();

    await expect(page.locator('#table-head th').first()).toHaveClass(/sorted/);
    await expect(page.locator('#table-head th .sort-icon').first()).toHaveText('▲');
  });

  test('relationships tab: clicking sorted column reverses order', async ({ page }) => {
    await page.locator('#ttab-rels').click();
    await page.locator('#table-head th').nth(1).click(); // Sort by rel type
    await page.locator('#table-head th').nth(1).click();

    await expect(page.locator('#table-head th .sort-icon').nth(1)).toHaveText('▼');
  });
});
