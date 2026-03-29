import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-5.2: Elements and Relationships Table Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('TC-5.2.1: Elements tab lists all model elements with correct columns', async ({ page }) => {
    const rows = page.locator('#table-body tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.filter({ hasText: 'Component A' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Component B' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Service X' })).toBeVisible();

    const headers = page.locator('#table-head th');
    await expect(headers.filter({ hasText: 'Name' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Type' })).toBeVisible();
  });

  test('TC-5.2.2: Relationships tab lists all relationships', async ({ page }) => {
    await page.locator('#ttab-rels').click();

    const rows = page.locator('#table-body tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'AssociationRelationship' })).toBeVisible();
    await expect(rows.filter({ hasText: 'ServingRelationship' })).toBeVisible();
  });
});
