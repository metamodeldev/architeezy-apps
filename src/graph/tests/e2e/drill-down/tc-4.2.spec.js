import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-4.2: Drill Bar Shows Selected Node and Exit Option', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);
  });

  test('TC-4.2.1: Drill bar visible with node label and exit button', async ({ page }) => {
    await expect(page.locator('#drill-label')).toBeVisible();
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).toHaveText('Component A');
    await expect(page.locator('#drill-exit-btn')).toBeVisible();
  });
});
