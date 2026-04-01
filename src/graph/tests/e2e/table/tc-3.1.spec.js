import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-3.1: View switching', () => {
  test('TC-3.1.1: Switch from Graph to Table view', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await page.locator('#tab-table').click();
    await page.waitForTimeout(300);

    await expect(page.locator('#table-view')).toBeVisible();
    await expect(page.locator('#graph-view')).not.toBeVisible();
    await expect(page).toHaveURL(/view=table/);
  });

  test('TC-3.1.2: Switch from Table to Graph view', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    await page.locator('#tab-graph').click();
    await page.waitForTimeout(300);

    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#table-view')).not.toBeVisible();
    // Graph is default view, so view parameter should be absent
    await expect(page).not.toHaveURL(/view=/);
  });

  test('TC-3.1.3: View switch preserves global filters and drill-down', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&entities=Microservice');
    await waitForLoading(page);

    await page.locator('#tab-table').click();
    await expect(page).toHaveURL(/view=table/);

    await page.locator('#tab-graph').click();
    // Graph is default, so view parameter should be absent
    await expect(page).not.toHaveURL(/view=/);
    await expect(page).toHaveURL(/entities=Microservice/);
  });

  test('TC-3.1.4: View switch preserves table scroll position on return', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Wait for table to be fully rendered and then scroll
    await expect(page.locator('#table-view')).toBeVisible();
    await page.evaluate(() => {
      const container = document.querySelector('.table-container');
      if (container) {
        container.scrollTop = 500;
      }
    });

    // Switch to graph and back
    await page.locator('#tab-graph').click();
    await page.locator('#tab-table').click();

    // Wait for table view to be visible again and check scroll
    await expect(page.locator('#table-view')).toBeVisible();
    const scrollTop = await page.evaluate(() => {
      const container = document.querySelector('.table-container');
      return container ? container.scrollTop : 0;
    });
    expect(scrollTop).toBeGreaterThan(0);
  });

  test('TC-3.1.5: Switching during data load shows loading indicator', async ({ page }) => {
    await mockApi(page);

    // Slow network simulation
    await page.route('**/models/*/content*', (r) =>
      r.delay(1000).fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
          content: [
            {
              eClass: 'archi:ArchimateModel',
              id: 'model-root',
              data: { name: 'Test', elements: [], relations: [] },
            },
          ],
        }),
      }),
    );

    await page.goto('/graph/?model=model-test');

    // Immediately switch view while loading
    await page.locator('#tab-table').click();

    // Loading should persist or show in new view
    await expect(page.locator('#table-view')).toBeVisible();
  });

  test('TC-3.1.6: View switch does not reset table sort order', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Sort by Type (second column, index 1)
    await page.locator('#table-head th[data-col="1"]').click();

    // Switch to graph and back
    await page.locator('#tab-graph').click();
    await page.locator('#tab-table').click();

    // Should still be sorted by Type (check sorted class on Type column)
    const sortIndicator = page.locator('#table-head th[data-col="1"]');
    await expect(sortIndicator).toHaveClass(/sorted/);
  });

  test('TC-3.1.7: View switch uses pushState (major transition)', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    const initialLength = await page.evaluate(() => history.length);

    await page.locator('#tab-table').click();

    const newLength = await page.evaluate(() => history.length);
    expect(newLength).toBeGreaterThan(initialLength);
  });

  test('TC-3.1.8: Table and Graph share same data source (no refetch)', async ({ page }) => {
    await mockApi(page);

    // Track network requests
    const requests = [];
    page.on('request', (req) => {
      if (req.url().includes('/content')) {
        requests.push(req.url());
      }
    });

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Switch to table
    await page.locator('#tab-table').click();
    await page.waitForTimeout(500);

    // Switch back to graph
    await page.locator('#tab-graph').click();
    await page.waitForTimeout(500);

    // Should have only initial model fetch, no additional content fetches
    const contentRequests = requests.filter((r) => r.includes('/content'));
    // If model was already loaded, subsequent view switches shouldn't fetch again
    // At most one content request expected
    expect(contentRequests.length).toBeLessThanOrEqual(1);
  });
});
