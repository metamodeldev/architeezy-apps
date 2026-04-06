import { test as playwrightTest } from '@playwright/test';

// ── Fixture data ──────────────────────────────────────────────────────────────

export const MODEL_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/test-model/content?format=json';

export const ECOMMERCE_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/ecommerce/content?format=json';

export const CHAIN_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/chain/content?format=json';

export const MODEL_LIST = {
  _embedded: {
    models: [
      {
        id: 'model-test',
        name: 'Test Architecture',
        contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
        description: 'A test ArchiMate model',
        _links: { content: { href: MODEL_CONTENT_URL } },
      },
      {
        id: 'model-ecommerce',
        name: 'e-commerce',
        contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
        _links: { content: { href: ECOMMERCE_CONTENT_URL } },
      },
      {
        id: 'model-chain',
        name: 'Chain Model',
        contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
        description: 'A linear chain model for testing highlight depth',
        _links: { content: { href: CHAIN_CONTENT_URL } },
      },
    ],
  },
  _links: {},
};

// Payment Service (ApplicationComponent) → UsedByRelationship → Order Database (DataObject)
export const ECOMMERCE_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'e-commerce',
        elements: [
          {
            eClass: 'archi:ApplicationComponent',
            id: 'pay-svc',
            data: { name: 'Payment Service', documentation: 'Handles payment processing' },
          },
          {
            eClass: 'archi:DataObject',
            id: 'order-db',
            data: { name: 'Order Database' },
          },
        ],
        relations: [
          {
            eClass: 'archi:UsedByRelationship',
            id: 'rel-used',
            data: { source: 'pay-svc', target: 'order-db' },
          },
        ],
      },
    },
  ],
};

// ── TEST MODEL CONTENT ────────────────────────────────────────────────────────
// Contains a variety of element types and relationships.
// Added Microservice type for filter tests, and many extra components for scroll tests.
const baseElements = [
  // Core test elements
  {
    eClass: 'archi:ApplicationComponent',
    id: 'comp-a',
    data: { name: 'Component A', documentation: 'First component' },
  },
  {
    eClass: 'archi:ApplicationComponent',
    id: 'comp-b',
    data: { name: 'Component B' },
  },
  {
    eClass: 'archi:ApplicationService',
    id: 'svc-x',
    data: { name: 'Service X' },
  },
  {
    eClass: 'archi:ApplicationFunction',
    id: 'func-1',
    data: { name: 'Function 1' },
  },
  // Microservice element for TC-3.1.3 (filter persistence)
  {
    eClass: 'archi:Microservice',
    id: 'microsvc-1',
    data: { name: 'Microservice 1', documentation: 'A microservice for filtering tests' },
  },
  // Database element for TC-2.7.6 (filter test) and TC-4.x
  {
    eClass: 'archi:Database',
    id: 'db-1',
    data: { name: 'Database', documentation: 'Primary database' },
  },
  // Payment node for TC-4.4 global search (graph view)
  {
    eClass: 'archi:ApplicationComponent',
    id: 'payment-svc',
    data: { name: 'Payment Service', documentation: 'Handles payments' },
  },
  // John node for TC-4.4 global search (table view, owner field)
  {
    eClass: 'archi:ApplicationComponent',
    id: 'comp-john',
    data: { name: "John's Component", status: 'active', owner: 'john' },
  },
  // Chain elements for drill-down depth expansion test (TC-2.7.2)
  // Comp-a -> chain-1 -> chain-2 -> chain-3 -> chain-4
  ...Array.from({ length: 5 }, (_, i) => ({
    eClass: 'archi:ApplicationComponent',
    id: `chain-${i + 1}`,
    data: { name: `Chain Component ${i + 1}` },
  })),
  // Parent-child containment for TC-2.4.8 (Orphaned children test)
  {
    eClass: 'archi:System',
    id: 'sys-parent',
    data: {
      name: 'Parent System',
      children: [
        {
          eClass: 'archi:ApplicationComponent',
          id: 'child-1',
          data: { name: 'Child 1' },
        },
        {
          eClass: 'archi:ApplicationComponent',
          id: 'child-2',
          data: { name: 'Child 2' },
        },
      ],
    },
  },
  // Extra elements to make the table scrollable for TC-3.1.4
  ...Array.from({ length: 49 }, (_, i) => ({
    eClass: 'archi:ApplicationComponent',
    id: `comp-extra-${i + 2}`,
    data: { name: `Component ${i + 2}` },
  })),
];

export const MODEL_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Test Architecture',
        elements: baseElements,
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
          // Connect chain-1 to comp-a to extend depth
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-chain-1',
            data: { source: 'comp-a', target: 'chain-1' },
          },
          // Chain sequence: 1->2->3->4->5
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-chain-2',
            data: { source: 'chain-1', target: 'chain-2' },
          },
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-chain-3',
            data: { source: 'chain-2', target: 'chain-3' },
          },
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-chain-4',
            data: { source: 'chain-3', target: 'chain-4' },
          },
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-chain-5',
            data: { source: 'chain-4', target: 'chain-5' },
          },
          // Database connection (from comp-b)
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-db',
            data: { source: 'comp-b', target: 'db-1', name: 'uses' },
          },
        ],
      },
    },
  ],
};

