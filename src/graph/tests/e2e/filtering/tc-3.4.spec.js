import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-3.4: Filter Changes Apply Immediately', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('TC-3.4.1: Unchecking element type immediately hides nodes', async ({ page }) => {
    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await expect(page.locator('#table-body tr').filter({ hasText: 'Service X' })).toHaveCount(0);
    await expect(page.locator('#table-body tr')).toHaveCount(2);

    await page.locator('#tab-graph').click();
    await expect(page.locator('#cy')).toBeVisible();
  });

  test('TC-3.4.2: Unchecking relationship type immediately hides only edges', async ({ page }) => {
    await page.locator('#ttab-rels').click();
    await page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]').uncheck();

    await expect(
      page.locator('#table-body tr').filter({ hasText: 'AssociationRelationship' }),
    ).toHaveCount(0);
    await expect(page.locator('#table-body tr')).toHaveCount(1);
  });
});
