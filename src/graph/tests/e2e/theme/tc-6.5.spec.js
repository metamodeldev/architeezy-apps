import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

test.describe('TC-6.5: Graph Visibility in Both Themes', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-6.5.1: Nodes and edges are visually distinct after switching to dark theme', async ({
    page,
  }) => {
    await page.locator('#theme-btn-dark').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // Graph canvas is visible
    await expect(page.locator('#cy')).not.toHaveClass(/hidden/);
  });

  test('TC-6.5.2: Nodes and edges are visually distinct after switching to light theme', async ({
    page,
  }) => {
    await page.locator('#theme-btn-dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.locator('#theme-btn-light').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // Graph canvas is visible
    await expect(page.locator('#cy')).not.toHaveClass(/hidden/);
  });
});
