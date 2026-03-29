import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-11.1: CSV Export Accessibility', () => {
  test('TC-11.1.1: An "Export CSV" button is visible in the table toolbar when table view is active', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('#tab-table').click();

    await expect(page.locator('#export-csv-btn')).toBeVisible();
    await expect(page.locator('#export-csv-btn')).toBeEnabled();
  });

  test('TC-11.1.2: "Export CSV" button is disabled when no model is loaded', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    // Close the model selector without selecting a model
    await page.locator('#modal-close-btn').click();
    await page.locator('#tab-table').click();

    const exportBtn = page.locator('#export-csv-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeDisabled();
  });
});
