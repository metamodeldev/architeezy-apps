import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from './fixtures.js';

test.describe('drill-down mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
  });

  test('?entity= makes drill bar visible', async ({ page }) => {
    await page.goto('/lens/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#drill-bar')).toHaveClass(/visible/);
  });

  test('?entity= shows the node label in the drill bar', async ({ page }) => {
    await page.goto('/lens/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#drill-label')).toHaveText('Component A');
  });

  test('?entity= renders element details in the detail panel', async ({ page }) => {
    await page.goto('/lens/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#detail-panel .detail-name')).toHaveText('Component A');
    await expect(page.locator('#detail-panel .detail-type')).toContainText('ApplicationComponent');
    await expect(page.locator('#detail-panel .detail-doc')).toHaveText('First component');
  });

  test('?depth= highlights the correct depth button', async ({ page }) => {
    await page.goto('/lens/?model=model-test&entity=comp-a&depth=3');
    await waitForLoading(page);

    await expect(page.locator('#depth-picker .depth-btn.active')).toHaveText('3');
  });

  test('exit drill button hides the drill bar', async ({ page }) => {
    await page.goto('/lens/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#drill-bar')).toHaveClass(/visible/);
    await page.locator('#drill-bar button').first().click();
    await expect(page.locator('#drill-bar')).not.toHaveClass(/visible/);
  });
});
