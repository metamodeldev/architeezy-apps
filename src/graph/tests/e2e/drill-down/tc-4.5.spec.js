import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-4.5: Only Edges Connecting Visible Nodes Are Shown', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=svc-x&depth=1');
    await waitForLoading(page);
  });

  test('TC-4.5.1: Edges outside drill scope hidden', async ({ page }) => {
    await page.locator('#tab-table').click();
    await page.locator('#ttab-rels').click();

    await expect(page.locator('#table-body tr')).toHaveCount(1);

    const rows = page.locator('#table-body tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).not.toContainText('AssociationRelationship');
    }
  });
});
