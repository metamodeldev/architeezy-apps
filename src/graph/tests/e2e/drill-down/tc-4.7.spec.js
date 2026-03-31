import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

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

test.describe('TC-4.7: Exiting Drill Mode Restores Full Model View', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);
  });

  test('TC-4.7.1: Exit button exits drill mode and restores all nodes', async ({ page }) => {
    await page.locator('#drill-exit-btn').click();

    await expect(page.locator('#drill-label')).toHaveClass(/hidden/);
    await expect(page.locator('#crumb-entity-sep')).toHaveClass(/hidden/);
    await expect(page).not.toHaveURL(/entity=/);

    const visibleCount = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);
    expect(visibleCount).toBe(4);
  });
});
