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

test.describe('TC-2.8: State Preserved Across View Switches', () => {
  test('TC-2.8.1: Zoom and pan state preserved across view switch', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      globalThis.__cy.zoom(2.5);
    });

    await page.locator('#tab-table').click();
    await page.locator('#tab-graph').click();

    const zoom = await page.evaluate(() => globalThis.__cy.zoom());
    expect(zoom).toBeCloseTo(2.5, 1);
  });

  test('TC-2.8.2: Selected node state preserved across view switch', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-ecommerce');
    await waitForLoading(page);
    await waitForCyNode(page, 'pay-svc');

    const pos = await getNodePos(page, 'pay-svc');
    await page.mouse.click(pos.x, pos.y);
    await expect(page.locator('#detail-panel .detail-name')).toHaveText('Payment Service');

    await page.locator('#tab-table').click();
    await page.locator('#tab-graph').click();

    await expect(page.locator('#detail-panel .detail-name')).toHaveText('Payment Service');
  });
});
