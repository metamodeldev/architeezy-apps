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

async function dblTapNode(page, pos) {
  await page.mouse.click(pos.x, pos.y);
  await page.mouse.click(pos.x, pos.y);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-2.6: Drill-Down Mode Activation', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-ecommerce');
    await waitForLoading(page);
    await waitForCyNode(page, 'pay-svc');
  });

  test('TC-2.6.1: Double-click on a node triggers drill-down mode', async ({ page }) => {
    const pos = await getNodePos(page, 'pay-svc');
    await dblTapNode(page, pos);

    await expect(page).toHaveURL(/entity=pay-svc/);
    await expect(page.locator('#drill-label')).toBeVisible();
    await expect(page.locator('#drill-label')).toHaveText('Payment Service');
    await expect(page.locator('#detail-panel .detail-name')).toHaveText('Payment Service');

    await page.locator('#drill-exit-btn').click();

    await expect(page.locator('#drill-label')).toHaveClass(/hidden/);
    await expect(page.locator('#crumb-entity-sep')).toHaveClass(/hidden/);
  });
});
