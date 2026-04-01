import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading, MODEL_CONTENT_URL } from '../fixtures.js';

// Custom model content for TC-4.5 filtering tests
const FILTER_MODEL_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Filter Test Model for TC-4.5',
        elements: [
          { eClass: 'archi:Microservice', id: 'ms-iso', data: { name: 'Iso Microservice' } },
          { eClass: 'archi:Queue', id: 'queue-iso', data: { name: 'Iso Queue' } },
          { eClass: 'archi:Database', id: 'db1', data: { name: 'DB1' } },
          { eClass: 'archi:Database', id: 'db2', data: { name: 'DB2' } },
          { eClass: 'archi:LegacySystem', id: 'legacy1', data: { name: 'Legacy1' } },
          { eClass: 'archi:Microservice', id: 'ms1', data: { name: 'MS1' } },
          { eClass: 'archi:Queue', id: 'queue2', data: { name: 'Queue2' } },
          { eClass: 'archi:ExternalAPI', id: 'api1', data: { name: 'API1' } },
        ],
        relations: [
          { eClass: 'archi:Connects', id: 'conn-1', data: { source: 'db1', target: 'ms1' } },
          { eClass: 'archi:DependsOn', id: 'dep-1', data: { source: 'legacy1', target: 'ms1' } },
          { eClass: 'archi:Uses', id: 'uses-1', data: { source: 'ms1', target: 'api1' } },
          {
            eClass: 'archi:Connects',
            id: 'conn-iso',
            data: { source: 'ms-iso', target: 'queue-iso' },
          },
        ],
      },
    },
  ],
};

// Helper to capture Cytoscape instance for drill-down
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

// Enter drill-down on a node by id
async function enterDrillDown(page, nodeId) {
  await waitForCyReady(page);
  await page.evaluate((id) => {
    const node = globalThis.__cy.$id(id);
    if (node.length) {
      node.trigger('dbltap');
    }
  }, nodeId);
  // Wait for drill-down UI to appear
  await expect(page.locator('#drill-label')).toBeVisible();
}

