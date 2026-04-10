import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading, MODEL_CONTENT_URL } from '../fixtures.js';

// Custom model for TC-4.3 filtering tests
const FILTER_MODEL_CONTENT_43 = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Filter Test Model for TC-4.3',
        elements: [
          // Nodes for full-model tests (TC-4.3.1, TC-4.3.5)
          { eClass: 'archi:Database', id: 'db1', data: { name: 'DB1' } },
          { eClass: 'archi:Database', id: 'db2', data: { name: 'DB2' } },
          { eClass: 'archi:LegacySystem', id: 'legacy1', data: { name: 'Legacy1' } },
          { eClass: 'archi:Microservice', id: 'ms1', data: { name: 'MS1' } },
          { eClass: 'archi:Queue', id: 'queue2', data: { name: 'Queue2' } },
          { eClass: 'archi:ExternalAPI', id: 'api1', data: { name: 'API1' } },
          // Isolated cluster for TC-4.3.3: ms-a → ms-b via Calls; no Database in scope
          { eClass: 'archi:Microservice', id: 'ms-a', data: { name: 'MS-A' } },
          { eClass: 'archi:Microservice', id: 'ms-b', data: { name: 'MS-B' } },
          // Chain for TC-4.3.7: ms-root → ms-mid → db-leaf (Database only reachable through MS)
          { eClass: 'archi:Microservice', id: 'ms-root', data: { name: 'Root MS' } },
          { eClass: 'archi:Microservice', id: 'ms-mid', data: { name: 'Mid MS' } },
          { eClass: 'archi:Database', id: 'db-leaf', data: { name: 'Leaf DB' } },
          // TC-4.3.4: OrderService drill-down scope (2-hop: 3 Calls, 1 Stores in scope)
          { eClass: 'archi:Microservice', id: 'ms-order', data: { name: 'OrderService' } },
          { eClass: 'archi:Microservice', id: 'ms-ord-1', data: { name: 'OrdMS1' } },
          { eClass: 'archi:Microservice', id: 'ms-ord-2', data: { name: 'OrdMS2' } },
          { eClass: 'archi:Microservice', id: 'ms-ord-3', data: { name: 'OrdMS3' } },
          { eClass: 'archi:Database', id: 'db-ord-1', data: { name: 'OrdDB1' } },
          // TC-4.3.4: Extra disconnected nodes to inflate full-model Calls/Stores counts
          { eClass: 'archi:Microservice', id: 'ms-far-1', data: { name: 'FarMS1' } },
          { eClass: 'archi:Microservice', id: 'ms-far-2', data: { name: 'FarMS2' } },
          { eClass: 'archi:Microservice', id: 'ms-far-3', data: { name: 'FarMS3' } },
          { eClass: 'archi:Database', id: 'db-far-1', data: { name: 'FarDB1' } },
          { eClass: 'archi:Database', id: 'db-far-2', data: { name: 'FarDB2' } },
          { eClass: 'archi:Database', id: 'db-far-3', data: { name: 'FarDB3' } },
          { eClass: 'archi:Database', id: 'db-far-4', data: { name: 'FarDB4' } },
          // TC-4.3.6: Drill-down scope — 5 MS nodes, 2 DB nodes reachable ONLY via Stores
          { eClass: 'archi:Microservice', id: 'ms-6-root', data: { name: '6-Root' } },
          { eClass: 'archi:Microservice', id: 'ms-6-a', data: { name: '6-MS-A' } },
          { eClass: 'archi:Microservice', id: 'ms-6-b', data: { name: '6-MS-B' } },
          { eClass: 'archi:Microservice', id: 'ms-6-c', data: { name: '6-MS-C' } },
          { eClass: 'archi:Microservice', id: 'ms-6-d', data: { name: '6-MS-D' } },
          { eClass: 'archi:Database', id: 'db-6-a', data: { name: '6-DB-A' } },
          { eClass: 'archi:Database', id: 'db-6-b', data: { name: '6-DB-B' } },
        ],
        relations: [
          // Connects depends on Database and Microservice (TC-4.3.1, TC-4.3.5)
          { eClass: 'archi:Connects', id: 'conn-1', data: { source: 'db1', target: 'ms1' } },
          // DependsOn between LegacySystem and Microservice
          { eClass: 'archi:DependsOn', id: 'dep-1', data: { source: 'legacy1', target: 'ms1' } },
          // Uses between Microservice and ExternalAPI
          { eClass: 'archi:Uses', id: 'uses-1', data: { source: 'ms1', target: 'api1' } },
          // Isolated Calls edges for TC-4.3.3 drill-down (Calls in scope, Connects out of scope)
          { eClass: 'archi:Calls', id: 'calls-a-b', data: { source: 'ms-a', target: 'ms-b' } },
          // Chain edges for TC-4.3.7
          {
            eClass: 'archi:Calls',
            id: 'calls-root-mid',
            data: { source: 'ms-root', target: 'ms-mid' },
          },
          {
            eClass: 'archi:Connects',
            id: 'conn-mid-leaf',
            data: { source: 'ms-mid', target: 'db-leaf' },
          },
          // TC-4.3.4: Calls in drill-down scope of ms-order (3 edges within 2 hops)
          {
            eClass: 'archi:Calls',
            id: 'calls-order-ord1',
            data: { source: 'ms-order', target: 'ms-ord-1' },
          },
          {
            eClass: 'archi:Calls',
            id: 'calls-order-ord2',
            data: { source: 'ms-order', target: 'ms-ord-2' },
          },
          {
            eClass: 'archi:Calls',
            id: 'calls-ord1-ord3',
            data: { source: 'ms-ord-1', target: 'ms-ord-3' },
          },
          // TC-4.3.4: Stores in drill-down scope of ms-order (1 edge)
          {
            eClass: 'archi:Stores',
            id: 'stores-order-db1',
            data: { source: 'ms-order', target: 'db-ord-1' },
          },
          // TC-4.3.4: Extra disconnected Calls (outside scope, to make full-model count > scope count)
          {
            eClass: 'archi:Calls',
            id: 'calls-far-1-2',
            data: { source: 'ms-far-1', target: 'ms-far-2' },
          },
          {
            eClass: 'archi:Calls',
            id: 'calls-far-2-3',
            data: { source: 'ms-far-2', target: 'ms-far-3' },
          },
          {
            eClass: 'archi:Calls',
            id: 'calls-far-1-3',
            data: { source: 'ms-far-1', target: 'ms-far-3' },
          },
          // TC-4.3.4: Extra disconnected Stores (outside scope)
          {
            eClass: 'archi:Stores',
            id: 'stores-far-1-db1',
            data: { source: 'ms-far-1', target: 'db-far-1' },
          },
          {
            eClass: 'archi:Stores',
            id: 'stores-far-2-db2',
            data: { source: 'ms-far-2', target: 'db-far-2' },
          },
          {
            eClass: 'archi:Stores',
            id: 'stores-far-3-db3',
            data: { source: 'ms-far-3', target: 'db-far-3' },
          },
          {
            eClass: 'archi:Stores',
            id: 'stores-far-1-db4',
            data: { source: 'ms-far-1', target: 'db-far-4' },
          },
          // TC-4.3.6: Calls within scope of ms-6-root (2-hop)
          {
            eClass: 'archi:Calls',
            id: 'calls-6-root-a',
            data: { source: 'ms-6-root', target: 'ms-6-a' },
          },
          {
            eClass: 'archi:Calls',
            id: 'calls-6-root-b',
            data: { source: 'ms-6-root', target: 'ms-6-b' },
          },
          {
            eClass: 'archi:Calls',
            id: 'calls-6-root-d',
            data: { source: 'ms-6-root', target: 'ms-6-d' },
          },
          {
            eClass: 'archi:Calls',
            id: 'calls-6-a-c',
            data: { source: 'ms-6-a', target: 'ms-6-c' },
          },
          // TC-4.3.6: Stores within scope — Database nodes reachable ONLY via these edges
          {
            eClass: 'archi:Stores',
            id: 'stores-6-a-dba',
            data: { source: 'ms-6-a', target: 'db-6-a' },
          },
          {
            eClass: 'archi:Stores',
            id: 'stores-6-b-dbb',
            data: { source: 'ms-6-b', target: 'db-6-b' },
          },
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

test.describe('TC-4.3: Dynamic filter management', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.route(MODEL_CONTENT_URL, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FILTER_MODEL_CONTENT_43),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
  });

  test('TC-4.3.1: Relationship available count drops to 0 when endpoint entity type is unchecked', async ({
    page,
  }) => {
    const connectsCheckbox = page.locator('input[data-kind="rel"][data-type="Connects"]');
    const connectsRow = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Connects"])',
    );
    const connectsCountEl = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Connects"]) .count',
    );

    await expect(connectsCheckbox).toBeChecked();
    await expect(connectsCheckbox).toBeVisible();

    // Uncheck Database (one endpoint of Connects)
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();
    await page.waitForTimeout(200);

    // Connects available count drops to 0 but type REMAINS VISIBLE in the list (dimmed "0 / total")
    // Total count > 0 (Connects still exists in the full model)
    await expect(connectsCheckbox).toBeVisible();
    await expect(connectsRow).toHaveClass(/dim/);
    await expect(connectsCountEl).toHaveText(/^0 \/ \d+$/);

    // Uncheck Queue as well (both Database and Queue unchecked)
    await page.locator('input[data-kind="elem"][data-type="Queue"]').uncheck();
    await page.waitForTimeout(200);

    // Connects still visible — total count > 0 keeps it in the list
    await expect(connectsCheckbox).toBeVisible();
  });

  test('TC-4.3.2: Entity types in Drill-down: visible when in scope (total > 0), hidden when not in scope (total = 0)', async ({
    page,
  }) => {
    // Drill-down on ms-root; scope = {ms-root, ms-mid, db-leaf}
    // Microservice in-scope total = 2, Database in-scope total = 1
    // LegacySystem has no instances in this scope → in-scope total = 0 → hidden
    await enterDrillDown(page, 'ms-root');
    await page.waitForTimeout(200);

    const legacyCheckbox = page.locator('input[data-kind="elem"][data-type="LegacySystem"]');

    // LegacySystem is HIDDEN — in-scope total = 0; full model count does not influence visibility in drill-down
    await expect(legacyCheckbox).not.toBeVisible();

    // Toggle "Show all" ON → LegacySystem appears (dimmed, count = 0)
    const showAllToggle = page.locator('#elem-show-all');
    await showAllToggle.check();
    await page.waitForTimeout(200);
    await expect(legacyCheckbox).toBeVisible();
    const legacyRow = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="LegacySystem"])',
    );
    await expect(legacyRow).toHaveClass(/dim/);

    // Toggle "Show all" OFF → LegacySystem disappears again (in-scope total remains 0)
    await showAllToggle.uncheck();
    await page.waitForTimeout(200);
    await expect(legacyCheckbox).not.toBeVisible();

    // Database IS in scope (in-scope total = 1) → visible; uncheck Microservice blocks path to it
    const dbCheckbox = page.locator('input[data-kind="elem"][data-type="Database"]');
    const dbRow = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Database"])',
    );
    const dbCountEl = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Database"]) .count',
    );
    await expect(dbCheckbox).toBeVisible();

    const msCheckbox = page.locator('input[data-kind="elem"][data-type="Microservice"]');
    await msCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Database available drops to 0 but REMAINS VISIBLE (in-scope total = 1 > 0)
    await expect(dbCheckbox).toBeVisible();
    await expect(dbRow).toHaveClass(/dim/);
    await expect(dbCountEl).toHaveText(/^0 \/ 1$/);

    // LegacySystem is still hidden (in-scope total = 0, Show all is OFF)
    await expect(legacyCheckbox).not.toBeVisible();
  });

  test('TC-4.3.3: Drill-down scope: entity and relationship types with 0 in-scope total are hidden', async ({
    page,
  }) => {
    // Enter drill-down on ms-a; scope = {ms-a, ms-b} connected only by Calls
    // Microservice in-scope total > 0; Database, ExternalAPI, Queue in-scope total = 0
    await enterDrillDown(page, 'ms-a');
    await page.waitForTimeout(200);

    // Microservice IS in scope → visible
    const msCheckbox = page.locator('input[data-kind="elem"][data-type="Microservice"]');
    await expect(msCheckbox).toBeVisible();

    // Database NOT in scope → in-scope total = 0 → HIDDEN (same rule as relationship types)
    const dbCheckbox = page.locator('input[data-kind="elem"][data-type="Database"]');
    await expect(dbCheckbox).not.toBeVisible();

    // Calls IS in scope (ms-a → ms-b) → visible
    const callsCheckbox = page.locator('input[data-kind="rel"][data-type="Calls"]');
    await expect(callsCheckbox).toBeVisible();

    // Connects NOT in scope → in-scope total = 0 → HIDDEN
    const connectsCheckbox = page.locator('input[data-kind="rel"][data-type="Connects"]');
    await expect(connectsCheckbox).not.toBeVisible();
  });

  test('TC-4.3.4: Relationship total count in Drill-down reflects scope count, not full model count', async ({
    page,
  }) => {
    // Drill-down on ms-order; in-scope: 3 Calls, 1 Stores
    // Full model has more Calls and Stores (outside scope), but total shown must equal scope count
    await enterDrillDown(page, 'ms-order');
    await page.waitForTimeout(200);

    const callsCountEl = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Calls"]) .count',
    );
    const storesCountEl = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Stores"]) .count',
    );

    // Total count = scope count, not full model count
    // Available equals total (all checked) → displayed as a single number
    await expect(callsCountEl).toHaveText('3');
    await expect(storesCountEl).toHaveText('1');
  });

  test('TC-4.3.5: Relationship type with available count 0 stays visible regardless of checked state', async ({
    page,
  }) => {
    const connectsCheckbox = page.locator('input[data-kind="rel"][data-type="Connects"]');
    const connectsRow = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Connects"])',
    );
    const connectsCountEl = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Connects"]) .count',
    );
    const databaseCheckbox = page.locator('input[data-kind="elem"][data-type="Database"]');

    await expect(connectsCheckbox).toBeChecked();

    // Uncheck Database → Connects available drops to 0
    await databaseCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Connects REMAINS VISIBLE when checked (dimmed "0 / total")
    await expect(connectsCheckbox).toBeVisible();
    await expect(connectsRow).toHaveClass(/dim/);
    await expect(connectsCountEl).toHaveText(/^0 \/ \d+$/);

    // Uncheck Connects
    await connectsCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Connects STILL VISIBLE when unchecked (dimmed "0 / total")
    // Visibility is driven by total count, not by checked state or available count
    await expect(connectsCheckbox).toBeVisible();
    await expect(connectsRow).toHaveClass(/dim/);

    // Re-check Database
    await databaseCheckbox.check();
    await page.waitForTimeout(300);

    // Connects available restores; display reverts to normal count
    await expect(connectsCheckbox).toBeVisible();
    await expect(connectsRow).not.toHaveClass(/dim/);
  });

  test('TC-4.3.6: Unchecking a relationship type in Drill-down does not change entity total counts', async ({
    page,
  }) => {
    // Drill-down on ms-6-root; scope: 5 Microservice, 2 Database
    // Database nodes reachable ONLY via Stores edges (not via Calls)
    await enterDrillDown(page, 'ms-6-root');
    await page.waitForTimeout(200);

    const msCountEl = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Microservice"]) .count',
    );
    const dbCountEl = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Database"]) .count',
    );
    const dbRow = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Database"])',
    );
    const storesCheckbox = page.locator('input[data-kind="rel"][data-type="Stores"]');
    const storesCountEl = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Stores"]) .count',
    );

    // Initial: total = available for all types → single numbers
    await expect(msCountEl).toHaveText('5');
    await expect(dbCountEl).toHaveText('2');
    await expect(storesCountEl).toHaveText('2');

    // Uncheck Stores
    await storesCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Microservice: total (5) and available (5) unchanged
    await expect(msCountEl).toHaveText('5');

    // Database: total stays 2 (total ignores filter settings),
    // Available drops to 0 (only path via Stores is now disabled)
    await expect(dbCountEl).toHaveText('0 / 2');
    await expect(dbRow).toHaveClass(/dim/);

    // Re-check Stores
    await storesCheckbox.check();
    await page.waitForTimeout(200);

    // All counts restore to initial values
    await expect(msCountEl).toHaveText('5');
    await expect(dbCountEl).toHaveText('2');
    await expect(dbRow).not.toHaveClass(/dim/);
  });

  test('TC-4.3.7: Unchecking an entity type in Drill-down does not change its own available count', async ({
    page,
  }) => {
    // Drill-down on ms-root; scope = {ms-root, ms-mid, db-leaf}
    // The only path to db-leaf goes through ms-mid (Microservice)
    await enterDrillDown(page, 'ms-root');
    await page.waitForTimeout(200);

    const msCheckbox = page.locator('input[data-kind="elem"][data-type="Microservice"]');
    const msCountEl = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Microservice"]) .count',
    );
    const dbCountEl = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Database"]) .count',
    );
    const dbRow = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Database"])',
    );

    await expect(msCheckbox).toBeChecked();
    await expect(msCheckbox).toBeVisible();

    // Record initial counts: Microservice in-scope total = available = 2, Database = 1
    // Total equals available → single number displayed
    const initialMsCount = await msCountEl.textContent();
    expect(initialMsCount).toMatch(/^2$/);

    const initialDbCount = await dbCountEl.textContent();
    expect(initialDbCount).toMatch(/^1$/);

    // Uncheck Microservice
    await msCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Microservice own available count is UNCHANGED (a type's own checkbox does not affect its count)
    expect(await msCountEl.textContent()).toBe(initialMsCount);

    // Microservice row remains visible (total > 0), unchecked, not dimmed (count > 0)
    await expect(msCheckbox).toBeVisible();
    await expect(msCheckbox).not.toBeChecked();
    const msRow = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Microservice"])',
    );
    await expect(msRow).not.toHaveClass(/dim/);

    // Database available count DROPS because the only path to db-leaf goes through ms-mid
    // (disabled Microservice nodes block BFS traversal); in-scope total stays 1
    await expect(dbCountEl).toHaveText(/^0 \/ 1$/);
    await expect(dbRow).toHaveClass(/dim/);

    // Re-check Microservice
    await msCheckbox.check();
    await page.waitForTimeout(200);

    // Counts restore to prior values
    expect(await msCountEl.textContent()).toBe(initialMsCount);
    expect(await dbCountEl.textContent()).toBe(initialDbCount);
    await expect(dbRow).not.toHaveClass(/dim/);
  });
});
