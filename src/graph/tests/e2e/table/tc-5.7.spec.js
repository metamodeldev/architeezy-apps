import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-5.7: Table Respects Active Filters and Drill Mode', () => {
  test('TC-5.7.1: Table excludes rows for element types that are filtered out', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
    await page.locator('#tab-table').click();

    await expect(page.locator('#table-body tr')).toHaveCount(3);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await expect(page.locator('#table-body tr')).toHaveCount(2);
    await expect(page.locator('#badge-elem')).toContainText('2');
    await expect(page.locator('#badge-elem')).toContainText('3');

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').check();

    await expect(page.locator('#table-body tr')).toHaveCount(3);
  });

  test('TC-5.7.2: Table excludes rows for elements outside the active drill scope', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=svc-x&depth=1');
    await waitForLoading(page);
    await page.locator('#tab-table').click();

    const rows = page.locator('#table-body tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Service X' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Component A' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Component B' })).toHaveCount(0);

    await expect(page.locator('#badge-elem')).toContainText('2');
    await expect(page.locator('#badge-elem')).toContainText('3');
  });
});
