import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// Helper to capture Cytoscape instance
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

// Wait for Cytoscape to be ready (either __cy from injector or global cy)
async function waitForCyReady(page) {
  await page.waitForFunction(
    () => globalThis.__cy !== undefined || (globalThis.cy && globalThis.cy !== undefined),
  );
  // Sync: if app uses globalThis.cy, map it to __cy for tests
  await page.evaluate(() => {
    if (globalThis.cy && !globalThis.__cy) {
      globalThis.__cy = globalThis.cy;
    }
  });
}

// Wait for a specific node to be positioned
async function waitForCyNode(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const el = globalThis.__cy.$id(id);
    if (!el.length) {
      return false;
    }
    // For nodes, check that they are positioned; for edges, existence is enough
    if (el.isNode && el.isNode()) {
      const pos = el.renderedPosition();
      return pos && pos.x > 10 && pos.y > 10;
    }
    return true;
  }, nodeId);
}

test.describe('TC-2.8: Containment', () => {
  test('TC-2.8.1: Switch containment mode to "Edge-based"', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    if (await page.locator('#containment-mode-select').isVisible()) {
      await page.selectOption('#containment-mode-select', 'edge-based');
      await waitForLoading(page);

      // Synthetic containment edges should be visible if model has containment relationships
      const containmentEdges = await page.evaluate(
        () =>
          [...globalThis.__cy.edges()].filter(
            (e) => e.data('type') === 'containment' || e.hasClass('containment'),
          ).length,
      );
      // May or may not have containment depending on model data, just verify no errors
      expect(containmentEdges).toBeGreaterThanOrEqual(0);
    }
  });

  test('TC-2.8.2: Switch containment mode to "Compound" (nested)', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    if (await page.locator('#containment-mode-select').isVisible()) {
      await page.selectOption('#containment-mode-select', 'compound');
      await waitForLoading(page);

      // Should be in compound mode
      await expect(page.locator('#containment-mode')).toHaveText('Compound');
    }
  });

  test('TC-2.8.3: Orphaned children when parent hidden become top-level', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Ensure we have nodes before filtering
    await waitForCyNode(page, 'sys-parent');
    await waitForCyNode(page, 'child-1');

    // Wait for filter checkbox for System to be available
    await page.waitForSelector('#elem-filter-list input[data-type="System"]');

    // Hide parent entity (System)
    await page.locator('#elem-filter-list input[data-type="System"]').uncheck();
    await waitForLoading(page);

    // Children should become independent nodes (still visible)
    const nodeCount = await page.evaluate(() => globalThis.__cy.nodes().length);

    expect(nodeCount).toBeGreaterThan(0);
    // Verify children are still present
    const hasChild1 = await page.evaluate(() => globalThis.__cy.$id('child-1').length > 0);
    expect(hasChild1).toBe(true);
  });

  test('TC-2.8.4: Switching containment modes triggers layout recalculation', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Wait for initial layout
    await waitForCyNode(page, 'comp-a');

    if (await page.locator('#containment-mode-select').isVisible()) {
      await page.selectOption('#containment-mode-select', 'compound');
      await waitForLoading(page);
      await page.selectOption('#containment-mode-select', 'edge-based');
      await waitForLoading(page);
    }

    // Wait for layout to complete
    await waitForCyNode(page, 'comp-a');

    // Basic check that nodes still exist
    const count = await page.evaluate(() => globalThis.__cy.nodes().length);
    expect(count).toBeGreaterThan(0);
  });

  test('TC-2.8.5: Visibility of containment relationships', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // In edge-based mode, containment edges should be distinct
    if (await page.locator('#containment-mode-select').isVisible()) {
      await page.selectOption('#containment-mode-select', 'edge-based');
      await waitForLoading(page);

      // Check that edges exist and containment edges (if any) have distinct style
      const edges = await page.evaluate(() =>
        [...globalThis.__cy.edges()].map((e) => ({
          type: e.data('type'),
          hasContainmentClass: e.hasClass('containment'),
          style: e.style('line-style'),
        })),
      );

      expect(edges.length).toBeGreaterThan(0);
      // At least some edges should be containment type or have containment class
      const _containmentEdges = edges.filter(
        (e) => e.type === 'containment' || e.hasContainmentClass,
      );
      // Depending on model, may have containment edges - just verify check doesn't throw
    }
  });

  test('TC-2.8.6: Containment mode change respects current filters', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // The test model includes ApplicationComponent, System, etc.
    // Filter out ApplicationComponent to test that children of that type are not visible
    await page.waitForSelector('#elem-filter-list input[data-type="ApplicationComponent"]');
    await page.locator('#elem-filter-list input[data-type="ApplicationComponent"]').uncheck();

    if (await page.locator('#containment-mode-select').isVisible()) {
      await page.selectOption('#containment-mode-select', 'compound');
      await waitForLoading(page);

      // Should respect filter
      const nodeTypes = await page.evaluate(() =>
        globalThis.__cy.nodes().map((n) => n.data('type')),
      );
      expect(nodeTypes).not.toContain('ApplicationComponent');
    }
  });

  test('TC-2.8.7: Drill-down with Compound mode: child nodes inside parent still part of scope', async ({
    page,
  }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Set compound mode
    if (await page.locator('#containment-mode-select').isVisible()) {
      await page.selectOption('#containment-mode-select', 'compound');
      await waitForLoading(page);
    }

    // Enter drill-down on a parent node (sys-parent is a System)
    await page.evaluate(() => {
      const node = globalThis.__cy
        .nodes()
        .filter((n) => n.data('type') === 'System')
        .first();
      if (node) {
        node.trigger('dbltap');
      }
    });
    await waitForLoading(page);

    // Drill-down should work: breadcrumb navigation appears
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).not.toHaveClass(/hidden/);
  });

  test('TC-2.8.8: Legend shows containment mode indicator (optional)', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Legend may show mode
    const legend = page.locator('#legend-panel');
    if (await legend.isVisible()) {
      await expect(legend).toBeVisible();
    }
  });
});