test.describe('TC-4.5: Filter list discovery', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override model content with test-specific types
    await page.route(MODEL_CONTENT_URL, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FILTER_MODEL_CONTENT),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    // Capture Cytoscape instance for drill-down
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
  });

  test('TC-4.5.1: Search reveals hidden types with 0 available count', async ({ page }) => {
    // Preconditions: Drill-down mode active on a node with only Microservice and Queue in scope
    // Entity type Database is unchecked and hidden (count = 0/Total)
    // Filter panel Entities section is expanded (always)

    // Enter drill-down on isolated node to create scope where Database count = 0
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    // Ensure Database is unchecked (initially checked)
    const dbCheckbox = page.locator('input[data-kind="elem"][data-type="Database"]');
    if (await dbCheckbox.isChecked()) {
      await dbCheckbox.uncheck();
    }
    await page.waitForTimeout(200);

    // Database should be hidden (unchecked + count=0)
    await expect(dbCheckbox).not.toBeVisible();

    // Search for Database in the Entities filter
    const searchInput = page.locator('#elem-filter-search');
    await searchInput.fill('Database');
    await page.waitForTimeout(200);

    // Should appear even though count=0 and unchecked
    await expect(dbCheckbox).toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(200);

    // Should disappear again (still unchecked, count=0)
    await expect(dbCheckbox).not.toBeVisible();
  });

  test('TC-4.5.2: "Show all" switch displays every entity type in the model metadata', async ({
    page,
  }) => {
    // Preconditions: Some entity types hidden (unchecked, available count = 0)
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    // Uncheck Database to hide it (count = 0)
    const dbCheckbox = page.locator('input[data-kind="elem"][data-type="Database"]');
    if (await dbCheckbox.isChecked()) {
      await dbCheckbox.uncheck();
    }
    await page.waitForTimeout(200);
    await expect(dbCheckbox).not.toBeVisible();

    // Toggle "Show all" on
    const showAllToggle = page.locator('#elem-show-all');
    await showAllToggle.check();
    await page.waitForTimeout(200);

    // Database should now be visible even though unchecked and count=0
    await expect(dbCheckbox).toBeVisible();

    // Toggle "Show all" off
    await showAllToggle.uncheck();
    await page.waitForTimeout(200);

    // Database should be hidden again
    await expect(dbCheckbox).not.toBeVisible();
  });

  test('TC-4.5.3: Checking a dimmed type with 0 count pins it to the list', async ({ page }) => {
    // Preconditions: LegacySystem hidden (unchecked, count=0) and search active
    // We'll enter drill-down to get count=0

    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const legacyCheckbox = page.locator('input[data-kind="elem"][data-type="LegacySystem"]');
    // Ensure unchecked (initially checked)
    if (await legacyCheckbox.isChecked()) {
      await legacyCheckbox.uncheck();
    }
    await page.waitForTimeout(200);

    // Should be hidden now
    await expect(legacyCheckbox).not.toBeVisible();

    // Activate search for "Legacy" to reveal hidden type
    const searchInput = page.locator('#elem-filter-search');
    await searchInput.fill('Legacy');
    await page.waitForTimeout(200);

    // Should appear (dimmed, unchecked)
    await expect(legacyCheckbox).toBeVisible();
    await expect(legacyCheckbox).not.toBeChecked();

    // Check it (pin)
    await legacyCheckbox.check();
    await expect(legacyCheckbox).toBeChecked();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(200);

    // Should remain visible (pinned) even after search cleared
    await expect(legacyCheckbox).toBeVisible();
    await expect(legacyCheckbox).toBeChecked();
  });

  test('TC-4.5.4: Unchecking a pinned type allows it to hide again', async ({ page }) => {
    // Similar to 4.5.3 but after pinning, we uncheck and expect hide

    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const legacyCheckbox = page.locator('input[data-kind="elem"][data-type="LegacySystem"]');
    // Ensure unchecked initially
    if (await legacyCheckbox.isChecked()) {
      await legacyCheckbox.uncheck();
    }
    await page.waitForTimeout(200);
    await expect(legacyCheckbox).not.toBeVisible();

    // Search to reveal
    const searchInput = page.locator('#elem-filter-search');
    await searchInput.fill('Legacy');
    await page.waitForTimeout(200);
    await expect(legacyCheckbox).toBeVisible();

    // Check it to pin
    await legacyCheckbox.check();
    await expect(legacyCheckbox).toBeChecked();

    // Clear search - should remain pinned
    await searchInput.clear();
    await page.waitForTimeout(200);
    await expect(legacyCheckbox).toBeVisible();

    // Now uncheck
    await legacyCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Should hide again because count=0 and unchecked
    await expect(legacyCheckbox).not.toBeVisible();
  });

  test('TC-4.5.5: Relationship types follow same discovery rules', async ({ page }) => {
    // Preconditions: Some relationship types have count=0 and are unchecked (hidden)
    // We'll use DependsOn relationship

    // Enter drill-down to make DependsOn count=0 (endpoints out of scope)
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    // Ensure unchecked (initially checked)
    if (await depCheckbox.isChecked()) {
      await depCheckbox.uncheck();
    }
    await page.waitForTimeout(200);

    // Should be hidden now
    await expect(depCheckbox).not.toBeVisible();

    // Search for DependsOn in Relationships filter
    const relSearch = page.locator('#rel-filter-search');
    await relSearch.fill('DependsOn');
    await page.waitForTimeout(200);

    // Should appear
    await expect(depCheckbox).toBeVisible();
    await expect(depCheckbox).not.toBeChecked();

    // Check it (pin)
    await depCheckbox.check();
    await expect(depCheckbox).toBeChecked();

    // Clear search
    await relSearch.clear();
    await page.waitForTimeout(200);

    // Should remain visible (pinned)
    await expect(depCheckbox).toBeVisible();
    await expect(depCheckbox).toBeChecked();

    // Uncheck it
    await depCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Should hide again (count=0 and unchecked)
    await expect(depCheckbox).not.toBeVisible();
  });

  test('TC-4.5.6: "Show all" shows all relationship types, including those with count>0', async ({
    page,
  }) => {
    // Preconditions: Some relationship types hidden (unchecked, available count = 0)
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    // Uncheck DependsOn to hide it (count = 0, endpoints out of scope)
    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    if (await depCheckbox.isChecked()) {
      await depCheckbox.uncheck();
    }
    await page.waitForTimeout(200);
    await expect(depCheckbox).not.toBeVisible();

    // Connects should be visible (count > 0)
    const connectsCheckbox = page.locator('input[data-kind="rel"][data-type="Connects"]');
    await expect(connectsCheckbox).toBeVisible();

    // Toggle "Show all" on
    const showAllToggle = page.locator('#rel-show-all');
    await showAllToggle.check();
    await page.waitForTimeout(200);

    // Both should be visible
    await expect(depCheckbox).toBeVisible();
    await expect(connectsCheckbox).toBeVisible();

    // Toggle "Show all" off
    await showAllToggle.uncheck();
    await page.waitForTimeout(200);

    // DependsOn hidden again, Connects remains visible
    await expect(depCheckbox).not.toBeVisible();
    await expect(connectsCheckbox).toBeVisible();
  });
});
