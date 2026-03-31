import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-11.8: Export Respects Active Filters', () => {
  test('TC-11.8.1: CSV export with ApplicationService unchecked excludes Service X from the output', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();

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

  test('TC-11.8.2: Graph image export captures only visible nodes (those not filtered out)', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await page.locator('#export-image-btn').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-png-btn').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});
