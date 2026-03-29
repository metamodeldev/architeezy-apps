import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-7.3: Sidebar State Persistence', () => {
  test('TC-7.3.1: Collapsed sidebar state is restored after page reload', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('#sidebar-collapse-btn').click();
    await expect(page.locator('#graph-sidebar')).toHaveClass(/collapsed/);

    await page.reload();

    await expect(page.locator('#graph-sidebar')).toHaveClass(/collapsed/);
  });

  test('TC-7.3.2: Individual panel collapsed/expanded states are restored after page reload', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('.sidebar-toggle-btn[data-section="sec-elem"]').click();
    await expect(page.locator('#sec-elem')).toHaveClass(/collapsed/);
    await page.locator('.sidebar-toggle-btn[data-section="sec-settings"]').click();
    await expect(page.locator('#sec-settings')).toHaveClass(/collapsed/);

    await page.reload();

    await expect(page.locator('#sec-elem')).toHaveClass(/collapsed/);
    await expect(page.locator('#sec-settings')).toHaveClass(/collapsed/);
    await expect(page.locator('#sec-rel')).not.toHaveClass(/collapsed/);
    await expect(page.locator('#sec-detail')).not.toHaveClass(/collapsed/);
  });

  test('TC-7.3.3: Corrupted sidebar storage values fall back to default expanded state', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => {
      // Corrupt stored values: invalid entries should be ignored and defaults used
      localStorage.setItem('architeezyGraphSidebarCollapsed', 'banana');
      localStorage.setItem('architeezyGraphPanel_sec-elem_collapsed', 'maybe');
      localStorage.setItem('architeezyGraphPanel_sec-settings_collapsed', 'nope');
    });
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    // Sidebar and specified panels should be in default expanded state
    await expect(page.locator('#graph-sidebar')).not.toHaveClass(/collapsed/);
    await expect(page.locator('#sec-elem')).not.toHaveClass(/collapsed/);
    await expect(page.locator('#sec-settings')).not.toHaveClass(/collapsed/);
  });
});
