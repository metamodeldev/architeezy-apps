import { expect } from '@playwright/test';
import { test, mockApi, waitForLoading } from './fixtures.js';

test.describe('URL params', () => {
  test('?model= auto-loads the matching model without opening the selector', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/?model=model-test');
    await waitForLoading(page);

    await expect(page.locator('#model-modal')).toBeHidden();
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });

  test('?view=table opens the app directly in table view', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/?model=model-test&view=table');
    await waitForLoading(page);

    await expect(page.locator('#tab-table')).toHaveClass(/active/);
    await expect(page.locator('#table-view')).toBeVisible();
  });

  test('?entities= unchecks excluded element types in the filter panel', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/?model=model-test&entities=ApplicationComponent');
    await waitForLoading(page);

    // data-kind and data-type are attributes on the input element itself
    const svcCheckbox = page.locator('input[data-kind="elem"][data-type="ApplicationService"]');
    await expect(svcCheckbox).not.toBeChecked();
  });

  test('?relationships= unchecks excluded relationship types in the filter panel', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/?model=model-test&relationships=AssociationRelationship');
    await waitForLoading(page);

    const servingCheckbox = page.locator('input[data-kind="rel"][data-type="ServingRelationship"]');
    await expect(servingCheckbox).not.toBeChecked();
  });
});
