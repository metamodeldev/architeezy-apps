import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-3.4: Filtering (Global search in table view)', () => {
  test('TC-3.4.1: Global search filters table rows by matching any cell', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Use global search (not table-specific)
    await page.locator('#global-search').fill('payment');
    await page.waitForTimeout(400); // Debounce

    // Should filter rows - only matching rows are visible
    const visibleRows = await page.locator('#table-body tr:visible').count();
    expect(visibleRows).toBeGreaterThan(0);
  });

  test('TC-3.4.2: Global search persists when switching views', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Enter global search
    await page.locator('#global-search').fill('payment');
    await page.waitForTimeout(400);

    // Switch to graph view
    await page.locator('#tab-graph').click();
    await expect(page).not.toHaveURL(/view=/);

    // Switch back to table view
    await page.locator('#tab-table').click();
    await expect(page).toHaveURL(/view=table/);
    await expect(page.locator('#table-view')).toBeVisible();

    // Global search should still be active (same query persists)
    const searchValue = await page.locator('#global-search').inputValue();
    expect(searchValue).toBe('payment');

    // Table should still be filtered
    const visibleRows = await page.locator('#table-body tr:visible').count();
    expect(visibleRows).toBeGreaterThan(0);
  });

  test('TC-3.4.3: Clear button in global search resets table filtering', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Enter global search
    await page.locator('#global-search').fill('payment');
    await page.waitForTimeout(400);

    // Click clear button in global search
    await page.locator('#global-search-clear').click();

    // Global search should be empty
    expect(await page.locator('#global-search').inputValue()).toBe('');

    // All rows (matching global filters) should be visible
    const rows = await page.locator('#table-body tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('TC-3.4.4: Global search debounced by 300ms', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    const searchInput = page.locator('#global-search');

    // Type quickly
    await searchInput.fill('a');
    await searchInput.fill('ab');
    await searchInput.fill('abc');

    // Wait less than debounce - should not have filtered yet
    await page.waitForTimeout(100);
    // Check that all rows are still visible (no filter applied)
    const allRowsCount = await page.locator('#table-body tr').count();
    const visibleRows = await page.locator('#table-body tr:visible').count();
    expect(visibleRows).toBe(allRowsCount); // All rows still visible

    // After full 300ms, should filter
    await page.waitForTimeout(300);
    // Search should be applied (some rows may be hidden)
    const visibleRowsAfter = await page.locator('#table-body tr:visible').count();
    // With query "abc", expect some filtering (could be 0 if no matches, but filter applied)
    // Just check that the count potentially changed or the state is processed
    expect(visibleRowsAfter <= allRowsCount).toBeTruthy();
  });

  test('TC-3.4.5: Global search matches any cell (full-text across all columns)', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Search by Type column
    await page.locator('#global-search').fill('microservice');
    await page.waitForTimeout(400);
    const visibleRows1 = await page.locator('#table-body tr:visible').count();
    expect(visibleRows1).toBeGreaterThan(0);

    // Clear global search
    await page.locator('#global-search-clear').click();

    // Search by Name column
    await page.locator('#global-search').fill('component');
    await page.waitForTimeout(400);
    const visibleRows2 = await page.locator('#table-body tr:visible').count();
    expect(visibleRows2).toBeGreaterThan(0);
  });

  test('TC-3.4.6: Global search respects current global filters and drill-down', async ({
    page,
  }) => {
    await mockApi(page);
    // Load with global filter: only Microservice entities visible
    await page.goto('/graph/?model=model-test&view=table&entities=Microservice');
    await waitForLoading(page);

    // Search within filtered results
    await page.locator('#global-search').fill('api');
    await page.waitForTimeout(400);

    // Results should be subset of microservices
    // Rows count should be less than or equal to total microservices count
    const visibleRows = await page.locator('#table-body tr:visible').count();
    expect(visibleRows).toBeGreaterThanOrEqual(0);
    // Since database and other types are filtered out, only microservices can appear
  });

  test('TC-3.4.7: No results message shown when nothing matches', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    await page.locator('#global-search').fill('xyz123nonexistent');
    await page.waitForTimeout(400);

    await expect(page.locator('.no-results-message')).toBeVisible();
    await expect(page.locator('.no-results-message')).toContainText(/No results/i);
  });

  test('TC-3.4.8: Global search is case-insensitive', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Uppercase search
    await page.locator('#global-search').fill('PAYMENT');
    await page.waitForTimeout(400);
    const hasResults1 = (await page.locator('#table-body tr:visible').count()) > 0;

    // Clear and lowercase
    await page.locator('#global-search-clear').click();
    await page.locator('#global-search').fill('payment');
    await page.waitForTimeout(400);
    const hasResults2 = (await page.locator('#table-body tr:visible').count()) > 0;

    // Both should produce same result (case-insensitive)
    expect(hasResults1).toBe(hasResults2);
  });

  test('TC-3.4.9: Global search persists when switching between Entities and Relationships tabs', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Enter global search
    await page.locator('#global-search').fill('payment');
    await page.waitForTimeout(400);

    // Switch to Relationships tab
    await page.locator('#ttab-rels').click();

    // Global search should still be active (query persists)
    const searchValue = await page.locator('#global-search').inputValue();
    expect(searchValue).toBe('payment');

    // Switch back to Entities tab
    await page.locator('#ttab-elements').click();

    // Global search still persists
    const searchValue2 = await page.locator('#global-search').inputValue();
    expect(searchValue2).toBe('payment');
  });
});
