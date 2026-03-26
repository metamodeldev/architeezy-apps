import { test as playwrightTest } from '@playwright/test';

// ── Fixture data ──────────────────────────────────────────────────────────────

export const MODEL_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/test-model/content?format=json';

const OTHER_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/other-model/content?format=json';

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
        id: 'model-other',
        name: 'Another Model',
        contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
        _links: { content: { href: OTHER_CONTENT_URL } },
      },
    ],
  },
  _links: {},
};

// 3 elements (2 × ApplicationComponent, 1 × ApplicationService), 2 relations
export const MODEL_CONTENT = {
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
            data: { name: 'Component B' },
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

// ── API helpers ───────────────────────────────────────────────────────────────

/**
 * Registers API mocks. Pass `{ modelListStatus: 500 }` to simulate a server error.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {{ modelListStatus?: number }} [options] - Optional configuration for mock behavior.
 */
export async function mockApi(page, { modelListStatus = 200 } = {}) {
  // Auth probe — 401 means anonymous; app handles this gracefully
  await page.route('https://architeezy.com/api/users/current', (r) =>
    r.fulfill({ status: 401, body: 'Unauthorized' }),
  );

  await page.route(
    'https://architeezy.com/api/models*',
    modelListStatus === 200
      ? (r) =>
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MODEL_LIST),
          })
      : (r) => r.fulfill({ status: modelListStatus, body: 'Server Error' }),
  );

  await page.route(`${MODEL_CONTENT_URL}*`, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MODEL_CONTENT),
    }),
  );
}

/**
 * Wait for the loading spinner to disappear.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 */
export async function waitForLoading(page) {
  await page.locator('#loading').waitFor({ state: 'hidden', timeout: 10_000 });
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
      await use('autoTestFixture');
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
