import { expect } from '@playwright/test';
import { test, mockApi } from './fixtures.js';

test.describe('model selector', () => {
  test('opens automatically when no model is saved', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');

    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.model-item')).toHaveCount(2);
  });

  test('search filters the model list', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await page.locator('#model-search').fill('Another');

    await expect(page.locator('.model-item')).toHaveCount(1);
    await expect(page.locator('.model-item')).toContainText('Another Model');
  });

  test('clearing search restores all models', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await page.locator('#model-search').fill('Another');
    await expect(page.locator('.model-item')).toHaveCount(1);

    await page.locator('#model-search').clear();
    await expect(page.locator('.model-item')).toHaveCount(2);
  });

  test('close button dismisses the modal', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/lens/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await page.locator('.modal-close').click();

    await expect(page.locator('#model-modal')).toBeHidden();
  });
});
