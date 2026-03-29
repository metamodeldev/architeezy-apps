import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-11.5: Image Export Format Support', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-11.5.1: Export dropdown presents both "Export as PNG" and "Export as SVG" options', async ({
    page,
  }) => {
    await page.locator('#export-image-btn').click();

    await expect(page.locator('#export-png-btn')).toBeVisible();
    await expect(page.locator('#export-svg-btn')).toBeVisible();
  });

  test('TC-11.5.2: Selecting "Export as SVG" downloads a file with .svg extension', async ({
    page,
  }) => {
    await page.locator('#export-image-btn').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-svg-btn').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.svg$/i);
  });
});
