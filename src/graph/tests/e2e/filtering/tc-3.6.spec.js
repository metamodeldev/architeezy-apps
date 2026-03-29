import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-3.6: Filter State Persistence', () => {
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

  test('TC-3.6.1: Unchecked element type persists across page reloads', async ({ page }) => {
    await setupWithOnceClear(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
  });

  test('TC-3.6.2: Unchecked relationship type persists across page reloads', async ({ page }) => {
    await setupWithOnceClear(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]').uncheck();

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]'),
    ).not.toBeChecked();
  });
});
