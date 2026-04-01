import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// Helper to capture Cytoscape instance for drill-down tests
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

test.describe('TC-1.4: Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state before each test
    await page.addInitScript(() => localStorage.clear());
  });

  // Helper to verify filter state preserves history length
  async function verifyFilterPreservesHistory(page, initialLength, urlPattern) {
    await expect(page).toHaveURL(urlPattern);
    const len = await page.evaluate(() => history.length);
    expect(len).toBe(initialLength);
  }

  test('TC-1.4.1: Model switch adds new history entry', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    const initialLength = await page.evaluate(() => history.length);

    // Open model selector and switch to e-commerce
    await page.locator('#current-model-btn').click();
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'e-commerce' }).click();
    await waitForLoading(page);

    // History should have increased (pushState used)
    const newLength = await page.evaluate(() => history.length);
    expect(newLength).toBeGreaterThan(initialLength);

    // URL should reflect new model
    await expect(page).toHaveURL(/model=model-ecommerce/);
  });

  test('TC-1.4.2: View mode switch (Graph ↔ Table) adds new history entry', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    const initialLength = await page.evaluate(() => history.length);

    // Switch to table view
    await page.locator('#tab-table').click();
    await expect(page).toHaveURL(/view=table/);
    await expect(page.locator('#table-view')).toBeVisible();

    const afterSwitchLength = await page.evaluate(() => history.length);
    expect(afterSwitchLength).toBeGreaterThan(initialLength);
  });

  test('TC-1.4.3: Filter changes use replaceState (no history extension)', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    const initialLength = await page.evaluate(() => history.length);

    // Uncheck two types, leave only ApplicationComponent checked
    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();
    await page.locator('input[data-kind="elem"][data-type="ApplicationFunction"]').uncheck();

    // URL should contain entities=ApplicationComponent
    await expect(page).toHaveURL(/entities=ApplicationComponent/);

    // History length should not increase (replaceState used)
    const afterFilterLength = await page.evaluate(() => history.length);
    expect(afterFilterLength).toBe(initialLength);
  });

  test('TC-1.4.4: Rapid navigation clicks resolve only final destination', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    // Wait for model items
    await page
      .locator('.model-item', { hasText: 'Test Architecture' })
      .waitFor({ state: 'visible' });

    // Click first model
    await page.locator('.model-item', { hasText: 'Test Architecture' }).click();
    await waitForLoading(page);

    // Reopen modal and click second model
    await page.locator('#current-model-btn').click();
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'e-commerce' }).waitFor({ state: 'visible' });
    await page.locator('.model-item', { hasText: 'e-commerce' }).click();
    await waitForLoading(page);

    // Reopen modal and click third model
    await page.locator('#current-model-btn').click();
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'Chain Model' }).waitFor({ state: 'visible' });
    await page.locator('.model-item', { hasText: 'Chain Model' }).click();
    await waitForLoading(page);

    // Final model should be loaded
    await expect(page.locator('#current-model-name')).toHaveText('Chain Model');
  });

  test('TC-1.4.5: Drill-down navigation adds a history entry', async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Wait for Cytoscape nodes to be rendered
    await page.waitForFunction(() => globalThis.__cy && globalThis.__cy.nodes().length > 0);

    const initialLength = await page.evaluate(() => history.length);

    // Trigger drill-down on first node
    await page.evaluate(() => {
      if (globalThis.__cy) {
        const node = globalThis.__cy.nodes().first();
        if (node) {
          node.trigger('dbltap');
        }
      }
    });

    // URL should contain entity and depth params
    await expect(page).toHaveURL(/entity=/);
    await expect(page).toHaveURL(/depth=/);

    // History should have increased (pushState used)
    const afterDrillLength = await page.evaluate(() => history.length);
    expect(afterDrillLength).toBeGreaterThan(initialLength);
  });

  test('TC-1.4.6: URL always reflects the current application state', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Manually edit URL to change view and filter via entities
    await page.goto('/graph/?model=model-test&view=table&entities=ApplicationComponent');

    // App should reflect URL state
    await expect(page).toHaveURL(/view=table/);
    await expect(page).toHaveURL(/entities=ApplicationComponent/);
    await expect(page.locator('#table-view')).toBeVisible();
  });

  test('TC-1.4.7: Back button after filter sequence lands on correct prior state', async ({
    page,
  }) => {
    await mockApi(page);
    // Load first model (model-test) to create initial history entry
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Switch to second model (e-commerce) via UI to push a new entry
    await page.locator('#current-model-btn').click();
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'e-commerce' }).click();
    await waitForLoading(page);

    const initialLength = await page.evaluate(() => history.length);
    expect(initialLength).toBeGreaterThanOrEqual(2);

    // Get filter checkboxes for e-commerce (ApplicationComponent and DataObject)
    const cbComp = page.locator('input[data-kind="elem"][data-type="ApplicationComponent"]');
    const cbData = page.locator('input[data-kind="elem"][data-type="DataObject"]');
    await Promise.all([
      cbComp.waitFor({ state: 'attached' }),
      cbData.waitFor({ state: 'attached' }),
    ]);
    // Ensure both are initially checked
    await expect(cbComp).toBeChecked();
    await expect(cbData).toBeChecked();

    // Filter change 1: leave only ApplicationComponent checked
    await cbData.uncheck();
    await verifyFilterPreservesHistory(page, initialLength, /entities=ApplicationComponent/);

    // Filter change 2: leave only DataObject checked
    await cbComp.uncheck();
    await cbData.check();
    await verifyFilterPreservesHistory(page, initialLength, /entities=DataObject/);

    // Filter change 3: restore both checked (no entities param)
    await cbComp.check();
    await cbData.check();
    await expect(page).not.toHaveURL(/entities=/);
    const len3 = await page.evaluate(() => history.length);
    expect(len3).toBe(initialLength);

    // Navigate back
    await page.goBack();

    // Should return to model-test without filter
    await expect(page).toHaveURL(/model=model-test/);
    await expect(page).not.toHaveURL(/entities=/);
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });

  test('TC-1.4.8: Navigation with model change while filters active', async ({ page }) => {
    await mockApi(page);
    // Load model-test with an entities filter query param
    await page.goto('/graph/?model=model-test&entities=Microservice');
    await waitForLoading(page);

    // Switch to another model by model ID
    await page.goto('/graph/?model=model-ecommerce');
    await waitForLoading(page);

    // New model should be loaded and entities filter from previous model not incorrectly apply
    await expect(page.locator('#current-model-name')).toHaveText('e-commerce');
  });
});
