import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-4.9: Count Badges Reflect Drill Scope and Active Filters', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=svc-x&depth=1');
    await waitForLoading(page);
  });

  test('TC-4.9.1: Entering drill mode updates element count badges', async ({ page }) => {
    await page.locator('#tab-table').click();

    await expect(page.locator('#table-body tr')).toHaveCount(2);
    await expect(page.locator('#badge-elem')).toContainText('2');
    await expect(page.locator('#badge-elem')).toContainText('4');
  });
});
