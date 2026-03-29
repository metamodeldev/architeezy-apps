import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-3.1: Filter Panel Displays Types with Counts and Checkboxes', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-3.1.1: Entities panel shows ApplicationComponent and ApplicationService types', async ({
    page,
  }) => {
    await expect(page.locator('#elem-filter-list .filter-item')).toHaveCount(2);
    await expect(
      page.locator('#elem-filter-list .filter-item').filter({ hasText: 'ApplicationComponent' }),
    ).toHaveCount(1);
    await expect(
      page.locator('#elem-filter-list .filter-item').filter({ hasText: 'ApplicationService' }),
    ).toHaveCount(1);

    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationComponent"]'),
    ).toBeChecked();
    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).toBeChecked();
  });

  test('TC-3.1.2: Relationships panel shows AssociationRelationship and ServingRelationship', async ({
    page,
  }) => {
    await expect(page.locator('#rel-filter-list .filter-item')).toHaveCount(2);
    await expect(
      page.locator('#rel-filter-list .filter-item').filter({ hasText: 'AssociationRelationship' }),
    ).toHaveCount(1);
    await expect(
      page.locator('#rel-filter-list .filter-item').filter({ hasText: 'ServingRelationship' }),
    ).toHaveCount(1);

    await expect(
      page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]'),
    ).toBeChecked();
    await expect(
      page.locator('input[data-kind="rel"][data-type="ServingRelationship"]'),
    ).toBeChecked();
  });
});
