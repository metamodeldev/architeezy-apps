import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function injectCyCapture(page) {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'cytoscape', {
      configurable: true,
      get() {
        return globalThis.__cyImpl;
      },
      set(fn) {
        globalThis.__cyImpl = function cyWrapper(...args) {
          const inst = fn.apply(this, args);
          if (inst && typeof inst.$id === 'function') {
            globalThis.__cy = inst;
          }
          return inst;
        };
      },
    });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-5.6: View Switch Preserves State', () => {
  test('TC-5.6.1: Returning to graph view preserves zoom', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      globalThis.__cy.zoom(2.5);
    });

    await page.locator('#tab-table').click();
    await page.locator('#tab-graph').click();

    const zoom = await page.evaluate(() => globalThis.__cy.zoom());
    expect(zoom).toBeCloseTo(2.5, 0);
  });

  test('TC-5.6.2: Active filters preserved when switching views', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    await page.locator('#tab-table').click();

    await expect(page.locator('#table-body tr')).toHaveCount(3);

    await page.locator('#tab-graph').click();

    await expect(
      page.locator('input[data-kind="elem"][data-type="ApplicationService"]'),
    ).not.toBeChecked();

    await page.locator('#tab-table').click();

    await expect(page.locator('#table-body tr')).toHaveCount(3);
  });

  test('TC-5.6.3: Switching to table view preserves search input and sort order', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await page.locator('#tab-table').click();

    // Apply a sort and a search
    const typeHeader = page.locator('#table-head th', { hasText: 'Type' });
    await typeHeader.click();
    await typeHeader.click(); // Sort descending
    await page.locator('#table-search').fill('Component');

    // Switch away and back to table view
    await page.locator('#tab-graph').click();
    await page.locator('#tab-table').click();

    // Search should be preserved
    await expect(page.locator('#table-search')).toHaveValue('Component');

    // Sort should be preserved — Type column should still have sorted class
    await expect(page.locator('#table-head th.sorted')).toHaveCount(1);
    await expect(page.locator('#table-head th.sorted')).toContainText('Type');

    // Only 2 rows should be visible (filtered by "Component")
    await expect(page.locator('#table-body tr')).toHaveCount(2);
  });
});
