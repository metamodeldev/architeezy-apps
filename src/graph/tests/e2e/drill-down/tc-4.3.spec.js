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

test.describe('TC-4.3: Drill Root Remains Visible When Its Type Is Filtered', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
  });

  test('TC-4.3.1: Drill root stays visible when its element type unchecked', async ({ page }) => {
    await page.locator('input[data-kind="elem"][data-type="ApplicationComponent"]').uncheck();

    const compAVisible = await page.evaluate(() => globalThis.__cy.$id('comp-a').visible());
    expect(compAVisible).toBe(true);

    const compBVisible = await page.evaluate(() => globalThis.__cy.$id('comp-b').visible());
    expect(compBVisible).toBe(false);
  });
});
