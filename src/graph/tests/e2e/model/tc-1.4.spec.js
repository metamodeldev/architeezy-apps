import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-1.4: Loading Indicators', () => {
  test('TC-1.4.1: Loading indicator appears after model selection and disappears when ready', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await page.locator('.model-item', { hasText: 'e-commerce' }).click();
    await waitForLoading(page);

    await expect(page.locator('#loading')).toBeHidden();
    await expect(page.locator('#cy')).toBeVisible();
  });
});
