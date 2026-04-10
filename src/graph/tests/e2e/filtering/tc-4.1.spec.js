import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading, MODEL_CONTENT_URL } from '../fixtures.js';

// Custom model content for filtering tests with required entity and relationship types
const FILTER_MODEL_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Test Architecture',
        elements: [
          {
            eClass: 'archi:Microservice',
            id: 'ms1',
            data: { name: 'Microservice 1', status: 'Active', owner: 'alice' },
          },
          {
            eClass: 'archi:Microservice',
            id: 'ms2',
            data: { name: 'Microservice 2', status: 'Inactive', owner: 'bob' },
          },
          {
            eClass: 'archi:Database',
            id: 'db1',
            data: { name: 'Database 1', status: 'Active', owner: 'charlie' },
          },
          {
            eClass: 'archi:Database',
            id: 'db2',
            data: { name: 'Database 2', status: 'Active', owner: 'dave' },
          },
          {
            eClass: 'archi:Queue',
            id: 'queue1',
            data: { name: 'Queue 1', status: 'Active', owner: 'eve' },
          },
          {
            eClass: 'archi:Queue',
            id: 'queue2',
            data: { name: 'Queue 2', status: 'Inactive', owner: 'frank' },
          },
          {
            eClass: 'archi:ExternalAPI',
            id: 'api1',
            data: { name: 'External API 1', status: 'Active', owner: 'grace' },
          },
          // Isolated cluster for TC-4.1.4 drill-down (only Calls in scope)
          {
            eClass: 'archi:Database',
            id: 'ms-a',
            data: { name: 'DB-A' },
          },
          {
            eClass: 'archi:Database',
            id: 'ms-b',
            data: { name: 'DB-B' },
          },
        ],
        relations: [
          { eClass: 'archi:Calls', id: 'call-1', data: { source: 'ms1', target: 'db1' } },
          { eClass: 'archi:Calls', id: 'call-2', data: { source: 'ms2', target: 'db2' } },
          { eClass: 'archi:DependsOn', id: 'dep-1', data: { source: 'ms1', target: 'queue1' } },
          { eClass: 'archi:Produces', id: 'prod-1', data: { source: 'db1', target: 'api1' } },
          { eClass: 'archi:Triggers', id: 'trigger-1', data: { source: 'queue1', target: 'ms1' } },
          // Isolated Calls edge for TC-4.1.4
          { eClass: 'archi:Calls', id: 'call-a-b', data: { source: 'ms-a', target: 'ms-b' } },
        ],
      },
    },
  ],
};

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
  await page.waitForFunction(
    () => globalThis.__cy !== undefined || (globalThis.cy && globalThis.cy !== undefined),
  );
  await page.evaluate(() => {
    if (globalThis.cy && !globalThis.__cy) {
      globalThis.__cy = globalThis.cy;
    }
  });
}

async function enterDrillDown(page, nodeId) {
  await waitForCyReady(page);
  await page.evaluate((id) => {
    const node = globalThis.__cy.$id(id);
    if (node.length) {
      node.trigger('dbltap');
    }
  }, nodeId);
  await expect(page.locator('#drill-label')).toBeVisible();
}

