import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-3.2: Filter List Search', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-3.2.1: Typing in Entities search hides non-matching types', async ({ page }) => {
    await page.locator('#elem-filter-search').pressSequentially('Component');

    const svcItem = page
      .locator('.filter-item')
      .filter({ has: page.locator('[data-type="ApplicationService"]') });
    await expect(svcItem).toHaveClass(/hidden/);

    const compItem = page
      .locator('.filter-item')
      .filter({ has: page.locator('[data-type="ApplicationComponent"]') });
    await expect(compItem).not.toHaveClass(/hidden/);
  });

  test('TC-3.2.2: Clearing search restores all types with checkbox states intact', async ({
    page,
  }) => {
    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await page.locator('#elem-filter-search').pressSequentially('Component');

    const svcItem = page
      .locator('.filter-item')
      .filter({ has: page.locator('[data-type="ApplicationService"]') });
    await expect(svcItem).toHaveClass(/hidden/);

    await page.locator('#elem-filter-search').clear();
    await page.locator('#elem-filter-search').dispatchEvent('input');

    await expect(svcItem).not.toHaveClass(/hidden/);
    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
  });

  test('TC-3.2.3: Relationships search hides non-matching types', async ({ page }) => {
    await page.locator('#rel-filter-search').pressSequentially('Association');

    const servingItem = page
      .locator('.filter-item')
      .filter({ has: page.locator('[data-type="ServingRelationship"]') });
    await expect(servingItem).toHaveClass(/hidden/);
  });
});
