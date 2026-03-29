import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-7.2: Independent Panel Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-7.2.1: Collapsing the Entities filter panel hides its content without affecting other panels', async ({
    page,
  }) => {
    await expect(page.locator('#sec-elem')).not.toHaveClass(/collapsed/);

    await page.locator('.sidebar-toggle-btn[data-section="sec-elem"]').click();

    await expect(page.locator('#sec-elem')).toHaveClass(/collapsed/);
    // Other panels remain unchanged
    await expect(page.locator('#sec-rel')).not.toHaveClass(/collapsed/);
    await expect(page.locator('#sec-detail')).not.toHaveClass(/collapsed/);
    await expect(page.locator('#sec-settings')).not.toHaveClass(/collapsed/);
  });

  test('TC-7.2.2: Collapsed panel controls are removed from keyboard tab order', async ({
    page,
  }) => {
    await page.locator('.sidebar-toggle-btn[data-section="sec-elem"]').click();
    await expect(page.locator('#sec-elem')).toHaveClass(/collapsed/);

    // Controls inside collapsed section should not be focusable (removed from tab order)
    const checkbox = page.locator('#sec-elem input[type="checkbox"]').first();
    await expect(checkbox).toBeHidden();
    // Alternatively, isFocusable check:
    // Const isFocusable = await page.isFocusable(checkbox);
    // Expect(isFocusable).toBe(false);
  });

  test('TC-7.2.3: Expanding a collapsed panel restores its content and returns controls to tab order', async ({
    page,
  }) => {
    await page.locator('.sidebar-toggle-btn[data-section="sec-elem"]').click();
    await expect(page.locator('#sec-elem')).toHaveClass(/collapsed/);

    await page.locator('.sidebar-toggle-btn[data-section="sec-elem"]').click();

    await expect(page.locator('#sec-elem')).not.toHaveClass(/collapsed/);
    // Checkboxes should be visible again
    await expect(page.locator('#sec-elem input[data-kind="elem"]').first()).toBeVisible();
  });
});
