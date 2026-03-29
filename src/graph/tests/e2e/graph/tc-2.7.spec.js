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

// ── Fixture data ──────────────────────────────────────────────────────────────

const CONTAINMENT_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/containment/content?format=json';

const CONTAINMENT_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Containment Test',
        elements: [
          {
            eClass: 'archi:ApplicationComponent',
            id: 'inv-sys',
            data: {
              name: 'Inventory System',
              elements: [
                {
                  eClass: 'archi:ApplicationComponent',
                  id: 'pay-svc-cn',
                  data: { name: 'Payment Service' },
                },
              ],
            },
          },
        ],
        relations: [],
      },
    },
  ],
};

async function mockContainmentApi(page) {
  await mockApi(page);
  // Override models list to include containment model (Playwright LIFO: later routes checked first)
  await page.route('https://architeezy.com/api/models*', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        _embedded: {
          models: [
            {
              id: 'model-containment',
              name: 'Containment Test',
              contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
              _links: { content: { href: CONTAINMENT_CONTENT_URL } },
            },
          ],
        },
        _links: {},
      }),
    }),
  );
  await page.route(`${CONTAINMENT_CONTENT_URL}*`, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CONTAINMENT_CONTENT),
    }),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-2.7: Containment Visualization Modes', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockContainmentApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-containment');
    await waitForLoading(page);
    await waitForCyNode(page, 'inv-sys');
  });

  test('TC-2.7.1: "Edges" containment mode adds synthetic diamond-marker edges', async ({
    page,
  }) => {
    await page.locator('#containment-select').selectOption('none');

    const edgesWithNone = await page.evaluate(() => globalThis.__cy.edges().length);
    expect(edgesWithNone).toBe(0);

    await page.locator('#containment-select').selectOption('edge');

    const edgesWithEdgeMode = await page.evaluate(() => globalThis.__cy.edges().length);
    expect(edgesWithEdgeMode).toBeGreaterThan(0);

    await page.locator('#containment-select').selectOption('none');

    const edgesBackToNone = await page.evaluate(() => globalThis.__cy.edges().length);
    expect(edgesBackToNone).toBe(0);
  });

  test('TC-2.7.2: "Compound" containment mode nests child nodes inside parent nodes', async ({
    page,
  }) => {
    await page.locator('#containment-select').selectOption('compound');

    const isNested = await page.evaluate(
      () => globalThis.__cy.$id('pay-svc-cn').parent().id() === 'inv-sys',
    );
    expect(isNested).toBe(true);
  });

  test('TC-2.7.3: In compound mode, child remains as a top-level node when parent is filtered', async ({
    page,
  }) => {
    await page.locator('#containment-select').selectOption('compound');

    const filterCheckbox = page.locator(
      'input[data-kind="elem"][data-type="ApplicationComponent"]',
    );
    await filterCheckbox.uncheck();

    const invSysVisible = await page.evaluate(() => globalThis.__cy.$id('inv-sys').visible());
    expect(invSysVisible).toBe(false);

    const paySvcVisible = await page.evaluate(() => globalThis.__cy.$id('pay-svc-cn').visible());
    expect(paySvcVisible).toBe(true);
  });
});
