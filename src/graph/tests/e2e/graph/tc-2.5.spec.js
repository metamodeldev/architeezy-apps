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
    return pos !== undefined;
  }, nodeId);
}

async function waitForCyEdge(page, edgeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const edge = globalThis.__cy.$id(id);
    return edge.length > 0;
  }, edgeId);
}

function getNodePos(page, nodeId) {
  return page.evaluate((id) => {
    const pos = globalThis.__cy.$id(id).renderedPosition();
    const rect = document.getElementById('cy').getBoundingClientRect();
    return { x: rect.left + pos.x, y: rect.top + pos.y };
  }, nodeId);
}

async function clickEmptyCanvas(page) {
  const rect = await page.locator('#cy').boundingBox();
  await page.mouse.click(rect.x + 5, rect.y + 5);
}

async function setupGraphPage(page) {
  await injectCyCapture(page);
  await mockApi(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/graph/?model=model-test');
  await waitForLoading(page);
}

async function clickEdgeSourceLinkAndVerify(page) {
  const sourceLink = page.locator('#detail-panel').getByText('Component A').first();
  await sourceLink.click();
  await page.waitForTimeout(500);
  const isCompASelected = await page.evaluate(() => globalThis.__cy.$id('comp-a').selected());
  expect(isCompASelected).toBe(true);
  const isRelStillSelected = await page.evaluate(() => globalThis.__cy.$id('rel-1').selected());
  expect(isRelStillSelected).toBe(false);
}

test.describe('TC-2.5: Selection', () => {
  test('TC-2.5.1: Select a node to highlight and show properties', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    // Wait for initial layout animation to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Capture camera position before click
    const panBefore = await page.evaluate(() => globalThis.__cy.pan());

    // Select node by clicking on it
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Node should be highlighted
    const isSelected = await page.evaluate(() => globalThis.__cy.$id('comp-a').selected());
    expect(isSelected).toBe(true);

    // Properties panel should open
    await expect(page.locator('#detail-panel')).toBeVisible();

    // Camera must not move when clicking a node directly
    const panAfter = await page.evaluate(() => globalThis.__cy.pan());
    expect(panAfter.x).toBeCloseTo(panBefore.x, 0);
    expect(panAfter.y).toBeCloseTo(panBefore.y, 0);

    // Click a second node and verify camera still does not move
    await waitForCyNode(page, 'comp-b');
    const panBeforeB = await page.evaluate(() => globalThis.__cy.pan());
    const posB = await getNodePos(page, 'comp-b');
    await page.mouse.click(posB.x, posB.y);
    await page.waitForTimeout(300);
    const panAfterB = await page.evaluate(() => globalThis.__cy.pan());
    expect(panAfterB.x).toBeCloseTo(panBeforeB.x, 0);
    expect(panAfterB.y).toBeCloseTo(panBeforeB.y, 0);
    // Only the newly clicked node should be selected (single selection)
    const selectedCount = await page.evaluate(
      () => globalThis.__cy.nodes().filter((n) => n.selected()).length,
    );
    expect(selectedCount).toBe(1);
  });

  test('TC-2.5.2: Select an edge to show relationship properties', async ({ page }) => {
    await setupGraphPage(page);
    await waitForCyNode(page, 'comp-a');
    await waitForCyNode(page, 'comp-b');
    await waitForCyEdge(page, 'rel-1');
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Step 1: Click on the edge (midpoint between comp-a and comp-b)
    const posA = await getNodePos(page, 'comp-a');
    const posB = await getNodePos(page, 'comp-b');
    await page.mouse.click((posA.x + posB.x) / 2, (posA.y + posB.y) / 2);
    await page.waitForTimeout(300);

    // Edge should be selected
    const isEdgeSelected = await page.evaluate(() => globalThis.__cy.$id('rel-1').selected());
    expect(isEdgeSelected).toBe(true);

    // Properties panel should show edge details
    await expect(page.locator('#detail-panel')).toBeVisible();

    // Panel must include source and target entity names as clickable links
    // Rel-1: comp-a (Component A) → comp-b (Component B), name 'calls'
    const panelText = await page.locator('#detail-panel').textContent();
    expect(panelText).toContain('Component A');
    expect(panelText).toContain('Component B');

    // Step 2: Click the source entity link — camera centers on source; edge deselected
    await clickEdgeSourceLinkAndVerify(page);

    // Step 3: Click a different edge — camera must NOT move
    await waitForCyEdge(page, 'rel-db');
    const posCompB = await getNodePos(page, 'comp-b');
    const posDb = await getNodePos(page, 'db-1');
    const panBefore = await page.evaluate(() => globalThis.__cy.pan());
    await page.mouse.click((posCompB.x + posDb.x) / 2, (posCompB.y + posDb.y) / 2);
    await page.waitForTimeout(300);
    const panAfter = await page.evaluate(() => globalThis.__cy.pan());
    expect(panAfter.x).toBeCloseTo(panBefore.x, 0);
    expect(panAfter.y).toBeCloseTo(panBefore.y, 0);

    // New edge is selected; properties panel updates
    const isRelDbSelected = await page.evaluate(() => globalThis.__cy.$id('rel-db').selected());
    expect(isRelDbSelected).toBe(true);
    const updatedPanelText = await page.locator('#detail-panel').textContent();
    expect(updatedPanelText).toContain('Component B');
    expect(updatedPanelText).toContain('Database');
  });

  test('TC-2.5.3: Deselect by clicking canvas background', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    // Wait for initial layout animation to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Select node by clicking on it
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Click background
    await clickEmptyCanvas(page);

    await page.waitForTimeout(200);

    // Selection should be cleared
    const hasSelection = await page.evaluate(
      () => globalThis.__cy.elements(':selected').length > 0,
    );
    expect(hasSelection).toBe(false);
  });

  test('TC-2.5.4: Click related entity link in properties panel to select it', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    // Wait for initial layout animation to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Select Node A by clicking on it
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Verify Node A is selected
    const isCompAInitiallySelected = await page.evaluate(() =>
      globalThis.__cy.$id('comp-a').selected(),
    );
    expect(isCompAInitiallySelected).toBe(true);

    // Click related entity link in properties panel (first connection from comp-a → comp-b)
    await page.locator('#detail-panel .detail-conn-item').first().click();
    await page.waitForTimeout(300);

    // Node A must lose its highlight (previous selection cleared)
    const isCompASelected = await page.evaluate(() => globalThis.__cy.$id('comp-a').selected());
    expect(isCompASelected).toBe(false);

    // Node B becomes selected
    const isCompBSelected = await page.evaluate(() => globalThis.__cy.$id('comp-b').selected());
    expect(isCompBSelected).toBe(true);

    // Only one node should be selected at a time
    const selectedCount = await page.evaluate(
      () => globalThis.__cy.nodes().filter((n) => n.selected()).length,
    );
    expect(selectedCount).toBe(1);

    // Properties panel updates to show Node B's details
    const detailName = await page.locator('#detail-panel .detail-name').textContent();
    expect(detailName).toBe('Component B');
  });

  test('TC-2.5.5: Selection persists during view mode switch (Graph ↔ Table)', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    // Wait for initial layout animation to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Select node by clicking on it
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Switch to table
    await page.click('#tab-table');
    await expect(page.locator('#table-view')).toBeVisible();

    // Switch back to graph
    await page.click('#tab-graph');
    await expect(page.locator('#cy')).toBeVisible();

    // Selection should still be there
    const isStillSelected = await page.evaluate(() =>
      globalThis.__cy.nodes().some((n) => n.selected()),
    );
    expect(isStillSelected).toBe(true);
  });

  test('TC-2.5.6: Selection cleared on model change', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    // Wait for initial layout animation to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Select node by clicking on it
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Switch model
    await page.goto('/graph/?model=model-ecommerce');
    await waitForLoading(page);
    // Wait for the new graph to be ready
    await waitForCyNode(page, 'pay-svc');

    // Selection should be cleared
    const hasSelection = await page.evaluate(() =>
      globalThis.__cy.nodes().some((n) => n.selected()),
    );
    expect(hasSelection).toBe(false);
  });

  test('TC-2.5.7: Multiple selection not supported (single only)', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
    await waitForCyNode(page, 'comp-b');

    // Wait for initial layout animation to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Select first node by clicking on it
    const posA = await getNodePos(page, 'comp-a');
    await page.mouse.click(posA.x, posA.y);
    await page.waitForTimeout(300);

    // Click another node (simulating multi-select attempt)
    const posB = await getNodePos(page, 'comp-b');
    await page.mouse.click(posB.x, posB.y);
    await page.waitForTimeout(300);

    // Only one node should be selected (the second one)
    const selectedCount = await page.evaluate(
      () => globalThis.__cy.nodes().filter((n) => n.selected()).length,
    );
    expect(selectedCount).toBe(1);

    // Verify that comp-b is the selected one
    const isCompBSelected = await page.evaluate(() => globalThis.__cy.$id('comp-b').selected());
    expect(isCompBSelected).toBe(true);
  });
});
