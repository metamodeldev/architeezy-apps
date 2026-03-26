import { expect } from '@playwright/test';

import { loadTestModelFromSelector, mockApi, test } from './fixtures.js';

test.describe('relationship type filtering', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
    await page.locator('#ttab-rels').click();
  });

  test('unchecking a relationship type removes it from the table', async ({ page }) => {
    const assocCheckbox = page.locator(
      'input[data-kind="rel"][data-type="AssociationRelationship"]',
    );
    await assocCheckbox.uncheck();

    await expect(
      page.locator('#table-body tr').filter({ hasText: 'AssociationRelationship' }),
    ).toHaveCount(0);
    await expect(page.locator('#table-body tr')).toHaveCount(1);
  });

  test('re-checking a relationship type restores it in the table', async ({ page }) => {
    const assocCheckbox = page.locator(
      'input[data-kind="rel"][data-type="AssociationRelationship"]',
    );
    await assocCheckbox.uncheck();
    await expect(page.locator('#table-body tr')).toHaveCount(1);

    await assocCheckbox.check();
    await expect(page.locator('#table-body tr')).toHaveCount(2);
  });
});

test.describe('filter select-all / select-none controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('"Select none" hides all elements from the table', async ({ page }) => {
    const elemSection = page.locator('.sidebar-section').filter({ has: page.locator('#sec-elem') });
    await elemSection.getByTitle('Select none').click();

    await expect(page.locator('#table-body tr')).toHaveCount(0);
  });

  test('"Select all" restores all elements after deselecting', async ({ page }) => {
    const elemSection = page.locator('.sidebar-section').filter({ has: page.locator('#sec-elem') });
    await elemSection.getByTitle('Select none').click();
    await expect(page.locator('#table-body tr')).toHaveCount(0);

    await elemSection.getByTitle('Select all').click();
    await expect(page.locator('#table-body tr')).toHaveCount(3);
  });
});
