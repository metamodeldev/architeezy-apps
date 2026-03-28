import { expect } from '@playwright/test';

import { mockApi, test } from './fixtures.js';

test.describe('model selector', () => {
  test('opens automatically when no model is saved', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.model-item')).toHaveCount(2);
  });

  test('search filters the model list', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await page.locator('#model-search').fill('Another');

    await expect(page.locator('.model-item')).toHaveCount(1);
    await expect(page.locator('.model-item')).toContainText('Another Model');
  });

  test('clearing search restores all models', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await page.locator('#model-search').fill('Another');
    await expect(page.locator('.model-item')).toHaveCount(1);

    await page.locator('#model-search').clear();
    await expect(page.locator('.model-item')).toHaveCount(2);
  });

  test('close button dismisses the modal', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await page.locator('.modal-close').click();

    await expect(page.locator('#model-modal')).toBeHidden();
  });

  test('pressing Escape closes the modal', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');

    await expect(page.locator('#model-modal')).toBeHidden();
  });

  test('clicking the overlay backdrop closes the modal', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await page.locator('#model-modal').click({ position: { x: 5, y: 5 } });

    await expect(page.locator('#model-modal')).toBeHidden();
  });

  test('model list loads when dialog opens, not before', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.model-item')).toHaveCount(2, { timeout: 10_000 });
  });
});
