import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Injects a wrapper around the `cytoscape` global before the page scripts load. Whenever a new
 * Cytoscape instance is created (i.e. `cytoscape({container, ...})` returns a cy core object), the
 * wrapper stores it in `globalThis.__cy`. This avoids modifying any application code while still
 * giving tests reliable access to the instance.
 *
 * Must be called with `await` before `page.goto`.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 */
async function injectCyCapture(page) {
  await page.addInitScript(() => {
    // Intercept the `window.cytoscape = fn` assignment made by the CDN script.
    // Wrap the factory so every created cy instance is stored in globalThis.__cy.
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

/**
 * Waits until the Cytoscape node has a rendered position, indicating layout has run and the node is
 * placed on the canvas.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string} nodeId - Cytoscape node ID to wait for.
 */
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

/**
 * Returns the absolute page coordinates of the centre of a Cytoscape node.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string} nodeId - Cytoscape node ID.
 * @returns {Promise<{ x: number; y: number }>} Absolute page coordinates of the node centre.
 */
function getNodePos(page, nodeId) {
  return page.evaluate((id) => {
    const pos = globalThis.__cy.$id(id).renderedPosition();
    const rect = document.getElementById('cy').getBoundingClientRect();
    return { x: rect.left + pos.x, y: rect.top + pos.y };
  }, nodeId);
}

/**
 * Clicks near the top-left corner of the Cytoscape canvas, which is empty for small models centered
 * by fit-to-viewport.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 */
async function clickEmptyCanvas(page) {
  const rect = await page.locator('#cy').boundingBox();
  await page.mouse.click(rect.x + 5, rect.y + 5);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-2.5: Node Selection and Details Panel', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-ecommerce');
    await waitForLoading(page);
    await waitForCyNode(page, 'pay-svc');
  });

  test('TC-2.5.1: Selecting a node opens the details panel', async ({ page }) => {
    const pos = await getNodePos(page, 'pay-svc');
    await page.mouse.click(pos.x, pos.y);
    await expect(page.locator('#detail-panel .detail-name')).toHaveText('Payment Service');
    await expect(page.locator('#detail-panel .detail-type')).toContainText('ApplicationComponent');
    await expect(page.locator('#detail-panel .detail-doc')).toHaveText(
      'Handles payment processing',
    );
    await expect(page.locator('#detail-panel .detail-conn')).toContainText('Order Database');
    await expect(page.locator('#detail-panel .detail-conn')).toContainText('UsedByRelationship');

    await clickEmptyCanvas(page);

    await expect(page.locator('#detail-panel .detail-empty')).toBeVisible();
  });
});
