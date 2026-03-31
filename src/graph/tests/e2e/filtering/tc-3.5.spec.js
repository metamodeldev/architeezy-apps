import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-3.5: Count Badges Show Visible/Total', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-3.5.1: Entities count badge updates when type filtered out', async ({ page }) => {
    await expect(page.locator('#badge-elem')).toContainText('4');

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await expect(page.locator('#badge-elem')).toContainText('3');
    await expect(page.locator('#badge-elem')).toContainText('4');

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').check();

    await expect(page.locator('#badge-elem')).toContainText('4');
  });

  test('TC-3.5.2: Relationships badge updates when type filtered out', async ({ page }) => {
    await expect(page.locator('#badge-rel')).toContainText('2');

    await page.locator('input[data-kind="rel"][data-type="ServingRelationship"]').uncheck();

    await expect(page.locator('#badge-rel')).toContainText('1');

    await page.locator('input[data-kind="rel"][data-type="ServingRelationship"]').check();

    await expect(page.locator('#badge-rel')).toContainText('2');
  });
});
