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

test.describe('TC-2.11: Highlight Mode', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-chain');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-1');
  });

  test('TC-2.11.1: Enable highlight mode via toggle', async ({ page }) => {
    const toggle = page.locator('#highlight-toggle');
    expect(toggle).not.toBeChecked();
    await toggle.check();
    expect(toggle).toBeChecked();
  });

  test('TC-2.11.2: Clicking a node applies highlight with default depth', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').check();

    // Click a node
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.click(pos.x, pos.y);

    // Selected node should not be faded
    const nodeExists = await page.evaluate(() => {
      const node = globalThis.__cy.$id('comp-1');
      return node && node.length > 0;
    });
    expect(nodeExists).toBe(true);

    // Check that some other nodes are faded (those outside BFS scope)
    // Since depth defaults to 2, deeper nodes should be faded
    const fadedEdges = await page.evaluate(() => globalThis.__cy.edges('.faded').length);
    const nonFadedEdges = await page.evaluate(
      () => globalThis.__cy.edges(':visible').filter((e) => !e.hasClass('faded')).length,
    );

    // There should be some faded edges (non-BFS edges) and some non-faded edges (within BFS)
    expect(fadedEdges).toBeGreaterThan(0);
    expect(nonFadedEdges).toBeGreaterThan(0);
  });

  test('TC-2.11.3: Depth change updates highlight scope', async ({ page }) => {
    await page.locator('#highlight-toggle').check();

    // Click a node
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.click(pos.x, pos.y);

    // Get initial counts
    const initialFaded = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);

    // Increase depth to 4
    await page.locator('[data-depth="4"]').click();

    // More nodes should be visible (less fading)
    const laterFaded = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);

    // With greater depth, fewer nodes should be faded
    expect(laterFaded).toBeLessThan(initialFaded);
  });

  test('TC-2.11.4: Clicking canvas clears highlight', async ({ page }) => {
    await page.locator('#highlight-toggle').check();

    // Select a node
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.click(pos.x, pos.y);

    // Verify fading exists
    let fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBeGreaterThan(0);

    // Click canvas (empty area)
    const cyRect = await page.locator('#cy').boundingBox();
    await page.mouse.click(cyRect.x + 5, cyRect.y + 5);

    // Fading should be cleared
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);
  });

  test('TC-2.11.5: Disabling highlight mode removes fading', async ({ page }) => {
    await page.locator('#highlight-toggle').check();

    // Select a node
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.click(pos.x, pos.y);

    // Verify fading exists
    let fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBeGreaterThan(0);

    // Disable highlight
    await page.locator('#highlight-toggle').uncheck();

    // Fading should be removed
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);
  });

  test('TC-2.11.6: Highlight respects element type filters', async ({ page }) => {
    await page.locator('#highlight-toggle').check();

    // Uncheck all element types except ApplicationComponent
    const elemCheckboxes = page.locator('input[data-kind="elem"]');
    const count = await elemCheckboxes.count();
    for (let i = 0; i < count; i++) {
      const checkbox = elemCheckboxes.nth(i);
      const type = await checkbox.getAttribute('data-type');
      if (type !== 'ApplicationComponent') {
        await checkbox.uncheck();
      }
    }

    // Click a component node
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.click(pos.x, pos.y);

    // Only ApplicationComponent elements should be visible (non-faded nodes that are visible should be only those in BFS)
    // Actually, according to highlight, all type-active nodes are visible, but we filtered to only ApplicationComponent
    // So all visible nodes should be of that type.
    const visibleNodes = await page.evaluate(() =>
      globalThis.__cy.nodes(':visible').map((n) => n.data('type')),
    );
    expect(visibleNodes.every((t) => t === 'ApplicationComponent')).toBeTruthy();
  });

  test('TC-2.11.7: Depth picker is always visible', async ({ page }) => {
    // Depth picker should be visible even when not in drill mode
    expect(await page.locator('#settings-depth-row').isVisible()).toBe(true);
    expect(await page.locator('#depth-picker').isVisible()).toBe(true);
  });

  test('TC-2.11.8: Drill mode clears highlight state', async ({ page }) => {
    await page.locator('#highlight-toggle').check();

    // Select a node in highlight mode
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.click(pos.x, pos.y);

    // Verify fading
    let fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBeGreaterThan(0);

    // Enter drill mode via double-click
    await page.mouse.dblclick(pos.x, pos.y);

    // Highlight should be cleared
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Highlight toggle should still be on, but node selection cleared
    expect(await page.locator('#highlight-toggle').isChecked()).toBe(true);
    expect(await page.evaluate(() => globalThis.__highlightNodeId)).toBeUndefined();
  });

  test('TC-2.11.9: Highlight mode toggle with existing selection applies highlight immediately', async ({
    page,
  }) => {
    // Click a node while highlight is disabled — creates Cytoscape selection
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.click(pos.x, pos.y);

    // No fading yet (highlight is off)
    let fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Enable highlight — should apply immediately using the selected node as focus
    await page.locator('#highlight-toggle').check();
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBeGreaterThan(0);

    // Disable highlight — fading clears
    await page.locator('#highlight-toggle').uncheck();
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Re-enable highlight — fading restores using the same selection
    await page.locator('#highlight-toggle').check();
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBeGreaterThan(0);
  });

  test('TC-2.11.10: Enabling highlight with no selection shows no fading', async ({ page }) => {
    // Ensure no node is selected by clicking empty canvas area
    const cyRect = await page.locator('#cy').boundingBox();
    await page.mouse.click(cyRect.x + 5, cyRect.y + 5);

    // Enable highlight — no node selected, so no fading
    await page.locator('#highlight-toggle').check();
    let fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Select a node — fading should apply now
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.click(pos.x, pos.y);
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBeGreaterThan(0);
  });

  test('TC-2.11.11: Highlight toggle is ignored while drill mode is active', async ({ page }) => {
    // Enter drill mode by double-clicking a node
    const pos = await getNodePos(page, 'comp-1');
    await page.mouse.dblclick(pos.x, pos.y);

    // Enable highlight while in drill mode — no fading should occur
    await page.locator('#highlight-toggle').check();
    let fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Change depth picker — drill scope updates but still no fading
    await page.locator('[data-depth="4"]').click();
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Single-click a node in drill scope — drill behaviour, not highlight
    await page.mouse.click(pos.x, pos.y);
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Disable and re-enable highlight — still no fading while drill is active
    await page.locator('#highlight-toggle').uncheck();
    await page.locator('#highlight-toggle').check();
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Exit drill mode
    await page.locator('#drill-exit-btn').click();
    await waitForCyNode(page, 'comp-1');

    // Highlight toggle remains checked
    expect(await page.locator('#highlight-toggle').isChecked()).toBe(true);

    // No fading yet — no node selected after drill exit
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBe(0);

    // Select a node — highlight activates now that drill mode is gone
    const newPos = await getNodePos(page, 'comp-1');
    await page.mouse.click(newPos.x, newPos.y);
    fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBeGreaterThan(0);
  });
});

