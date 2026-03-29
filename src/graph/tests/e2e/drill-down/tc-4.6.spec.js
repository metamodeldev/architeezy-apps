import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-4.6: Adjustable Drill Depth', () => {
  test('TC-4.6.1: Depth picker shows buttons 1–5 with active depth highlighted', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a&depth=3');
    await waitForLoading(page);

    await expect(page.locator('#depth-picker .depth-btn')).toHaveCount(5);
    await expect(page.locator('#depth-picker .depth-btn.active')).toHaveText('3');
  });

  test('TC-4.6.2: Clicking depth button changes active depth and updates URL', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a&depth=1');
    await waitForLoading(page);

    await page.locator('#depth-picker .depth-btn', { hasText: '4' }).click();

    await expect(page.locator('#depth-picker .depth-btn.active')).toHaveText('4');
    await expect(page).toHaveURL(/depth=4/);
    await expect(page.locator('#depth-picker .depth-btn', { hasText: '1' })).not.toHaveClass(
      /active/,
    );
  });
});
