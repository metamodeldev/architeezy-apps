import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-4.10: Drill State Persists in URL', () => {
  test('TC-4.10.1: Deep link with ?entity= restores drill mode on load', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#drill-label')).toHaveText('Component A');
    await expect(page.locator('#detail-panel .detail-name')).toHaveText('Component A');
    await expect(page.locator('#detail-panel .detail-type')).toContainText('ApplicationComponent');
  });

  test('TC-4.10.2: Deep link with ?entity= and ?depth= restores specified depth', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a&depth=3');
    await waitForLoading(page);

    await expect(page.locator('#depth-picker .depth-btn.active')).toHaveText('3');
  });
});
