import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

// ── NOTE ─────────────────────────────────────────────────────────────────────
// SR-11.4 (Image Export) is a planned "Future" feature per docs/graph/system-requirements/export.md
// The UI elements (#export-image-btn) are not yet implemented. These tests are skipped
// Until the feature is developed. Do not remove - they serve as specification tests.
// ──────────────────────────────────────────────────────────────────────────────

test.describe('TC-11.4: Graph Image Export Accessibility', () => {
  test('TC-11.4.1: An "Export Image" button is visible in the graph toolbar when graph view is active', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await expect(page.locator('#cy')).not.toHaveClass(/hidden/);
    await expect(page.locator('#export-image-btn')).toBeVisible();
    await expect(page.locator('#export-image-btn')).toBeEnabled();
  });

  test('TC-11.4.2: "Export Image" button is disabled when no model is loaded', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await page.locator('#modal-close-btn').click();

    const exportBtn = page.locator('#export-image-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeDisabled();
  });
});
