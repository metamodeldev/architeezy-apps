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

test.describe('TC-2.2: Consistent Node and Edge Colors by Type', () => {
  test('TC-2.2.1: Same-type nodes share the same color; colors are stable across reloads', async ({
    page,
  }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
    await waitForCyNode(page, 'comp-b');
    await waitForCyNode(page, 'svc-x');

    const colors = await page.evaluate(() => ({
      compA: globalThis.__cy.$id('comp-a').style('background-color'),
      compB: globalThis.__cy.$id('comp-b').style('background-color'),
      svcX: globalThis.__cy.$id('svc-x').style('background-color'),
    }));

    expect(colors.compA).toBe(colors.compB);
    expect(colors.compA).not.toBe(colors.svcX);

    // Reload and verify colors remain stable
    await page.reload();
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
    await waitForCyNode(page, 'comp-b');
    await waitForCyNode(page, 'svc-x');

    const colorsAfterReload = await page.evaluate(() => ({
      compA: globalThis.__cy.$id('comp-a').style('background-color'),
      compB: globalThis.__cy.$id('comp-b').style('background-color'),
      svcX: globalThis.__cy.$id('svc-x').style('background-color'),
    }));

    expect(colorsAfterReload.compA).toBe(colors.compA);
    expect(colorsAfterReload.compB).toBe(colors.compB);
    expect(colorsAfterReload.svcX).toBe(colors.svcX);
  });
});
