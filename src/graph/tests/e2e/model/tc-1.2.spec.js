import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

test.describe('TC-1.2: Model Card Metadata Display', () => {
  test('TC-1.2.1: Model cards display icon, name, type badge, and description', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    const card = page.locator('.model-item', { hasText: 'Test Architecture' });

    await expect(card.locator('.model-item-icon')).toBeVisible();
    await expect(card.locator('.model-item-name')).toHaveText('Test Architecture');
    await expect(card.locator('.model-type-badge')).toHaveText('ARCHIMATE');
    await expect(card.locator('.model-item-desc')).toHaveText('A test ArchiMate model');
  });
});
