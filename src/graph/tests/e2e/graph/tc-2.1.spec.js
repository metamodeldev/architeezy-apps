import { expect } from '@playwright/test';

import { mockApi, MODEL_CONTENT_URL, test, waitForLoading } from '../fixtures.js';

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

// ── Fixture data ──────────────────────────────────────────────────────────────

const MODEL_CONTENT_NAMELESS = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Test Architecture',
        elements: [
          {
            eClass: 'archi:ApplicationComponent',
            id: 'comp-a',
            data: { name: 'Component A', documentation: 'First component' },
          },
          {
            eClass: 'archi:ApplicationComponent',
            id: 'comp-b',
            data: {},
          },
          {
            eClass: 'archi:ApplicationService',
            id: 'svc-x',
            data: { name: 'Service X' },
          },
        ],
        relations: [
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-1',
            data: { source: 'comp-a', target: 'comp-b', name: 'calls' },
          },
          {
            eClass: 'archi:ServingRelationship',
            id: 'rel-2',
            data: { source: 'svc-x', target: 'comp-a' },
          },
        ],
      },
    },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-2.1: All Model Elements Render as Nodes and Relationships as Edges', () => {
  test('TC-2.1.1: All model elements appear as nodes and all relationships as edges', async ({
    page,
  }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
    await waitForCyNode(page, 'comp-b');
    await waitForCyNode(page, 'svc-x');

    const counts = await page.evaluate(() => ({
      nodes: globalThis.__cy.nodes().length,
      edges: globalThis.__cy.edges().length,
    }));

    expect(counts.nodes).toBe(4);
    expect(counts.edges).toBe(2);
  });

  test('TC-2.1.2: Element with missing name still renders without error', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.route(`${MODEL_CONTENT_URL}*`, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MODEL_CONTENT_NAMELESS),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    const compBName = await page.evaluate(() => globalThis.__cy.$id('comp-b').data('name'));
    expect(compBName).toBeUndefined();

    const nodeCount = await page.evaluate(() => globalThis.__cy.nodes().length);
    expect(nodeCount).toBe(3);
  });
});
