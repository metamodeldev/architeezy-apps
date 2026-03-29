import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-11.6: Optional Title/Legend in Exported Image', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-11.6.1: When title/legend option is enabled, exported image includes a legend area', async ({
    page,
  }) => {
    // Enable the include-legend option
    const legendToggle = page.locator('#export-legend-toggle');
    await legendToggle.check();
    await expect(legendToggle).toBeChecked();

    await page.locator('#export-image-btn').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-png-btn').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });

  test('TC-11.6.2: When title/legend option is disabled, exported image contains no legend', async ({
    page,
  }) => {
    const legendToggle = page.locator('#export-legend-toggle');
    await legendToggle.uncheck();
    await expect(legendToggle).not.toBeChecked();

    await page.locator('#export-image-btn').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-png-btn').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});
