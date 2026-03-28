import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from './fixtures.js';

test.describe('drill-down mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
  });

  test('?entity= shows drill label in breadcrumb', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#drill-label')).toBeVisible();
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
  });

  test('?entity= shows the node label in the drill bar', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#drill-label')).toHaveText('Component A');
  });

  test('?entity= renders element details in the detail panel', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#detail-panel .detail-name')).toHaveText('Component A');
    await expect(page.locator('#detail-panel .detail-type')).toContainText('ApplicationComponent');
    await expect(page.locator('#detail-panel .detail-doc')).toHaveText('First component');
  });

  test('?depth= highlights the correct depth button', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a&depth=3');
    await waitForLoading(page);

    await expect(page.locator('#depth-picker .depth-btn.active')).toHaveText('3');
  });

  test('exit drill button hides drill indicators', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#drill-label')).toBeVisible();
    await page.locator('#drill-exit-btn').click();
    await expect(page.locator('#drill-label')).toHaveClass(/hidden/);
    await expect(page.locator('#crumb-entity-sep')).toHaveClass(/hidden/);
  });

  test('clicking a depth button changes the active depth', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a&depth=1');
    await waitForLoading(page);

    await page.locator('#depth-picker .depth-btn', { hasText: '3' }).click();

    await expect(page.locator('#depth-picker .depth-btn.active')).toHaveText('3');
  });

  test('clicking depth button updates the URL depth param', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a&depth=1');
    await waitForLoading(page);

    await page.locator('#depth-picker .depth-btn', { hasText: '4' }).click();

    await expect(page).toHaveURL(/depth=4/);
  });

  test('entering drill mode shows the depth row in settings', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#settings-depth-row')).not.toHaveClass(/hidden/);
  });

  test('exiting drill mode hides the depth row in settings', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await page.locator('#drill-exit-btn').click();

    await expect(page.locator('#settings-depth-row')).toHaveClass(/hidden/);
  });
});
