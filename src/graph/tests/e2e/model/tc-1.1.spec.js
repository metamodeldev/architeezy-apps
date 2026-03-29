import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-1.1: Model Selector Interface', () => {
  test('TC-1.1.1: Model selector opens automatically when no model is stored', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    await expect(page.locator('#model-modal')).toBeVisible();
    await expect(page.locator('#cy')).not.toBeVisible();
  });

  test('TC-1.1.2: Selecting a model from the selector loads it and closes the modal', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await page.locator('.model-item', { hasText: 'e-commerce' }).click();
    await waitForLoading(page);

    await expect(page.locator('#model-modal')).toBeHidden();
    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#current-model-name')).toHaveText('e-commerce');
  });
});
