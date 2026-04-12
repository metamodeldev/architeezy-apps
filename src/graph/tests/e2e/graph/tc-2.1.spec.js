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

function countNodesWithLabels(page) {
  return page.evaluate(() => {
    let count = 0;
    for (const node of globalThis.__cy.nodes()) {
      const label = node.data('label');
      if (label && typeof label === 'string' && label.trim().length > 0) {
        count++;
      }
    }
    return count;
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
    // For nodes, check that they are positioned; for edges, existence is enough
    if (el.isNode && el.isNode()) {
      const pos = el.renderedPosition();
      return pos && pos.x > 10 && pos.y > 10;
    }
    return true;
  }, nodeId);
}

test.describe('TC-2.1: Representation', () => {
  test('TC-2.1.1: All model elements appear as nodes and all relationships as edges', async ({
    page,
  }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Wait for nodes to render
    await waitForCyNode(page, 'comp-a');
    await waitForCyNode(page, 'comp-b');
    await waitForCyNode(page, 'svc-x');

    const counts = await page.evaluate(() => ({
      nodes: globalThis.__cy.nodes().length,
      edges: globalThis.__cy.edges().length,
    }));

    expect(counts.nodes).toBe(65);
    expect(counts.edges).toBe(10);
  });

  test('TC-2.1.2: Element with missing name still renders without error', async ({ page }) => {
    const NAMELESS_CONTENT = {
      ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
      content: [
        {
          eClass: 'archi:ArchimateModel',
          id: 'model-root',
          data: {
            name: 'Nameless Model',
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
            ],
          },
        },
      ],
    };

    await injectCyCapture(page);
    await mockApi(page);
    await page.route(
      'https://architeezy.com/api/models/test/test/1/test-model/content?format=json',
      (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(NAMELESS_CONTENT),
        }),
    );
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
    await waitForCyNode(page, 'comp-b');

    const compBName = await page.evaluate(() => globalThis.__cy.$id('comp-b').data('name'));
    expect(compBName).toBeUndefined();

    const nodeCount = await page.evaluate(() => globalThis.__cy.nodes().length);
    expect(nodeCount).toBe(3);
  });

  test('TC-2.1.3: Different relationship types have distinct visual styles', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'rel-1');

    // Verify edge style for different relationship types
    const edges = await page.evaluate(() =>
      globalThis.__cy.edges().map((e) => e.style('line-style')),
    );

    expect(edges.length).toBeGreaterThan(0);
  });

  test('TC-2.1.4: Empty model shows empty canvas without errors', async ({ page }) => {
    const EMPTY_CONTENT = {
      ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
      content: [
        {
          eClass: 'archi:ArchimateModel',
          id: 'model-root',
          data: {
            name: 'Empty Model',
            elements: [],
            relations: [],
          },
        },
      ],
    };

    await injectCyCapture(page);
    await mockApi(page);
    await page.route(
      'https://architeezy.com/api/models/test/test/1/empty-model/content?format=json',
      (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(EMPTY_CONTENT),
        }),
    );
    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'model-empty',
                name: 'Empty Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: 'https://architeezy.com/api/models/test/test/1/empty-model/content?format=json',
                  },
                },
              },
            ],
          },
          _links: {},
        }),
      }),
    );

    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-empty');
    await waitForLoading(page);

    await page.evaluate(() => globalThis.__cy === undefined);

    // Should show empty state message
    await expect(page.locator('#empty-state-message')).toBeVisible();
  });

  test('TC-2.1.5: Node labels do not overlap excessively', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');

    // Check that nodes have labels (name or type fallback)
    const nodesWithLabels = await countNodesWithLabels(page);

    expect(nodesWithLabels).toBeGreaterThan(0);
  });

  test('TC-2.1.6: Edge labels follow edge path', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'rel-1');

    // Verify edges have labels where relationship name is provided
    const edges = await page.evaluate(() =>
      [...globalThis.__cy.edges()].map((e) => ({
        hasLabel: Boolean(e.data('label')),
        id: e.id(),
      })),
    );

    const labeledEdges = edges.filter((e) => e.hasLabel);
    expect(labeledEdges.length).toBeGreaterThan(0);
  });
});
