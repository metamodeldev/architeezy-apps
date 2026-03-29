import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-5.4: Sortable Columns', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('TC-5.4.1: Clicking column header sorts ascending; clicking again sorts descending', async ({
    page,
  }) => {
    await page.locator('#table-head th').first().click();

    await expect(page.locator('#table-head th').first()).toHaveClass(/sorted/);
    await expect(page.locator('#table-head th .sort-icon').first()).toHaveText('▲');

    await page.locator('#table-head th').first().click();

    await expect(page.locator('#table-head th .sort-icon').first()).toHaveText('▼');
  });

  test('TC-5.4.2: Clicking different column clears previous sort', async ({ page }) => {
    await page.locator('#table-head th').first().click();
    await page.locator('#table-head th').nth(1).click();

    await expect(page.locator('#table-head th').nth(1)).toHaveClass(/sorted/);
    await expect(page.locator('#table-head th').first()).not.toHaveClass(/sorted/);
  });

  test('TC-5.4.3: Sorting by Type column reorders rows accordingly', async ({ page }) => {
    // Find the Type column header by its text
    const typeHeader = page.locator('#table-head th', { hasText: 'Type' });

    // Click once for ascending sort
    await typeHeader.click();
    const rowsAsc = page.locator('#table-body tr');
    // ApplicationComponent rows should come before ApplicationService in ascending order
    const firstRowAsc = await rowsAsc.first().textContent();
    const lastRowAsc = await rowsAsc.last().textContent();
    expect(firstRowAsc).toContain('ApplicationComponent');
    expect(lastRowAsc).toContain('ApplicationService');

    // Click again for descending sort
    await typeHeader.click();
    const firstRowDesc = await page.locator('#table-body tr').first().textContent();
    expect(firstRowDesc).toContain('ApplicationService');
  });
});
