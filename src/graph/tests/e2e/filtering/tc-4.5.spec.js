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
          // Connects edge in isolated cluster — in-scope total > 0 when drilling on ms-iso
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

async function exitDrillDown(page) {
  const btn = page.locator('#drill-exit-btn');
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(500);
  }
}

test.describe('TC-4.5: Filter list discovery', () => {
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

  test('TC-4.5.1: Search reveals relationship types hidden due to 0 total count in Drill-down', async ({
    page,
  }) => {
    // Drill-down on ms-iso; scope = {ms-iso, queue-iso}
    // DependsOn (legacy1→ms1) has in-scope total = 0 → hidden from Relationships list
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    await expect(depCheckbox).not.toBeVisible();

    // Search for DependsOn in the Relationships filter
    const searchInput = page.locator('#rel-filter-search');
    await searchInput.fill('DependsOn');
    await page.waitForTimeout(200);

    // DependsOn appears even though in-scope total = 0 (search overrides hiding)
    await expect(depCheckbox).toBeVisible();

    // Clear search → DependsOn disappears again (in-scope total = 0; no search active)
    await searchInput.clear();
    await page.waitForTimeout(200);
    await expect(depCheckbox).not.toBeVisible();
  });

  test('TC-4.5.2: "Show all" switch displays every type in the model metadata', async ({
    page,
  }) => {
    // Drill-down on ms-iso; DependsOn has in-scope total = 0 → hidden
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    await expect(depCheckbox).not.toBeVisible();

    // Toggle "Show all" ON
    const showAllToggle = page.locator('#rel-show-all');
    await showAllToggle.check();
    await page.waitForTimeout(200);

    // DependsOn appears (every type from model metadata is shown)
    await expect(depCheckbox).toBeVisible();

    // Toggle "Show all" OFF → list returns to normal rules
    await showAllToggle.uncheck();
    await page.waitForTimeout(200);
    await expect(depCheckbox).not.toBeVisible();
  });

  test('TC-4.5.3: Checking a type with 0 total count enables it but does not pin it in the list', async ({
    page,
  }) => {
    // Drill-down on ms-iso; DependsOn has in-scope total = 0
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    const searchInput = page.locator('#rel-filter-search');

    // Ensure DependsOn is unchecked (reveal via search to uncheck if needed)
    if (await depCheckbox.isChecked()) {
      await searchInput.fill('DependsOn');
      await page.waitForTimeout(200);
      await depCheckbox.uncheck();
      await searchInput.clear();
      await page.waitForTimeout(200);
    }

    // Hidden (in-scope total = 0, unchecked)
    await expect(depCheckbox).not.toBeVisible();

    // Reveal via search
    await searchInput.fill('DependsOn');
    await page.waitForTimeout(200);
    await expect(depCheckbox).toBeVisible();
    await expect(depCheckbox).not.toBeChecked();

    // Check DependsOn
    await depCheckbox.check();
    await expect(depCheckbox).toBeChecked();

    // Clear search → DependsOn disappears (checking does not pin it; in-scope total still 0)
    await searchInput.clear();
    await page.waitForTimeout(200);
    await expect(depCheckbox).not.toBeVisible();

    // Exit drill-down → scope changes; DependsOn in-scope total becomes > 0 (dep-1 in full model)
    await exitDrillDown(page);
    await page.waitForTimeout(300);

    // DependsOn reappears; checkbox remains checked
    await expect(depCheckbox).toBeVisible();
    await expect(depCheckbox).toBeChecked();
  });

  test('TC-4.5.4: A checked type with total count 0 is hidden when no search is active', async ({
    page,
  }) => {
    // Drill-down on ms-iso; DependsOn has in-scope total = 0
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');

    // DependsOn is checked by default; in-scope total = 0 → hidden
    await expect(depCheckbox).not.toBeVisible();

    // Search to reveal it
    const searchInput = page.locator('#rel-filter-search');
    await searchInput.fill('DependsOn');
    await page.waitForTimeout(200);

    // Appears dimmed and checked
    await expect(depCheckbox).toBeVisible();
    await expect(depCheckbox).toBeChecked();

    // Uncheck it
    await depCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Clear search → still hidden (in-scope total = 0; unchecked; no search)
    await searchInput.clear();
    await page.waitForTimeout(200);
    await expect(depCheckbox).not.toBeVisible();
  });

  test('TC-4.5.5: Relationship types follow same discovery rules', async ({ page }) => {
    // Enter drill-down to make DependsOn in-scope total = 0 (endpoints out of scope)
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    const relSearch = page.locator('#rel-filter-search');

    // Ensure unchecked: DependsOn is hidden (in-scope total=0), so reveal via search to uncheck it
    if (await depCheckbox.isChecked()) {
      await relSearch.fill('DependsOn');
      await page.waitForTimeout(200);
      await depCheckbox.uncheck();
      await relSearch.clear();
      await page.waitForTimeout(200);
    }

    // Should be hidden now (unchecked + in-scope total=0)
    await expect(depCheckbox).not.toBeVisible();

    // Search for DependsOn in Relationships filter
    await relSearch.fill('DependsOn');
    await page.waitForTimeout(200);

    // Should appear
    await expect(depCheckbox).toBeVisible();
    await expect(depCheckbox).not.toBeChecked();

    // Check it
    await depCheckbox.check();
    await expect(depCheckbox).toBeChecked();

    // Clear search
    await relSearch.clear();
    await page.waitForTimeout(200);

    // Should disappear — checking does not pin; in-scope total=0
    await expect(depCheckbox).not.toBeVisible();

    // Toggle "Show all" ON — reappears dimmed and checked
    const showAllToggle = page.locator('#rel-show-all');
    await showAllToggle.check();
    await page.waitForTimeout(200);

    await expect(depCheckbox).toBeVisible();
    await expect(depCheckbox).toBeChecked();
  });

  test('TC-4.5.6: "Show all" shows all relationship types, including those with count>0', async ({
    page,
  }) => {
    // Enter drill-down; DependsOn has in-scope total = 0 and is hidden
    await enterDrillDown(page, 'ms-iso');
    await page.waitForTimeout(200);

    const depCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    await expect(depCheckbox).not.toBeVisible();

    // Connects should be visible (in-scope total > 0: conn-iso is in scope)
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