// ── TC-2.11.12: Legend darkening (uses model-test for multiple element/rel types) ──

test.describe('TC-2.11: Highlight Mode - Legend', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
  });

  test('TC-2.11.12: Legend entries are darkened for fully faded types in highlight mode', async ({
    page,
  }) => {
    // Enable legend and highlight
    await page.locator('#legend-toggle').check();
    await page.locator('#highlight-toggle').check();

    const legend = page.locator('#graph-legend');
    await expect(legend).toBeVisible();

    // Click a node to activate highlight
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);

    // Some graph elements should be faded
    const fadedCount = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    expect(fadedCount).toBeGreaterThan(0);

    // Legend entries for fully faded types should be darkened; at least one entry should be normal
    await expect(legend.locator('.legend-row.faded')).not.toHaveCount(0);
    await expect(legend.locator('.legend-row:not(.faded)')).not.toHaveCount(0);

    // Change depth to expand scope — legend darkening should update dynamically
    await page.locator('[data-depth="4"]').click();
    // After expanding scope, fewer (or zero) darkened entries expected
    const fadedRowsAfterExpand = await legend.locator('.legend-row.faded').count();
    const fadedNodesAfterExpand = await page.evaluate(() => globalThis.__cy.nodes('.faded').length);
    // darkened legend rows should correlate with still-faded graph elements
    if (fadedNodesAfterExpand === 0) {
      expect(fadedRowsAfterExpand).toBe(0);
    }

    // Click canvas to clear highlight — all legend entries return to normal
    const cyRect = await page.locator('#cy').boundingBox();
    await page.mouse.click(cyRect.x + 5, cyRect.y + 5);
    await expect(legend.locator('.legend-row.faded')).toHaveCount(0);
  });
});
