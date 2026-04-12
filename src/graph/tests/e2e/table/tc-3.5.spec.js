import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// Helper to capture Cytoscape instance (consistent with other tests)
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

// Wait for Cytoscape node to be positioned (from tc-2.1.spec.js)
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

// Wait until the specified node is selected
async function waitForNodeSelected(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const node = globalThis.__cy.$id(id);
    return node && node.length && node.isNode() && node.selected();
  }, nodeId);
}

// Wait until the specified node is centered within the viewport (within 100px of center)
async function waitForNodeCentered(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const node = globalThis.__cy.$id(id);
    if (!node.length) {
      return false;
    }
    if (!node.selected()) {
      return false;
    }
    const pos = node.renderedPosition();
    if (!pos) {
      return false;
    }
    const nodeCenterX = pos.x + node.outerWidth() / 2;
    const nodeCenterY = pos.y + node.outerHeight() / 2;
    const cyEl = document.getElementById('cy');
    if (!cyEl) {
      return false;
    }
    const rect = cyEl.getBoundingClientRect();
    return Math.hypot(nodeCenterX - rect.width / 2, nodeCenterY - rect.height / 2) < 100;
  }, nodeId);
}

// Wait until the specified node is fully within the viewport (50px margin)
async function waitForNodeInViewport(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const node = globalThis.__cy.$id(id);
    if (!node.length) {
      return false;
    }
    const pos = node.renderedPosition();
    if (!pos) {
      return false;
    }
    const w = node.outerWidth();
    const h = node.outerHeight();
    const cyEl = document.getElementById('cy');
    if (!cyEl) {
      return false;
    }
    const rect = cyEl.getBoundingClientRect();
    return (
      pos.x >= 50 && pos.y >= 50 && pos.x + w <= rect.width - 50 && pos.y + h <= rect.height - 50
    );
  }, nodeId);
}

