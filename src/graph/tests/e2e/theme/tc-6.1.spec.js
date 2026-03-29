import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-6.1: Theme Switcher UI', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-6.1.1: Theme switcher shows three options: Light, Dark, System', async ({ page }) => {
    const themeBtns = page.locator('.theme-btn');
    await expect(themeBtns).toHaveCount(3);

    await expect(page.locator('#theme-btn-dark')).toBeVisible();
    await expect(page.locator('#theme-btn-light')).toBeVisible();
    await expect(page.locator('#theme-btn-system')).toBeVisible();
  });

  test('TC-6.1.2: Current theme selection is visually indicated as active', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('architeezyTheme', 'dark'));
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await expect(page.locator('#theme-btn-dark')).toHaveClass(/active/);
    await expect(page.locator('#theme-btn-light')).not.toHaveClass(/active/);
    await expect(page.locator('#theme-btn-system')).not.toHaveClass(/active/);
  });
});
