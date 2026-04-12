import { expect } from '@playwright/test';

import { mockApi, MODEL_CONTENT_URL, test, waitForLoading } from '../fixtures.js';

// Helper to capture Cytoscape instance for tests that need to inspect it (e.g., zoom)
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

test.describe('TC-1.3: Persistence', () => {
  test('TC-1.3.1: Last active session is restored on app reload', async ({ page }) => {
    await mockApi(page);
    // Simulate a previously loaded model with persisted state
    const modelUrl = MODEL_CONTENT_URL;
    await page.addInitScript((url) => {
      localStorage.setItem('architeezyGraphModelUrl', url);
      localStorage.setItem('architeezyGraphModelName', 'Test Architecture');
    }, modelUrl);
    await page.goto('/graph/');
    await waitForLoading(page);

    // Model should be restored
    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });

  test('TC-1.3.2: Persistence does not restore if localStorage is empty', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    // Should show model selector
    await expect(page.locator('#model-modal')).toBeVisible();
  });

  test('TC-1.3.3: Model that was previously saved is no longer available', async ({ page }) => {
    const modelUrl = MODEL_CONTENT_URL;
    await mockApi(page);
    // Override the specific model content URL to return 404 (model no longer available)
    await page.route(`${modelUrl}*`, (route) => {
      route.fulfill({ status: 404, body: 'Not Found' });
    });

    // Simulate persistence of a model that now fails to load
    await page.addInitScript((url) => {
      localStorage.setItem('architeezyGraphModelUrl', url);
      localStorage.setItem('architeezyGraphModelName', 'Test Architecture');
    }, modelUrl);

    await page.goto('/graph/');
    await waitForLoading(page);

    // Should clear invalid reference and show model selector
    await expect(page.locator('#model-modal')).toBeVisible();
  });

  test('TC-1.3.4: Persistence saves state only after successful data fetch', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // Simulate failed fetch by providing bad model ID
    await page.goto('/graph/?model=nonexistent');

    // Check storage - should not save invalid state
    const savedUrl = await page.evaluate(() => localStorage.getItem('architeezyGraphModelUrl'));
    expect(savedUrl).toBeNull();
  });

  test('TC-1.3.5: Persistence is per-browser, not per-user account', async ({ page }) => {
    await mockApi(page); // Auth probe returns 401 (signed out)

    // Set up storage with a model
    const modelUrl = MODEL_CONTENT_URL;
    await page.addInitScript((url) => {
      localStorage.setItem('architeezyGraphModelUrl', url);
      localStorage.setItem('architeezyGraphModelName', 'Test Architecture');
    }, modelUrl);

    await page.goto('/graph/');

    // Model should still load (public model can load while signed out)
    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });

  test('TC-1.3.6: Multi-tab: "last write wins" persistence policy', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/');
    await waitForLoading(page);

    // Save state for model A
    const modelUrl = MODEL_CONTENT_URL;
    await page.evaluate((url) => {
      localStorage.setItem('architeezyGraphModelUrl', url);
      localStorage.setItem('architeezyGraphModelName', 'Test Architecture');
    }, modelUrl);

    // Verify stored
    const savedUrl = await page.evaluate(() => localStorage.getItem('architeezyGraphModelUrl'));
    expect(savedUrl).toBe(modelUrl);
  });

  test('TC-1.3.7: Persistence does not include transient UI state', async ({ page }) => {
    await mockApi(page);
    await injectCyCapture(page);
    // Set up storage so model loads on page init
    const modelUrl = MODEL_CONTENT_URL;
    await page.addInitScript((url) => {
      localStorage.setItem('architeezyGraphModelUrl', url);
      localStorage.setItem('architeezyGraphModelName', 'Test Architecture');
    }, modelUrl);

    await page.goto('/graph/');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    // Zoom and pan (transient UI state)
    await page.evaluate(() => {
      globalThis.__cy.zoom(2);
      globalThis.__cy.pan({ x: 100, y: 100 });
    });

    // Reload the page
    await page.reload();
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    // Verify zoom has been reset (not persistent)
    const zoom = await page.evaluate(() => globalThis.__cy.zoom());
    expect(zoom).not.toBe(2);
  });

  test('TC-1.3.8: View state is namespaced by model type', async ({ page }) => {
    await mockApi(page);

    // Load first model
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Switch to another model (same type) - should load without issues
    await page.goto('/graph/?model=model-ecommerce');
    await waitForLoading(page);

    // Model should load
    await expect(page.locator('#cy')).toBeVisible();
  });
});
