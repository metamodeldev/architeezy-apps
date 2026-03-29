import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

test.describe('TC-1.3: Model List Search', () => {
  test('TC-1.3.1: Typing in search field filters model list in real-time', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await page.locator('#model-search').fill('comm');
    await expect(page.locator('.model-item')).toHaveCount(1);
    await expect(page.locator('.model-item')).toContainText('e-commerce');

    await page.locator('#model-search').fill('commX');
    await expect(page.locator('.model-item')).toHaveCount(0);
  });

  test('TC-1.3.2: Clearing search field restores all models', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await page.locator('#model-search').fill('e-com');
    await expect(page.locator('.model-item')).toHaveCount(1);

    await page.locator('#model-search').clear();
    await expect(page.locator('.model-item')).toHaveCount(3);
  });
});
