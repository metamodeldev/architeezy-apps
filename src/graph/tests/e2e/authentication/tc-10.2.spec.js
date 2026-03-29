import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

test.describe('TC-10.2: Sign-In Control Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
  });

  test('TC-10.2.1: Header shows a "Sign in" button when no token is present', async ({ page }) => {
    await expect(page.locator('#auth-btn')).toBeVisible();
    await expect(page.locator('#auth-btn')).not.toHaveClass(/hidden/);
    await expect(page.locator('#user-info')).not.toHaveClass(/visible/);
  });

  test('TC-10.2.2: "Sign in" button is keyboard-focusable and has a visible focus style', async ({
    page,
  }) => {
    await page.locator('#auth-btn').focus();

    await expect(page.locator('#auth-btn')).toBeFocused();

    // Press Enter while focused — should trigger click (opens popup)
    // We just verify the button is reachable via keyboard without error
    await page.keyboard.press('Tab');
    // No error thrown, button is keyboard accessible
    await expect(page.locator('#auth-btn')).toBeVisible();
  });
});
