import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-11.6: Exported Image Reproduces Visible Canvas Content', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
  });

  test('TC-11.6.1: Exported PNG includes the legend when it is visible on the canvas', async ({
    page,
  }) => {
    // Enable the legend in Settings — makes #graph-legend visible on canvas
    const legendToggle = page.locator('#legend-toggle');
    await legendToggle.check();
    await expect(legendToggle).toBeChecked();
    await expect(page.locator('#graph-legend')).toBeVisible();

    await page.locator('#export-image-btn').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-png-btn').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });

  test('TC-11.6.2: Exported PNG contains no legend when the legend is hidden', async ({ page }) => {
    // Legend toggle is off by default — #graph-legend must not be visible
    const legendToggle = page.locator('#legend-toggle');
    await expect(legendToggle).not.toBeChecked();
    await expect(page.locator('#graph-legend')).not.toBeVisible();

    await page.locator('#export-image-btn').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-png-btn').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });
});
