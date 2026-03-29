import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-6.4: Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-6.4.1: Selecting Dark theme applies immediately without page reload', async ({
    page,
  }) => {
    const urlBefore = page.url();

    await page.locator('#theme-btn-dark').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-btn-dark')).toHaveClass(/active/);
    // Verify no navigation occurred
    expect(page.url()).toBe(urlBefore);
  });

  test('TC-6.4.2: Selecting System theme stores "system" in localStorage', async ({ page }) => {
    await page.locator('#theme-btn-dark').click();

    await page.locator('#theme-btn-system').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await expect(page.locator('#theme-btn-system')).toHaveClass(/active/);

    const storedTheme = await page.evaluate(() => localStorage.getItem('architeezyTheme'));
    expect(storedTheme).toBe('system');
  });
});
