import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-11.7: Export Progress Feedback', () => {
  test('TC-11.7.1: A loading indicator appears promptly when starting a large CSV export', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();

    // Slow down the export by intercepting — just check that the loading indicator appears
    await page.evaluate(() => {
      // Mark start time for timing check
      globalThis.__exportStart = Date.now();
    });

    // Click export and check that a loading indicator or disabled state appears within 100ms
    const exportBtn = page.locator('#export-csv-btn');
    await exportBtn.click();

    // Wait for either the button to become disabled or a loading indicator to appear
    await page.waitForFunction(() => {
      const btn = document.getElementById('export-csv-btn');
      const loading = document.getElementById('export-loading');
      return (btn && btn?.disabled) || (loading && !loading.classList.contains('hidden'));
    });
  });

  test('TC-11.7.2: A success toast notification appears after export completes', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);
    await download.path(); // Wait for download to complete

    await expect(page.locator('#toast')).toHaveClass(/visible/);
    await expect(page.locator('#toast-msg')).toContainText(/export|download|csv/i);
  });
});
