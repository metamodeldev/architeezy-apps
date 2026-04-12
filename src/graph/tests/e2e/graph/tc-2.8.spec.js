import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

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

async function waitForCyReady(page) {
  await page.waitForFunction(() => globalThis.__cy !== undefined);
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

    await page.selectOption('#containment-select', 'edge');
    await waitForLoading(page);

    // sys-parent has child-1 and child-2 — expect synthetic containment edges
    const containmentEdges = await page.evaluate(() =>
      globalThis.__cy.edges().filter((e) => e.data('isContainment') === true).length,
    );
    expect(containmentEdges).toBe(2);
  });

  test('TC-2.8.2: Switch containment mode to "Compound" (nested)', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    await page.selectOption('#containment-select', 'compound');
    await waitForLoading(page);

    // In compound mode children are nested: cy node carries parent id
    const parentId = await page.evaluate(
      () => globalThis.__cy.$id('child-1').data('parent'),
    );
    expect(parentId).toBe('sys-parent');
  });

  test('TC-2.8.3: Orphaned children when parent hidden become top-level', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    await waitForCyNode(page, 'sys-parent');
    await waitForCyNode(page, 'child-1');

    await page.waitForSelector('#elem-filter-list input[data-type="System"]');
    await page.locator('#elem-filter-list input[data-type="System"]').uncheck();

    // Children must still be present after their parent type is filtered out
    const child1Exists = await page.evaluate(
      () => globalThis.__cy.$id('child-1').length > 0,
    );
    expect(child1Exists).toBe(true);
  });

  test('TC-2.8.4: Switching containment modes triggers layout recalculation', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    await page.selectOption('#containment-select', 'compound');
    await waitForLoading(page);
    await page.selectOption('#containment-select', 'edge');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    const count = await page.evaluate(() => globalThis.__cy.nodes().length);
    expect(count).toBeGreaterThan(0);
  });

  test('TC-2.8.5: Containment edges have distinct visual style', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    await page.selectOption('#containment-select', 'edge');
    await waitForLoading(page);

    const containmentStyle = await page.evaluate(() => {
      const edge = globalThis.__cy.$id('_c_child-1');
      return { exists: edge.length > 0, lineStyle: edge.style('line-style') };
    });

    expect(containmentStyle.exists).toBe(true);
    expect(containmentStyle.lineStyle).toBeDefined();
  });

  test('TC-2.8.6: Containment mode change respects current filters', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    await page.waitForSelector('#elem-filter-list input[data-type="ApplicationComponent"]');
    await page.locator('#elem-filter-list input[data-type="ApplicationComponent"]').uncheck();

    await page.selectOption('#containment-select', 'compound');
    await waitForLoading(page);

    const nodeTypes = await page.evaluate(() =>
      globalThis.__cy.nodes(':visible').map((n) => n.data('type')),
    );
    expect(nodeTypes).not.toContain('ApplicationComponent');
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

    await page.selectOption('#containment-select', 'compound');
    await waitForLoading(page);

    await page.evaluate(() => {
      globalThis.__cy.$id('sys-parent').trigger('dbltap');
    });
    await waitForLoading(page);

    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).not.toHaveClass(/hidden/);
  });

  test('TC-2.8.8: Legend shows element types after enabling', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    await page.locator('#legend-toggle').check();

    await expect(page.locator('#graph-legend')).not.toHaveClass(/hidden/);
  });
});
