import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-7.1: Sidebar Collapse and Expand', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-7.1.1: Clicking the toggle button collapses the sidebar to icon-only width', async ({
    page,
  }) => {
    await expect(page.locator('#graph-sidebar')).not.toHaveClass(/collapsed/);

    await page.locator('#sidebar-collapse-btn').click();

    await expect(page.locator('#graph-sidebar')).toHaveClass(/collapsed/);
  });

  test('TC-7.1.2: Clicking the toggle button again expands the sidebar to full width', async ({
    page,
  }) => {
    await page.locator('#sidebar-collapse-btn').click();
    await expect(page.locator('#graph-sidebar')).toHaveClass(/collapsed/);

    await page.locator('#sidebar-collapse-btn').click();

    await expect(page.locator('#graph-sidebar')).not.toHaveClass(/collapsed/);
  });

  test('TC-7.1.3: Main content area resizes to fill available space when sidebar collapses', async ({
    page,
  }) => {
    const mainBefore = await page.locator('main').boundingBox();

    await page.locator('#sidebar-collapse-btn').click();

    // Wait for sidebar collapse animation to complete (width transition ~200ms)
    await page.waitForFunction(() => {
      const sidebar = document.getElementById('graph-sidebar');
      // oxlint-disable-next-line jest/no-conditional-in-test
      return sidebar.classList.contains('collapsed') && sidebar.offsetWidth <= 30;
    });

    const mainAfter = await page.locator('main').boundingBox();
    // Main content should be wider after sidebar collapses
    expect(mainAfter.width).toBeGreaterThan(mainBefore.width);

    await page.locator('#sidebar-collapse-btn').click();

    // Wait for sidebar to expand (width > 100)
    await page.waitForFunction(() => {
      const sidebar = document.getElementById('graph-sidebar');
      // oxlint-disable-next-line jest/no-conditional-in-test
      return !sidebar.classList.contains('collapsed') && sidebar.offsetWidth > 100;
    });

    const mainRestored = await page.locator('main').boundingBox();
    expect(mainRestored.width).toBeLessThan(mainAfter.width);
  });
});
