import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-3.3: Select All and Select None Bulk Controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();
  });

  test('TC-3.3.1: "Select none" unchecks all element types', async ({ page }) => {
    const elemSection = page.locator('.sidebar-section').filter({ has: page.locator('#sec-elem') });
    await elemSection.getByTitle('Select none').click();

    await expect(page.locator('#table-body tr')).toHaveCount(0);
  });

  test('TC-3.3.2: "Select all" restores all after deselecting', async ({ page }) => {
    const elemSection = page.locator('.sidebar-section').filter({ has: page.locator('#sec-elem') });
    await elemSection.getByTitle('Select none').click();
    await expect(page.locator('#table-body tr')).toHaveCount(0);

    await elemSection.getByTitle('Select all').click();
    await expect(page.locator('#table-body tr')).toHaveCount(3);
  });

  test('TC-3.3.3: "Select none" unchecks all relationship types and hides all edges', async ({
    page,
  }) => {
    await page.locator('#ttab-rels').click();
    await expect(page.locator('#table-body tr')).toHaveCount(2);

    const relSection = page.locator('.sidebar-section').filter({ has: page.locator('#sec-rel') });
    await relSection.getByTitle('Select none').click();

    await expect(page.locator('#table-body tr')).toHaveCount(0);
    await expect(page.locator('input[data-kind="rel"]').first()).not.toBeChecked();
  });

  test('TC-3.3.4: "Select all" restores all relationship types after deselecting', async ({
    page,
  }) => {
    await page.locator('#ttab-rels').click();

    const relSection = page.locator('.sidebar-section').filter({ has: page.locator('#sec-rel') });
    await relSection.getByTitle('Select none').click();
    await expect(page.locator('#table-body tr')).toHaveCount(0);

    await relSection.getByTitle('Select all').click();
    await expect(page.locator('#table-body tr')).toHaveCount(2);
  });
});
