import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function authenticateUser(page, name = 'John Doe') {
  await page.route('https://architeezy.com/api/users/current', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name }),
    }),
  );
  await page.evaluate(() => {
    window.postMessage({ type: 'AUTH_SUCCESS', token: 'test-bearer-token' }, '*');
  });
  await expect(page.locator('#user-info')).toHaveClass(/visible/);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-10.6: Sign-Out Does Not Clear Persisted State', () => {
  test('TC-10.6.1: Active filters and selected model remain unchanged after signing out', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await authenticateUser(page);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();
    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();

    await page.locator('#signout-btn').click();

    // Model should still be loaded
    await expect(page.locator('#cy')).not.toHaveClass(/hidden/);
    // Filter should still be unchecked
    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();
  });

  test('TC-10.6.2: Theme preference is preserved after signing out', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('#theme-btn-dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await authenticateUser(page);
    await page.locator('#signout-btn').click();

    // Dark theme should still be active
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const storedTheme = await page.evaluate(() => localStorage.getItem('architeezyTheme'));
    expect(storedTheme).toBe('dark');
  });
});
