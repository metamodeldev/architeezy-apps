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

function getNodePos(page, nodeId) {
  return page.evaluate((id) => {
    const pos = globalThis.__cy.$id(id).renderedPosition();
    const rect = document.getElementById('cy').getBoundingClientRect();
    return { x: rect.left + pos.x, y: rect.top + pos.y };
  }, nodeId);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-2.4: Zoom and Pan Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
  });

  test('TC-2.4.1: Mouse-wheel zoom changes zoom level', async ({ page }) => {
    const initialZoom = await page.evaluate(() => globalThis.__cy.zoom());

    const pos = await getNodePos(page, 'comp-a');

    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line oxlint/no-await-in-loop
      await page.mouse.wheel(pos.x, pos.y, { deltaY: -120 });
    }

    await page.waitForTimeout(300);

    const zoomedInLevel = await page.evaluate(() => globalThis.__cy.zoom());
    expect(zoomedInLevel).toBeGreaterThan(initialZoom);

    for (let i = 0; i < 6; i++) {
      // eslint-disable-next-line oxlint/no-await-in-loop
      await page.mouse.wheel(pos.x, pos.y, { deltaY: 120 });
    }

    await page.waitForTimeout(300);

    const zoomedOutLevel = await page.evaluate(() => globalThis.__cy.zoom());
    const minZoom = await page.evaluate(() => globalThis.__cy.minZoom());
    expect(zoomedOutLevel).toBeGreaterThanOrEqual(minZoom);
  });

  test('TC-2.4.2: Fit-to-view button shows all nodes', async ({ page }) => {
    await page.evaluate(() => {
      globalThis.__cy.stop(false, true);
      globalThis.__cy.zoom(4);
    });

    await page.locator('#fit-cy-btn').click();

    const visibleNodeCount = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);
    expect(visibleNodeCount).toBe(3);
  });
});
