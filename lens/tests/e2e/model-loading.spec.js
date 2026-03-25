import { expect } from '@playwright/test';
import { test, mockApi, loadTestModelFromSelector } from './fixtures.js';

test.describe('model loading', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a model in the selector loads it and closes the modal', async ({ page }) => {
    await loadTestModelFromSelector(page);

    await expect(page.locator('#model-modal')).toBeHidden();
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });

  test('stats bar shows correct node and edge counts', async ({ page }) => {
    await loadTestModelFromSelector(page);

    await expect(page.locator('#stat-nodes')).toContainText('3');
    await expect(page.locator('#stat-edges')).toContainText('2');
  });

  test('filter panel lists element types from the model', async ({ page }) => {
    await loadTestModelFromSelector(page);

    const filterItems = page.locator('#elem-filter-list .filter-item');
    await expect(filterItems).toHaveCount(2);
    await expect(filterItems.filter({ hasText: 'ApplicationComponent' })).toBeVisible();
    await expect(filterItems.filter({ hasText: 'ApplicationService' })).toBeVisible();
  });

  test('document title updates to the loaded model name', async ({ page }) => {
    await loadTestModelFromSelector(page);

    await expect(page).toHaveTitle(/Test Architecture/);
  });
});
