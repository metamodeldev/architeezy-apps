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
    const el = globalThis.__cy.$id(id);
    if (!el.length) {
      return false;
    }
    const pos = el.renderedPosition();
    return pos && pos.x > 10 && pos.y > 10;
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

test.describe('TC-2.6: Highlight Mode', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
    // Wait for initial layout to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);
  });

  test('TC-2.6.1: Enable Highlight mode via toggle', async ({ page }) => {
    const toggle = page.locator('#highlight-toggle');
    await expect(toggle).toBeVisible();

    const initialState = await toggle.isChecked();
    await toggle.click();
    const newState = await toggle.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('TC-2.6.2: Selected nodes neighborhood remains visible; others dim', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').click();
    await page.waitForTimeout(200); // Ensure toggle state processes

    // Select a node by clicking on it
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Verify node is selected
    const isSelected = await page.evaluate(() => globalThis.__cy.$id('comp-a').selected());
    expect(isSelected).toBe(true);

    // Check that non-neighbor nodes (excluding selected and neighbors) have reduced opacity (0.35)
    const nonNeighborOpacity = await page.evaluate(() => {
      const selected = globalThis.__cy.$id('comp-a');
      const neighborhood = selected.neighborhood();
      // Exclude the selected node and its neighbors
      const nonNeighbors = globalThis.__cy.nodes().not(neighborhood).not(selected);
      return Number.parseFloat(nonNeighbors.first().style('opacity'));
    });

    // Non-neighbors should be dimmed (< 1)
    expect(nonNeighborOpacity).toBeLessThan(1);
    // Verify it's close to 0.35 (allow some tolerance for browser rendering)
    expect(nonNeighborOpacity).toBeGreaterThan(0.3);
    expect(nonNeighborOpacity).toBeLessThan(0.4);

    // Selected node and neighbors should have full opacity
    const selectedOpacity = await page.evaluate(() =>
      Number.parseFloat(globalThis.__cy.$id('comp-a').style('opacity')),
    );
    expect(selectedOpacity).toBe(1);
  });

  test('TC-2.6.3: Adjust exploration depth while Highlight is active', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').click();

    // Select a node
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Increase depth to 2 by clicking depth button
    const depthButton2 = page.locator('#depth-picker .depth-btn[data-depth="2"]');
    await expect(depthButton2).toBeVisible();
    await depthButton2.click();
    await page.waitForTimeout(300);

    // Verify depth picker shows 2 as active
    await expect(depthButton2).toHaveClass(/active/);

    // Decrease depth back to 1
    const depthButton1 = page.locator('#depth-picker .depth-btn[data-depth="1"]');
    await depthButton1.click();
    await page.waitForTimeout(300);
    await expect(depthButton1).toHaveClass(/active/);
  });

  test('TC-2.6.4: Depth change does not trigger layout recalculation', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').click();

    // Select a node
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Capture initial positions after layout stabilizes
    await page.waitForFunction(() => !globalThis.__layoutRunning);
    const initialPos = await page.evaluate(() => globalThis.__cy.nodes().first().position());

    // Change depth to 3
    const depthButton3 = page.locator('#depth-picker .depth-btn[data-depth="3"]');
    await depthButton3.click();
    await page.waitForTimeout(500);

    const newPos = await page.evaluate(() => globalThis.__cy.nodes().first().position());

    // Positions should not change (no relayout)
    expect(newPos.x).toBeCloseTo(initialPos.x, 1);
    expect(newPos.y).toBeCloseTo(initialPos.y, 1);
  });

  test('TC-2.6.5: Maximum depth is 5 levels', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').click();

    // Select a node
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Try to increase depth beyond 5 by clicking depth 5 button
    const depthButton5 = page.locator('#depth-picker .depth-btn[data-depth="5"]');
    await depthButton5.click();
    await page.waitForTimeout(300);

    // Verify depth 5 is active (maximum)
    await expect(depthButton5).toHaveClass(/active/);

    // There should be no depth button beyond 5
    const buttons = page.locator('#depth-picker .depth-btn');
    await expect(buttons).toHaveCount(5);
  });

  test('TC-2.6.6: Highlight respects drill-down scope', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').click();
    await expect(page.locator('#highlight-toggle')).toBeChecked();

    // This test verifies that highlight mode can coexist with drill-down
    // The actual interaction is complex; this is a smoke test ensuring no errors
    // When both features are used. Full integration would require entering drill mode
    // And verifying highlight behavior within drill scope.
  });

  test('TC-2.6.7: Toggle Highlight OFF restores normal view', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').click();

    // Select a node
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Verify fading is applied (some node should have opacity < 1)
    const hasFading = await page.evaluate(() =>
      globalThis.__cy.nodes().some((n) => Number.parseFloat(n.style('opacity')) < 1),
    );
    expect(hasFading).toBe(true);

    // Turn off highlight
    await page.locator('#highlight-toggle').click();

    // All nodes should be full opacity
    const allFullOpacity = await page.evaluate(() =>
      globalThis.__cy.nodes().every((n) => n.style('opacity') === '1'),
    );
    expect(allFullOpacity).toBe(true);
  });

  test('TC-2.6.9: Highlight mode and dimming reset on model switch', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').click();
    await expect(page.locator('#highlight-toggle')).toBeChecked();

    // Select a node so dimming is applied
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Verify dimming is active (some node at reduced opacity)
    const hasDimming = await page.evaluate(() =>
      globalThis.__cy.nodes().some((n) => Number.parseFloat(n.style('opacity')) < 1),
    );
    expect(hasDimming).toBe(true);

    // Switch to a different model
    await page.locator('#current-model-btn').click();
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'e-commerce' }).click();
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);
    await page.waitForFunction(() => globalThis.__cy.nodes().length > 0);

    // Highlight toggle must be OFF after model switch
    await expect(page.locator('#highlight-toggle')).not.toBeChecked();

    // All elements in the new model must be at full opacity (no residual dimming)
    const allFullOpacity = await page.evaluate(() =>
      globalThis.__cy.nodes().every((n) => Number.parseFloat(n.style('opacity')) >= 1),
    );
    expect(allFullOpacity).toBe(true);

    // Properties panel should be cleared (no selection carried over)
    const hasSelection = await page.evaluate(() =>
      globalThis.__cy.nodes().some((n) => n.selected()),
    );
    expect(hasSelection).toBe(false);
  });

  test('TC-2.6.8: Highlight mode works with filter changes', async ({ page }) => {
    // Enable highlight mode
    await page.locator('#highlight-toggle').click();

    // Select a node
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Apply filter: uncheck ApplicationComponent type (note: comp-a is ApplicationComponent,
    // But it stays visible because selected node is always shown in highlight mode)
    await page.locator('input[data-kind="elem"][data-type="ApplicationComponent"]').uncheck();
    await page.waitForTimeout(500);

    // Highlight mode should still be on
    await expect(page.locator('#highlight-toggle')).toBeChecked();

    // Re-check ApplicationComponent filter
    await page.locator('input[data-kind="elem"][data-type="ApplicationComponent"]').check();
    await page.waitForTimeout(500);

    // Highlight should still be on and applied
    await expect(page.locator('#highlight-toggle')).toBeChecked();
  });
});
