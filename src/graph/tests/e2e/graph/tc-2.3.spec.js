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

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-2.3: Multiple Layout Algorithms', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
  });

  test('TC-2.3.1: Layout dropdown shows all available algorithms with fCoSE selected by default', async ({
    page,
  }) => {
    const select = page.locator('#layout-select');

    await expect(select).toHaveValue('fcose');

    const optionValues = await select.locator('option').allInnerTexts();
    expect(optionValues).toContain('fCoSE');
    expect(optionValues).toContain('Dagre');
    expect(optionValues).toContain('CoSE');
    expect(optionValues).toContain('Breadthfirst');
    expect(optionValues).toContain('Grid');
    expect(optionValues).toContain('Circle');
  });

  test('TC-2.3.2: Selecting a different layout rerenders the graph', async ({ page }) => {
    await page.locator('#layout-select').selectOption('dagre');
    // Layout applies automatically on change
    await waitForCyNode(page, 'comp-a');

    const nodeCountAfterDagre = await page.evaluate(() => globalThis.__cy.nodes().length);
    expect(nodeCountAfterDagre).toBe(3);

    await page.locator('#layout-select').selectOption('grid');
    // Layout applies automatically on change
    await waitForCyNode(page, 'comp-a');

    const nodeCountAfterGrid = await page.evaluate(() => globalThis.__cy.nodes().length);
    expect(nodeCountAfterGrid).toBe(3);
  });
});