test.describe('TC-4.1: Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.route(MODEL_CONTENT_URL, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FILTER_MODEL_CONTENT),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
  });

  test('TC-4.1.1: Toggle entity type visibility', async ({ page }) => {
    const callsCountEl = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Calls"]) .count',
    );
    const callsRow = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Calls"])',
    );

    // Initial: count displays as single number (available = total in Full Model)
    const initialCount = await callsCountEl.textContent();
    expect(initialCount).toMatch(/^\d+$/);

    // Uncheck Database
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();
    await page.waitForTimeout(200);

    // Database checkbox unchecked
    await expect(page.locator('input[data-kind="elem"][data-type="Database"]')).not.toBeChecked();

    // In Full Model, relationship types with 0 available remain visible (dimmed "0 / total")
    await expect(callsRow).toBeVisible();
    await expect(callsCountEl).toHaveText(/^0 \/ \d+$/);
    await expect(callsRow).toHaveClass(/dim/);

    // Entity count for Database remains unchanged (available always equals total in Full Model)
    const dbCountEl = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Database"]) .count',
    );
    await expect(dbCountEl).toHaveText(/^\d+$/);

    // Re-check Database
    await page.locator('input[data-kind="elem"][data-type="Database"]').check();
    await page.waitForTimeout(200);
    await expect(page.locator('input[data-kind="elem"][data-type="Database"]')).toBeChecked();

    // Count display reverts to single number
    await expect(callsCountEl).toHaveText(/^\d+$/);
    await expect(callsRow).not.toHaveClass(/dim/);
  });

  test('TC-4.1.2: Toggle relationship type visibility', async ({ page }) => {
    // Uncheck a relationship type
    await page.locator('input[data-kind="rel"][data-type="Calls"]').uncheck();

    // Edges should disappear, checkbox unchecked
    await expect(page.locator('input[data-kind="rel"][data-type="Calls"]')).not.toBeChecked();

    // Re-check
    await page.locator('input[data-kind="rel"][data-type="Calls"]').check();
    await expect(page.locator('input[data-kind="rel"][data-type="Calls"]')).toBeChecked();
  });

  test('TC-4.1.3: Relationship type with available count 0 remains visible in the filter list', async ({
    page,
  }) => {
    const callsCountEl = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Calls"]) .count',
    );
    const callsRow = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Calls"])',
    );
    const callsCheckbox = page.locator('input[data-kind="rel"][data-type="Calls"]');

    // Initial: count displays as single number (available = total in Full Model)
    const initialCount = await callsCountEl.textContent();
    expect(initialCount).toMatch(/^\d+$/);

    // Uncheck Database (endpoint of Calls relationships)
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();
    await page.waitForTimeout(200);

    // Calls available drops to 0 but type REMAINS VISIBLE in the list
    await expect(callsCheckbox).toBeVisible();
    // Count shows "0 / total"
    await expect(callsCountEl).toHaveText(/^0 \/ \d+$/);
    // Row is dimmed
    await expect(callsRow).toHaveClass(/dim/);

    // Re-check Database
    await page.locator('input[data-kind="elem"][data-type="Database"]').check();
    await page.waitForTimeout(200);

    // Count restores to single number; no longer dimmed
    await expect(callsCountEl).toHaveText(/^\d+$/);
    await expect(callsRow).not.toHaveClass(/dim/);
  });

  test('TC-4.1.4: Relationship type disappears from filter list when total count is 0 in Drill-down', async ({
    page,
  }) => {
    // Enter drill-down on ms-a; scope = {ms-a, ms-b} connected by Calls only
    await enterDrillDown(page, 'ms-a');
    await page.waitForTimeout(200);

    // Calls has in-scope total > 0 → visible
    const callsCheckbox = page.locator('input[data-kind="rel"][data-type="Calls"]');
    await expect(callsCheckbox).toBeVisible();

    // DependsOn has in-scope total = 0 (no DependsOn edges in scope) → hidden
    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    await expect(depCheckbox).not.toBeVisible();

    // Toggle "Show all" ON → DependsOn appears
    const showAllToggle = page.locator('#rel-show-all');
    await showAllToggle.check();
    await page.waitForTimeout(200);
    await expect(depCheckbox).toBeVisible();

    // Toggle "Show all" OFF → DependsOn disappears again (in-scope total = 0)
    await showAllToggle.uncheck();
    await page.waitForTimeout(200);
    await expect(depCheckbox).not.toBeVisible();
  });

  test('TC-4.1.5: Visibility changes apply to both graph and table', async ({ page }) => {
    // Start in table view
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Uncheck an entity type
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();

    // Table should update (wait a bit)
    await page.waitForTimeout(300);
    // Switch to graph
    await page.locator('#tab-graph').click();
    await expect(page.locator('#cy')).toBeVisible();

    // Graph should have Database nodes hidden (already filtered)
    // Switch back to table
    await page.locator('#tab-table').click();
    await expect(page.locator('#table-view')).toBeVisible();

    // Table should still have Database filtered out
    const tableText = await page.locator('#table-body').textContent();
    expect(tableText).not.toContain('Database');
  });

  test('TC-4.1.6: Unchecking relationship does not affect entity visibility', async ({ page }) => {
    // Note entity count for Microservice
    const initialEntityCount = await page
      .locator('label.filter-item:has(input[data-kind="elem"][data-type="Microservice"]) .count')
      .textContent();

    // Uncheck a relationship that involves Microservice (Calls)
    await page.locator('input[data-kind="rel"][data-type="Calls"]').uncheck();

    // Entity count should remain same
    const newEntityCount = await page
      .locator('label.filter-item:has(input[data-kind="elem"][data-type="Microservice"]) .count')
      .textContent();
    expect(newEntityCount).toBe(initialEntityCount);
  });
});
