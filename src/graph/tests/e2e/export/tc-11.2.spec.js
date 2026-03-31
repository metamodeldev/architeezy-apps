import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-11.2: CSV Export Includes Visible Rows', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('TC-11.2.1: CSV export with filters applied includes only the visible filtered rows', async ({
    page,
  }) => {
    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();
    await expect(page.locator('#table-body tr')).toHaveCount(3);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    const content = await download.createReadStream().then(
      (stream) =>
        // oxlint-disable-next-line promise/avoid-new
        new Promise((resolve) => {
          let data = '';
          stream.on('data', (chunk) => (data += chunk));
          stream.on('end', () => resolve(data));
        }),
    );

    expect(content).toContain('Component A');
    expect(content).toContain('Component B');
    expect(content).not.toContain('Service X');
  });

  test('TC-11.2.2: CSV export with no filters includes all elements in the model', async ({
    page,
  }) => {
    await expect(page.locator('#table-body tr')).toHaveCount(4);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    const content = await download.createReadStream().then(
      (stream) =>
        // oxlint-disable-next-line promise/avoid-new
        new Promise((resolve) => {
          let data = '';
          stream.on('data', (chunk) => (data += chunk));
          stream.on('end', () => resolve(data));
        }),
    );

    expect(content).toContain('Component A');
    expect(content).toContain('Component B');
    expect(content).toContain('Service X');
  });
});
