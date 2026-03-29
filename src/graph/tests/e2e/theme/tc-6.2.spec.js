import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-6.2: Theme Persistence', () => {
  test('TC-6.2.1: Selected dark theme is restored after page reload', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('#theme-btn-dark').click();

    await expect(page.locator('#theme-btn-dark')).toHaveClass(/active/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#theme-btn-dark')).toHaveClass(/active/);

    const storedTheme = await page.evaluate(() => localStorage.getItem('architeezyTheme'));
    expect(storedTheme).toBe('dark');
  });

  test('TC-6.2.2: Corrupted theme value in storage falls back to system default', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.setItem('architeezyTheme', 'banana'));
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await expect(page.locator('#theme-btn-system')).toHaveClass(/active/);
  });
});
