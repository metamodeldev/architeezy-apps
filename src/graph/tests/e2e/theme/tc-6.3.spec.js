import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-6.3: UI Components Respect Theme', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-6.3.1: Switching to dark theme applies dark attribute to document', async ({ page }) => {
    await page.locator('#tab-table').click();

    await page.locator('#theme-btn-dark').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-btn-dark')).toHaveClass(/active/);

    await page.locator('#tab-graph').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('TC-6.3.2: Switching to light theme applies light attribute throughout', async ({
    page,
  }) => {
    await page.locator('#theme-btn-dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.locator('#theme-btn-light').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#theme-btn-light')).toHaveClass(/active/);

    await page.locator('#tab-table').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.locator('#tab-graph').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