// ── API helpers ───────────────────────────────────────────────────────────────

/**
 * Registers API mocks. Pass `{ modelListStatus: 500 }` to simulate a server error.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {{ modelListStatus?: number }} [options] - Optional configuration for mock behavior.
 */
// Linear chain of 5 components for highlight depth testing
export const CHAIN_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Chain Model',
        elements: [
          { eClass: 'archi:ApplicationComponent', id: 'comp-1', data: { name: 'Component 1' } },
          { eClass: 'archi:ApplicationComponent', id: 'comp-2', data: { name: 'Component 2' } },
          { eClass: 'archi:ApplicationComponent', id: 'comp-3', data: { name: 'Component 3' } },
          { eClass: 'archi:ApplicationComponent', id: 'comp-4', data: { name: 'Component 4' } },
          { eClass: 'archi:ApplicationComponent', id: 'comp-5', data: { name: 'Component 5' } },
        ],
        relations: [
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-1',
            data: { source: 'comp-1', target: 'comp-2' },
          },
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-2',
            data: { source: 'comp-2', target: 'comp-3' },
          },
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-3',
            data: { source: 'comp-3', target: 'comp-4' },
          },
          {
            eClass: 'archi:AssociationRelationship',
            id: 'rel-4',
            data: { source: 'comp-4', target: 'comp-5' },
          },
        ],
      },
    },
  ],
};

// Helper to get origin from request
function getCorsHeaders(r) {
  const headers = r.request().headers();
  const origin = headers.origin || headers.Origin || 'http://localhost:4200';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function mockApi(page, { modelListStatus = 200 } = {}) {
  // Auth probe — 401 means anonymous; app handles this gracefully
  await page.route('https://architeezy.com/api/users/current', (r) =>
    r.fulfill({
      status: 401,
      headers: getCorsHeaders(r),
      body: 'Unauthorized',
    }),
  );

  await page.route(
    'https://architeezy.com/api/models*',
    modelListStatus === 200
      ? (r) =>
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: getCorsHeaders(r),
            body: JSON.stringify(MODEL_LIST),
          })
      : (r) =>
          r.fulfill({
            status: modelListStatus,
            contentType: 'application/json',
            headers: getCorsHeaders(r),
            body: 'Server Error',
          }),
  );

  await page.route(`${MODEL_CONTENT_URL}*`, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: getCorsHeaders(r),
      body: JSON.stringify(MODEL_CONTENT),
    }),
  );

  await page.route(`${ECOMMERCE_CONTENT_URL}*`, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: getCorsHeaders(r),
      body: JSON.stringify(ECOMMERCE_CONTENT),
    }),
  );

  await page.route(`${CHAIN_CONTENT_URL}*`, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: getCorsHeaders(r),
      body: JSON.stringify(CHAIN_CONTENT),
    }),
  );
}

/**
 * Wait for the loading spinner to disappear.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 */
export async function waitForLoading(page) {
  await page.locator('#loading').waitFor({ state: 'hidden' });
}

/**
 * Load the test model by clicking its entry in the already-open model selector. Callers must ensure
 * the modal is visible before calling this.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 */
export async function loadTestModelFromSelector(page) {
  await page.locator('.model-item', { hasText: 'Test Architecture' }).click();
  await waitForLoading(page);
}

// ── Extended test with V8 coverage auto-fixture ───────────────────────────────

export const test = playwrightTest.extend({
  autoTestFixture: [
    async ({ page }, use) => {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });

      // Collect console errors, filtering out expected network errors
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore expected network errors (401, 500 responses from API mocking)
          // These are not JavaScript errors but expected test scenarios
          if (
            text.includes('Failed to load resource') &&
            (text.includes('401') ||
              text.includes('500') ||
              text.includes('the server responded with a status') ||
              text.includes('ERR_CONNECTION_REFUSED'))
          ) {
            return;
          }
          consoleErrors.push(text);
        }
      });

      await use('autoTestFixture');

      // Check for console errors after test completes
      if (consoleErrors.length > 0) {
        const errorMessage = `Test failed due to ${consoleErrors.length} console error(s):\n${consoleErrors.join('\n')}`;
        throw new Error(errorMessage);
      }

      const coverage = await page.coverage.stopJSCoverage();
      try {
        const { addCoverageReport } = await import('monocart-reporter');
        await addCoverageReport([...coverage], test.info());
      } catch {
        /* Not available outside Playwright/Chromium */
      }
    },
    { scope: 'test', auto: true },
  ],
});
