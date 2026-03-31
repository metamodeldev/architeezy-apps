import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-3.7: URL Encoding of Filter State', () => {
  test('TC-3.7.1: URL ?entities= parameter overrides stored filter state', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entities=ApplicationComponent');
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationComponent"]'),
    ).toBeChecked();
  });

  test('TC-3.7.2: URL ?relationships= parameter overrides stored relationship filter', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&relationships=AssociationRelationship');
    await waitForLoading(page);

    await expect(
      page.locator('input[data-kind="rel"][data-type="ServingRelationship"]'),
    ).not.toBeChecked();
    await expect(
      page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]'),
    ).toBeChecked();
  });

  test('TC-3.7.3: Unchecking an element type encodes active types into the URL', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await expect(page).toHaveURL(/entities=ApplicationComponent/);
    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
  });

  test('TC-3.7.4: Re-checking all element types removes the entities URL parameter', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entities=ApplicationComponent');
    await waitForLoading(page);

    // Check all other element types to restore full set
    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').check();
    await page.locator('input[data-kind="elem"][data-type="ApplicationFunction"]').check();

    await expect(page).not.toHaveURL(/entities=/);
    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).toBeChecked();
    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationFunction"]'),
    ).toBeChecked();
  });

  test('TC-3.7.5: Unchecking a relationship type encodes active types into the URL', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await page.locator('input[data-kind="rel"][data-type="ServingRelationship"]').uncheck();

    await expect(page).toHaveURL(/relationships=AssociationRelationship/);
    await expect(
      page.locator('input[data-kind="rel"][data-type="ServingRelationship"]'),
    ).not.toBeChecked();
  });
});
