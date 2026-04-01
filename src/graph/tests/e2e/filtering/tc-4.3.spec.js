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
          // Isolated component for drill-down (contains only Microservice and Queue)
          { eClass: 'archi:Microservice', id: 'ms-iso', data: { name: 'Iso Microservice' } },
          { eClass: 'archi:Queue', id: 'queue-iso', data: { name: 'Iso Queue' } },
          // Other component with required types for other tests
          { eClass: 'archi:Database', id: 'db1', data: { name: 'DB1' } },
          { eClass: 'archi:Database', id: 'db2', data: { name: 'DB2' } },
          { eClass: 'archi:LegacySystem', id: 'legacy1', data: { name: 'Legacy1' } },
          { eClass: 'archi:Microservice', id: 'ms1', data: { name: 'MS1' } },
          { eClass: 'archi:Queue', id: 'queue2', data: { name: 'Queue2' } },
          { eClass: 'archi:ExternalAPI', id: 'api1', data: { name: 'API1' } },
        ],
        relations: [
          // Connects depends on Database and Microservice
          { eClass: 'archi:Connects', id: 'conn-1', data: { source: 'db1', target: 'ms1' } },
          // DependsOn between LegacySystem and Microservice
          { eClass: 'archi:DependsOn', id: 'dep-1', data: { source: 'legacy1', target: 'ms1' } },
          // Uses between Microservice and ExternalAPI
          { eClass: 'archi:Uses', id: 'uses-1', data: { source: 'ms1', target: 'api1' } },
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

// Exit drill-down
async function exitDrillDown(page) {
  const btn = page.locator('#drill-exit-btn');
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(500);
  }
}