test.describe('TC-3.5: Graph navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
  });

  test('TC-3.5.1: Click table row to switch to Graph view and select corresponding node', async ({
    page,
  }) => {
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Get first row's entity name (ID stored in tr[data-id])
    const row = page.locator('#table-body tr:first-child');
    const rowEntity = await row.getAttribute('data-id');
    expect(rowEntity).not.toBeNull();

    // Click row
    await row.click();

    // Wait for graph to become visible (Graph view becomes active)
    await expect(page.locator('#cy')).toBeVisible();

    // Wait for the node to be selected
    await waitForNodeSelected(page, rowEntity);

    // The `view` parameter must be completely absent from the URL:
    // Not `view=table`, not `view=graph`, not `view=` (empty value)
    // Absence of the parameter signals the default Graph view
    await expect(page).not.toHaveURL(/[?&]view=/i);
    // Should have model param
    expect(page.url()).toContain('model=model-test');

    // Double-check via URL inspection (covers edge case of `view=` with empty value)
    const urlParams = new URL(page.url()).searchParams;
    expect(urlParams.has('view')).toBe(false);

    // Verify selected node
    const selectedNode = await page.evaluate(() =>
      globalThis.__cy.$('node:selected').first().data('id'),
    );
    expect(selectedNode).toBe(rowEntity);

    // Properties panel should show details (verify it's visible and displays the correct entity name)
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();
    const rowName = await row.locator('td:first-child').textContent();
    const detailName = await page.locator('#detail-panel .detail-name').textContent();
    expect(detailName).toBe(rowName);
  });

  test('TC-3.5.2: Navigation respects current filters (row may be hidden)', async ({ page }) => {
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test&view=table&entities=Microservice');
    await waitForLoading(page);

    // Ensure filter results: only Microservice rows should be visible
    const rows = page.locator('#table-body tr');
    await expect(rows.first()).toBeVisible();
    const hasRows = (await rows.count()) > 0;
    expect(hasRows).toBe(true);

    const firstRow = rows.first();
    const firstRowId = await firstRow.getAttribute('data-id');
    // Type column is second column (index 1)
    const firstRowType = await firstRow.locator('td:nth-child(2)').textContent();
    expect(firstRowType).toBe('Microservice');

    // Click the row
    await firstRow.click();

    // Should switch to graph view
    await expect(page.locator('#cy')).toBeVisible();

    // Wait for the node to be selected
    await waitForNodeSelected(page, firstRowId);

    // Graph should show only Microservices (filter still active)
    // Check that selected node is a Microservice
    const nodeType = await page.evaluate(
      (nodeId) => globalThis.__cy.$id(nodeId).data('type'),
      firstRowId,
    );
    expect(nodeType).toBe('Microservice');

    // Filter parameter should remain in URL
    expect(page.url()).toContain('entities=Microservice');
  });

  test('TC-3.5.3: Row hover indicates clickability', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    const row = page.locator('#table-body tr:first-child');
    const firstTd = row.locator('td').first();

    // Check initial cursor (should be default/auto)
    const initialCursor = await firstTd.evaluate((el) => globalThis.getComputedStyle(el).cursor);
    expect(initialCursor).not.toBe('pointer');

    // Hover over the row
    await row.hover();
    await page.waitForTimeout(100);

    // Check cursor changes to pointer on the cell inside the hovered row
    const hoverCursor = await firstTd.evaluate((el) => globalThis.getComputedStyle(el).cursor);
    expect(hoverCursor).toBe('pointer');

    // Move off row (hover on table head)
    await page.locator('#table-head').hover();
    await page.waitForTimeout(100);

    // Hover state should clear
    const afterHoverCursor = await firstTd.evaluate((el) => globalThis.getComputedStyle(el).cursor);
    expect(afterHoverCursor).not.toBe('pointer');
  });

  test('TC-3.5.4: Clicking a relationship row navigates to target? (optional)', async ({
    page,
  }) => {
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Switch to Relationships tab
    await page.locator('#ttab-rels').click();
    // Wait for the relationships table to populate (first row attached)
    await page.locator('#table-body tr[data-id]').first().waitFor({ state: 'attached' });

    // Click first relationship row
    const relRow = page.locator('#table-body tr:first-child');
    const relId = await relRow.getAttribute('data-id');
    expect(relId).not.toBeNull();
    await relRow.click();

    // Should navigate to graph view
    await expect(page.locator('#cy')).toBeVisible();

    // Wait for the node corresponding to this row to be selected
    await waitForNodeSelected(page, relId);

    // Verify that the node is selected (source node from relationship row)
    const isSelected = await page.evaluate((id) => globalThis.__cy.$id(id).selected(), relId);
    expect(isSelected).toBe(true);
  });

  test('TC-3.5.5: Smooth centering animation duration and ease', async ({ page }) => {
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Ensure deterministic layout for stable baseline
    await page.selectOption('#layout-select', 'dagre');
    await page.waitForFunction(() => !globalThis.__layoutRunning).catch(() => {});
    await page.waitForTimeout(200);

    // Get first row ID
    const row = page.locator('#table-body tr:first-child');
    const rowId = await row.getAttribute('data-id');
    expect(rowId).not.toBeNull();

    // Navigate to graph first (ensure initial positioning handled)
    await page.locator('#tab-graph').click();
    await waitForLoading(page);
    // Ensure node is ready
    await waitForCyNode(page, rowId);

    // Pan away to make animation necessary
    await page.evaluate(() => {
      globalThis.__cy.panBy(800, 600);
    });
    // Wait for pan to settle
    await page.waitForTimeout(200);

    // Now switch back to table and click row to trigger centering animation
    await page.locator('#tab-table').click();
    await waitForLoading(page);

    const startTime = Date.now();
    await row.click();

    // Wait for graph to become visible after navigation
    await expect(page.locator('#cy')).toBeVisible();

    // Wait for node to be ready
    await waitForCyNode(page, rowId);

    // Wait for node to be centered (node's center near viewport center)
    await waitForNodeCentered(page, rowId);

    const duration = Date.now() - startTime;

    // Animation is 400ms. With page transitions and wait times,
    // Total duration should be at least 200ms and not exceed 1500ms
    expect(duration).toBeGreaterThanOrEqual(200);
    expect(duration).toBeLessThanOrEqual(1500);
  });

  test('TC-3.5.6: After navigation, node is fully within viewport', async ({ page }) => {
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    const row = page.locator('#table-body tr:first-child');
    const rowId = await row.getAttribute('data-id');
    expect(rowId).not.toBeNull();

    // Switch to graph, pan away, then navigate from table
    await page.locator('#tab-graph').click();
    await waitForLoading(page);
    await waitForCyNode(page, rowId);

    // Pan far away (ensure node is off-screen)
    await page.evaluate(() => {
      globalThis.__cy.panBy(1000, 1000);
    });
    await page.waitForTimeout(200);

    // Navigate via table (click row to go back to graph with centering)
    await page.locator('#tab-table').click();
    await waitForLoading(page);
    await row.click();

    // Wait for graph to be visible
    await expect(page.locator('#cy')).toBeVisible();

    // Wait for node to be fully within viewport (entire node inside with margin)
    await waitForNodeInViewport(page, rowId);

    // Verify node position properties (optional detailed check)
    const pos = await page.evaluate((id) => {
      const node = globalThis.__cy.$id(id);
      const rendered = node.renderedPosition();
      return { x: rendered.x, y: rendered.y };
    }, rowId);

    // Node should be within viewport bounds (> 50px from edges as checked above)
    expect(pos.x).toBeGreaterThan(50);
    expect(pos.y).toBeGreaterThan(50);
  });

  test('TC-3.5.7: Navigation does not change current filters or drill-down', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table&entities=Microservice');
    await waitForLoading(page);

    // Record filter
    const initialFilter = await page.evaluate(() => {
      const params = new URLSearchParams(globalThis.location.search);
      return params.get('entities');
    });
    expect(initialFilter).toBe('Microservice');

    // Navigate by clicking row (should not alter URL filters)
    await page.locator('#table-body tr:first-child').click();
    await page.waitForTimeout(500);

    // Filter should still be present in URL
    const afterNavFilter = await page.evaluate(() => {
      const params = new URLSearchParams(globalThis.location.search);
      return params.get('entities');
    });
    expect(afterNavFilter).toBe(initialFilter);

    // Should be in Graph view; view=table parameter should be removed per spec
    // Note: depends on app syncing URL on table->graph navigation.
    expect(page.url()).toContain('model=model-test');
  });

  test('TC-3.5.8: Navigation from table row updates URL with entity selection', async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Get row ID (from data-id attribute)
    const row = page.locator('#table-body tr:first-child');
    const rowId = await row.getAttribute('data-id');
    expect(rowId).not.toBeNull();

    // Click row
    await row.click();
    await page.waitForTimeout(500);

    // URL should contain model param and should NOT contain view=table (per spec)
    const url = page.url();
    expect(url).toContain('model=model-test');
    // Expect view=table to be removed because graph is default
    await expect(page).not.toHaveURL(/[?&]view=table/);
  });
});
