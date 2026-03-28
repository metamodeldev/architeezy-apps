import { expect } from '@playwright/test';

import { loadTestModelFromSelector, mockApi, test } from './fixtures.js';

test.describe('UI interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });
    await loadTestModelFromSelector(page);
  });

  // ── Sidebar ──────────────────────────────────────────────────────────────

  test('sidebar collapse button collapses the sidebar', async ({ page }) => {
    await page.locator('#sidebar-collapse-btn').click();

    await expect(page.locator('#graph-sidebar')).toHaveClass(/collapsed/);
  });

  test('sidebar collapse button toggles back to expanded', async ({ page }) => {
    await page.locator('#sidebar-collapse-btn').click();
    await page.locator('#sidebar-collapse-btn').click();

    await expect(page.locator('#graph-sidebar')).not.toHaveClass(/collapsed/);
  });

  // ── Section toggle ───────────────────────────────────────────────────────

  test('sidebar section can be collapsed', async ({ page }) => {
    await page.locator('.sidebar-toggle-btn[data-section="sec-elem"]').click();

    await expect(page.locator('#sec-elem')).toHaveClass(/collapsed/);
  });

  test('sidebar section can be expanded after collapse', async ({ page }) => {
    await page.locator('.sidebar-toggle-btn[data-section="sec-elem"]').click();
    await page.locator('.sidebar-toggle-btn[data-section="sec-elem"]').click();

    await expect(page.locator('#sec-elem')).not.toHaveClass(/collapsed/);
  });

  // ── Theme ────────────────────────────────────────────────────────────────

  test('clicking a theme button gives it the active class', async ({ page }) => {
    await page.locator('#theme-btn-dark').click();

    await expect(page.locator('#theme-btn-dark')).toHaveClass(/active/);
    await expect(page.locator('#theme-btn-light')).not.toHaveClass(/active/);
    await expect(page.locator('#theme-btn-system')).not.toHaveClass(/active/);
  });

  test('switching theme persists to localStorage', async ({ page }) => {
    await page.locator('#theme-btn-light').click();

    const stored = await page.evaluate(() => localStorage.getItem('architeezyTheme'));
    expect(stored).toBe('light');
  });

  // ── Toast ────────────────────────────────────────────────────────────────

  test('toast appears when loading a second model fails', async ({ page }) => {
    // Let the "other model" content request fail
    await page.route('**/other-model/**', (r) => r.fulfill({ status: 500, body: 'Server Error' }));

    await page.locator('#current-model-btn').click();
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'Another Model' }).click();

    await expect(page.locator('#toast')).toHaveClass(/visible/, { timeout: 10_000 });
  });

  test('toast close button dismisses the toast', async ({ page }) => {
    await page.route('**/other-model/**', (r) => r.fulfill({ status: 500, body: 'Server Error' }));

    await page.locator('#current-model-btn').click();
    await page.locator('.model-item', { hasText: 'Another Model' }).click();
    await expect(page.locator('#toast')).toHaveClass(/visible/, { timeout: 10_000 });

    await page.locator('#toast-close').click();

    await expect(page.locator('#toast')).not.toHaveClass(/visible/);
  });
});
