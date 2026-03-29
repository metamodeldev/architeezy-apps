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

async function waitForCyNode(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const node = globalThis.__cy.$id(id);
    if (!node.length) {
      return false;
    }
    const pos = node.renderedPosition();
    return pos.x > 10 && pos.y > 10;
  }, nodeId);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-4.8: Drill Mode Respects Active Filters', () => {
  test('TC-4.8.1: Element type filter applies within drill scope', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    await page.locator('#tab-table').click();
    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();

    const rows = page.locator('#table-body tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Service X' })).toHaveCount(0);

    const compAVisible = await page.evaluate(() => globalThis.__cy.$id('comp-a').visible());
    expect(compAVisible).toBe(true);
  });

  test('TC-4.8.2: Relationship type filter hides edges', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await page.locator('#tab-table').click();
    await page.locator('#ttab-rels').click();
    await page.locator('input[data-kind="rel"][data-type="ServingRelationship"]').uncheck();

    await expect(page.locator('#table-body tr')).toHaveCount(1);
  });
});