test.describe('TC-4.3: Dynamic filter management', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override model content for this test suite
    await page.route(MODEL_CONTENT_URL, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FILTER_MODEL_CONTENT_43),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    // Capture Cytoscape instance for drill-down
    await injectCyCapture(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
  });

  test('TC-4.3.1: Type disappears from filter list when count=0 AND unchecked', async ({
    page,
  }) => {
    // Connects (relationship between Database and Microservice) is checked by default
    const connectsCheckbox = page.locator('input[data-kind="rel"][data-type="Connects"]');
    await expect(connectsCheckbox).toBeChecked();

    // Uncheck Connects to make it unchecked
    await connectsCheckbox.uncheck();
    await expect(connectsCheckbox).not.toBeChecked();

    // Uncheck Database (one endpoint)
    const databaseCheckbox = page.locator('input[data-kind="elem"][data-type="Database"]');
    await databaseCheckbox.uncheck();

    // Since Connects is unchecked and count=0 (no Database visible), it should disappear (hidden)
    await expect(connectsCheckbox).not.toBeVisible();
  });

  test('TC-4.3.2: Type remains in list (dimmed) when checked but count=0', async ({ page }) => {
    // Enter drill-down on isolated microservice to make LegacySystem count=0
    await enterDrillDown(page, 'ms-iso');

    // LegacySystem should still be checked (default) and become dimmed
    const legacyCheckbox = page.locator('input[data-kind="elem"][data-type="LegacySystem"]');
    await expect(legacyCheckbox).toBeChecked();

    const legacyLabel = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="LegacySystem"])',
    );
    await expect(legacyLabel).toBeVisible();
    await expect(legacyLabel).toHaveClass(/dim/);
  });

  test('TC-4.3.3: Drill-down scope hides types not present in scope', async ({ page }) => {
    // Ensure Uses relationship is unchecked (so it can be hidden when count=0)
    const usesCheckbox = page.locator('input[data-kind="rel"][data-type="Uses"]');
    if (await usesCheckbox.isChecked()) {
      await usesCheckbox.uncheck();
    }
    await expect(usesCheckbox).not.toBeChecked();

    // Enter drill-down on isolated microservice; in this scope, none of the relationships have both endpoints visible
    await enterDrillDown(page, 'ms-iso');

    // Uses should be hidden because count=0 and unchecked
    await expect(usesCheckbox).not.toBeVisible();

    // Microservice and Queue entities should still be visible (they have count>0)
    const msCheckbox = page.locator('input[data-kind="elem"][data-type="Microservice"]');
    const queueCheckbox = page.locator('input[data-kind="elem"][data-type="Queue"]');
    await expect(msCheckbox).toBeVisible();
    await expect(queueCheckbox).toBeVisible();

    // Connects (checked) should be visible and dimmed (count=0 but checked)
    const connectsCheckbox = page.locator('input[data-kind="rel"][data-type="Connects"]');
    await expect(connectsCheckbox).toBeVisible();
    const connectsLabel = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Connects"])',
    );
    await expect(connectsLabel).toHaveClass(/dim/);
  });

  test('TC-4.3.4: Enabling a dimmed type (checked with 0 count) pins it to the list', async ({
    page,
  }) => {
    // Setup: Make sure Uses is unchecked and then enter drill-down so it becomes hidden
    const usesCheckbox = page.locator('input[data-kind="rel"][data-type="Uses"]');
    if (await usesCheckbox.isChecked()) {
      await usesCheckbox.uncheck();
    }
    await expect(usesCheckbox).not.toBeChecked();

    await enterDrillDown(page, 'ms-iso');

    // Uses should be hidden now
    await expect(usesCheckbox).not.toBeVisible();

    // Search for Uses in the relationships filter
    const searchInput = page.locator('#rel-filter-search');
    await searchInput.fill('Uses');
    await page.waitForTimeout(200);

    // Uses should appear in search results
    await expect(usesCheckbox).toBeVisible();

    // Check it to pin
    await usesCheckbox.check();
    await expect(usesCheckbox).toBeChecked();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(200);

    // Even after clearing search, Uses should remain visible because it's checked (pinned)
    await expect(usesCheckbox).toBeVisible();
    await expect(usesCheckbox).toBeChecked();

    // Exit drill-down to full model
    await exitDrillDown(page);

    // Now Uses count should be >0 and still visible and checked
    await expect(usesCheckbox).toBeVisible();
    await expect(usesCheckbox).toBeChecked();
  });

  test('TC-4.3.5: Checked relationship remains when dependent entity is unchecked', async ({
    page,
  }) => {
    // Connects is checked by default
    const connectsCheckbox = page.locator('input[data-kind="rel"][data-type="Connects"]');
    await expect(connectsCheckbox).toBeChecked();

    // Uncheck Database (endpoint of Connects)
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();

    // Connects should remain checked
    await expect(connectsCheckbox).toBeChecked();

    // Connects should be dimmed (count=0)
    const connectsLabel = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Connects"])',
    );
    await expect(connectsLabel).toHaveClass(/dim/);
  });

  test('TC-4.3.6: Unchecked relationship disappears when count drops to 0', async ({ page }) => {
    // Ensure Uses is unchecked
    const usesCheckbox = page.locator('input[data-kind="rel"][data-type="Uses"]');
    await usesCheckbox.uncheck();
    await expect(usesCheckbox).toBeVisible(); // Count>0 so visible even though unchecked

    // Uncheck ExternalAPI (endpoint of Uses)
    await page.locator('input[data-kind="elem"][data-type="ExternalAPI"]').uncheck();

    // Uses should disappear (hidden) because count=0 and unchecked
    await expect(usesCheckbox).not.toBeVisible();

    // Search for Uses
    const searchInput = page.locator('#rel-filter-search');
    await searchInput.fill('Uses');
    await page.waitForTimeout(200);

    // Uses appears in search results (still unchecked)
    await expect(usesCheckbox).toBeVisible();
    await expect(usesCheckbox).not.toBeChecked();

    // Re-check ExternalAPI
    await page.locator('input[data-kind="elem"][data-type="ExternalAPI"]').check();
    await page.waitForTimeout(300);

    // Now Uses should be visible again (unchecked, count>0)
    await expect(usesCheckbox).toBeVisible();
    await expect(usesCheckbox).not.toBeChecked();
  });

  test('TC-4.3.7: Entity count remains unchanged when type is unchecked in drill-down', async ({
    page,
  }) => {
    // Precondition: Drill-down mode on ms-iso (isolated Microservice)
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    // Locate Microservice filter row
    const msCheckbox = page.locator('input[data-kind="elem"][data-type="Microservice"]');
    const msCountEl = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Microservice"]) .count',
    );

    // Ensure Microservice is checked and visible
    await expect(msCheckbox).toBeChecked();
    await expect(msCheckbox).toBeVisible();

    // Record initial count (should be 1/2 since total Microservices = 2, but only ms-iso in scope)
    const initialCount = await msCountEl.textContent();
    // Should match pattern like "1 / 2" or just "1" if scope equals total? Here total=2, scope=1 -> "1 / 2"
    expect(initialCount).toMatch(/1.*2/);

    // Uncheck Microservice
    await msCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Count should remain unchanged
    const newCount = await msCountEl.textContent();
    expect(newCount).toBe(initialCount);

    // Microservice row should remain visible (unchecked but not hidden because count > 0)
    await expect(msCheckbox).toBeVisible();
    await expect(msCheckbox).not.toBeChecked();
    // Should not be dimmed (since count > 0)
    const msRow = page.locator(
      'label.filter-item:has(input[data-kind="elem"][data-type="Microservice"])',
    );
    await expect(msRow).not.toHaveClass(/dim/);

    // Re-check to verify stability
    await msCheckbox.check();
    await page.waitForTimeout(200);
    const restoredCount = await msCountEl.textContent();
    expect(restoredCount).toBe(initialCount);
    await expect(msCheckbox).toBeChecked();
  });
});
