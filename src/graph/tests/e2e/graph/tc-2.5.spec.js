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

    // Select node by clicking on it
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Node should be highlighted
    const isSelected = await page.evaluate(() => {
      const node = globalThis.__cy.$id('comp-a');
      return node && node.selected();
    });
    expect(isSelected).toBe(true);

    // Properties panel should open
    await expect(page.locator('#detail-panel')).toBeVisible();
  });

  test('TC-2.5.2: Select an edge to show relationship properties', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    // Wait for both nodes connected by the edge to be positioned
    await waitForCyNode(page, 'comp-a');
    await waitForCyNode(page, 'comp-b');
    await waitForCyEdge(page, 'rel-1');

    // Wait for initial layout animation to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Select the edge by clicking on the midpoint between the two nodes
    const posA = await getNodePos(page, 'comp-a');
    const posB = await getNodePos(page, 'comp-b');
    const midX = (posA.x + posB.x) / 2;
    const midY = (posA.y + posB.y) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(300);

    // Edge should be selected
    const isSelected = await page.evaluate(() => {
      const edge = globalThis.__cy.$id('rel-1');
      return edge && edge.selected();
    });
    expect(isSelected).toBe(true);
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
    const hasSelection = await page.evaluate(() => {
      const nodesSelected = globalThis.__cy.nodes().some((n) => n.selected());
      const edgesSelected = globalThis.__cy.edges().some((e) => e.selected());
      return nodesSelected || edgesSelected;
    });
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

    // Select node by clicking on it
    const pos = await getNodePos(page, 'comp-a');
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(300);

    // Click related entity link in properties panel (first connection)
    await page.locator('#detail-panel .detail-conn-item').first().click();
    await page.waitForTimeout(300);

    // Verify that the detail panel now shows details for the connected node (comp-b)
    const detailName = await page.locator('#detail-panel .detail-name').textContent();
    // The first connection from comp-a is to comp-b, so name should be "Component B"
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
    const isCompBSelected = await page.evaluate(() => {
      const node = globalThis.__cy.$id('comp-b');
      return node && node.selected();
    });
    expect(isCompBSelected).toBe(true);
  });
});
