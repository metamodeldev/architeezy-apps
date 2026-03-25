import { expect } from '@playwright/test';
import { test, mockApi, loadTestModelFromSelector } from './fixtures.js';

test.describe('table view', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('switching to table view shows the elements table', async ({ page }) => {
    await expect(page.locator('#table-view')).toBeVisible();
    await expect(page.locator('#tab-table')).toHaveClass(/active/);
    await expect(page.locator('#tab-graph')).not.toHaveClass(/active/);
  });

  test('elements tab lists all elements from the model', async ({ page }) => {
    const rows = page.locator('#table-body tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.filter({ hasText: 'Component A' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Component B' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Service X' })).toBeVisible();
  });

  test('search filters elements by name', async ({ page }) => {
    await page.locator('#table-search').fill('Component');

    await expect(page.locator('#table-body tr')).toHaveCount(2);
    await expect(page.locator('#table-body tr').filter({ hasText: 'Service X' })).toHaveCount(0);
  });

  test('clearing search restores all elements', async ({ page }) => {
    await page.locator('#table-search').fill('Component');
    await expect(page.locator('#table-body tr')).toHaveCount(2);

    await page.locator('#table-search').clear();
    await expect(page.locator('#table-body tr')).toHaveCount(3);
  });

  test('relationships tab shows all relations', async ({ page }) => {
    await page.locator('#ttab-rels').click();

    const rows = page.locator('#table-body tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'AssociationRelationship' })).toBeVisible();
    await expect(rows.filter({ hasText: 'ServingRelationship' })).toBeVisible();
  });

  test('switching back to graph view shows the graph', async ({ page }) => {
    await page.locator('#tab-graph').click();

    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#table-view')).toBeHidden();
  });
});
