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

function getNodePositions(page, nodeIds) {
  return page.evaluate((ids) => {
    const positions = {};
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const node = globalThis.__cy.$id(id);
      if (node && node.length) {
        const pos = node.renderedPosition();
        positions[id] = { x: pos.x, y: pos.y };
      }
    }
    return positions;
  }, nodeIds);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-2.10: Layout Refresh', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
  });

  test('TC-2.10.1: Layout refresh re-applies the current layout algorithm', async ({ page }) => {
    // Capture initial positions of nodes
    const initialPositions = await getNodePositions(page, ['comp-a', 'comp-b', 'service-x']);

    // Click layout refresh button
    await page.locator('#refresh-layout-btn').click();

    // Wait for layout to complete (animation or sync)
    await page.waitForTimeout(1500);

    // Capture positions after refresh
    const newPositions = await getNodePositions(page, ['comp-a', 'comp-b', 'service-x']);

    // Verify that at least some nodes have changed position (layout re-applied)
    let positionsChanged = false;
    for (const id of ['comp-a', 'comp-b', 'service-x']) {
      const init = initialPositions[id];
      const curr = newPositions[id];
      if (init && curr && (init.x !== curr.x || init.y !== curr.y)) {
        positionsChanged = true;
        break;
      }
    }
    expect(positionsChanged).toBe(true);

    // All nodes should still be visible and have valid positions
    const positionsArray = Object.values(newPositions);
    for (let i = 0; i < positionsArray.length; i++) {
      const pos = positionsArray[i];
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.y).toBeGreaterThan(0);
    }
  });

  test('TC-2.10.2: Layout refresh preserves current zoom level', async ({ page }) => {
    // Set a non-default zoom level
    await page.evaluate(() => {
      globalThis.__cy.stop(false, true);
      globalThis.__cy.zoom(2.5);
    });

    const zoomBefore = await page.evaluate(() => globalThis.__cy.zoom());

    // Click refresh
    await page.locator('#refresh-layout-btn').click();
    await page.waitForTimeout(1500);

    // Zoom should be unchanged
    const zoomAfter = await page.evaluate(() => globalThis.__cy.zoom());
    expect(zoomAfter).toBeCloseTo(zoomBefore, 1);
  });

  test('TC-2.10.2b: Layout refresh preserves pan state', async ({ page }) => {
    // Pan the graph by moving it (use Cytoscape pan method)
    await page.evaluate(() => {
      globalThis.__cy.stop(false, true);
      const currentPan = globalThis.__cy.pan();
      globalThis.__cy.pan({
        x: currentPan.x + 100,
        y: currentPan.y + 100,
      });
    });

    const panBefore = await page.evaluate(() => globalThis.__cy.pan());

    // Click refresh
    await page.locator('#refresh-layout-btn').click();
    await page.waitForTimeout(1500);

    // Pan should remain unchanged
    const panAfter = await page.evaluate(() => globalThis.__cy.pan());
    expect(panAfter.x).toBeCloseTo(panBefore.x, 0);
    expect(panAfter.y).toBeCloseTo(panBefore.y, 0);
  });

  test('TC-2.10.3: Layout refresh resets manually dragged nodes to layout positions', async ({
    page,
  }) => {
    // Get initial position of Component A
    const initialPos = await page.evaluate(() => {
      const node = globalThis.__cy.$id('comp-a');
      return node ? node.renderedPosition() : null;
    });

    // Drag Component A to a new location
    const canvas = page.locator('#cy canvas');
    const box = await canvas.boundingBox();

    // Compute start and end points relative to canvas
    const startX = box.x + initialPos.x;
    const startY = box.y + initialPos.y;
    const endX = startX + 150;
    const endY = startY + 150;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(500);

    const draggedPos = await page.evaluate(() => {
      const node = globalThis.__cy.$id('comp-a');
      return node ? node.renderedPosition() : null;
    });

    // Position after drag should be different from initial
    expect(draggedPos.x).not.toBeCloseTo(initialPos.x, 1);
    expect(draggedPos.y).not.toBeCloseTo(initialPos.y, 1);

    // Click layout refresh
    await page.locator('#refresh-layout-btn').click();
    await page.waitForTimeout(1500);

    const refreshedPos = await page.evaluate(() => {
      const node = globalThis.__cy.$id('comp-a');
      return node ? node.renderedPosition() : null;
    });

    // After refresh, Component A should have moved away from manually dragged position
    expect(refreshedPos.x).not.toBeCloseTo(draggedPos.x, 1);
    expect(refreshedPos.y).not.toBeCloseTo(draggedPos.y, 1);
  });

  test('TC-2.10.4: Multiple rapid refresh clicks are handled gracefully without errors', async ({
    page,
  }) => {
    // Perform several rapid clicks on the refresh button
    const button = page.locator('#refresh-layout-btn');
    for (let i = 0; i < 5; i++) {
      await button.click();
      await page.waitForTimeout(100); // Short interval between clicks
    }

    // Wait for any ongoing layouts to settle
    await page.waitForTimeout(2000);

    // Graph should remain stable: visible nodes present
    const visibleNodeCount = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);
    expect(visibleNodeCount).toBeGreaterThan(0);

    // No error panel should be visible
    const errorMsg = page.locator('#error-msg.visible');
    await expect(errorMsg).not.toBeVisible();
  });
});
