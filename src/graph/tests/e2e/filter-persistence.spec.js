import { expect } from '@playwright/test';

import { loadTestModelFromSelector, mockApi, test, waitForLoading } from './fixtures.js';

test.describe('filter state persistence', () => {
  // AddInitScript runs on every navigation — use sessionStorage flag to clear only once.
  async function setupWithOnceClear(page) {
    await mockApi(page);
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('_testInit')) {
        localStorage.clear();
        sessionStorage.setItem('_testInit', '1');
      }
    });
  }

  test('unchecked element type is remembered across page reloads', async ({ page }) => {
    await setupWithOnceClear(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    // Second navigation — localStorage is preserved because addInitScript won't clear again
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
  });

  test('unchecked relationship type is remembered across page reloads', async ({ page }) => {
    await setupWithOnceClear(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);

    await page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]').uncheck();

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]'),
    ).not.toBeChecked();
  });
});

test.describe('filter type search', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);
  });

  // Fill() dispatches the 'input' event before updating the value field, so pressSequentially
  // Is used here to ensure e.target.value carries the typed text.

  test('filter search hides non-matching element types', async ({ page }) => {
    await page.locator('#elem-filter-search').pressSequentially('Component');

    const svcItem = page
      .locator('.filter-item')
      .filter({ has: page.locator('[data-type="ApplicationService"]') });
    await expect(svcItem).toHaveClass(/hidden/);
  });

  test('filter search keeps matching element types visible', async ({ page }) => {
    await page.locator('#elem-filter-search').pressSequentially('Component');

    const compItem = page
      .locator('.filter-item')
      .filter({ has: page.locator('[data-type="ApplicationComponent"]') });
    await expect(compItem).not.toHaveClass(/hidden/);
  });

  test('clearing filter search restores all types', async ({ page }) => {
    await page.locator('#elem-filter-search').pressSequentially('Component');
    await page.locator('#elem-filter-search').clear();
    // Trigger input event after clear so the handler sees the empty value
    await page.locator('#elem-filter-search').dispatchEvent('input');

    const svcItem = page
      .locator('.filter-item')
      .filter({ has: page.locator('[data-type="ApplicationService"]') });
    await expect(svcItem).not.toHaveClass(/hidden/);
  });

  test('relationship type filter search works', async ({ page }) => {
    await page.locator('#rel-filter-search').pressSequentially('Association');

    const servingItem = page
      .locator('.filter-item')
      .filter({ has: page.locator('[data-type="ServingRelationship"]') });
    await expect(servingItem).toHaveClass(/hidden/);
  });
});
