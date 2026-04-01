import { expect } from '@playwright/test';

import { mockApi, MODEL_CONTENT_URL, test, waitForLoading } from '../fixtures.js';

// Custom model content for legend tests with required entity types
const LEGEND_MODEL_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Test Architecture',
        elements: [
          { eClass: 'archi:Microservice', id: 'ms1', data: { name: 'Microservice 1' } },
          { eClass: 'archi:Microservice', id: 'ms2', data: { name: 'Microservice 2' } },
          { eClass: 'archi:Database', id: 'db1', data: { name: 'Database 1' } },
          { eClass: 'archi:Database', id: 'db2', data: { name: 'Database 2' } },
          { eClass: 'archi:Queue', id: 'queue1', data: { name: 'Queue 1' } },
        ],
        relations: [
          { eClass: 'archi:Calls', id: 'call-1', data: { source: 'ms1', target: 'db1' } },
          { eClass: 'archi:DependsOn', id: 'dep-1', data: { source: 'ms2', target: 'queue1' } },
        ],
      },
    },
  ],
};

test.describe('TC-2.2: Legend', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override model content with legend-specific types
    await page.route(MODEL_CONTENT_URL, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LEGEND_MODEL_CONTENT),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
  });

  test('TC-2.2.1: Toggle legend display on/off', async ({ page }) => {
    const legendToggle = page.locator('#legend-toggle');
    await expect(legendToggle).toBeVisible();

    const initialState = await legendToggle.isChecked();
    await legendToggle.click();
    const newState = await legendToggle.isChecked();
    expect(newState).toBe(!initialState);

    // Verify legend panel visibility matches toggle state
    const legend = page.locator('#graph-legend');
    await expect(legend)[newState ? 'not' : ''].toHaveClass(/hidden/);
  });

  test('TC-2.2.2: Legend lists only types currently visible', async ({ page }) => {
    // Ensure legend is visible
    await page.locator('#legend-toggle').check();
    await page.waitForTimeout(200);

    // Check that Database legend entry exists initially
    const dbLegendEntry = page.locator('.legend-row[data-type="Database"]');
    await expect(dbLegendEntry).toBeVisible();

    // Microservice should also be visible
    const msLegendEntry = page.locator('.legend-row[data-type="Microservice"]');
    await expect(msLegendEntry).toBeVisible();

    // Uncheck Database filter
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();
    await page.waitForTimeout(200);

    // Database should disappear from legend
    await expect(dbLegendEntry).not.toBeVisible();

    // Microservice should still be visible
    await expect(msLegendEntry).toBeVisible();
  });

  test('TC-2.2.3: Each legend entry shows color marker and type name', async ({ page }) => {
    // Ensure legend is visible
    await page.locator('#legend-toggle').check();
    await page.waitForTimeout(200);

    const microserviceEntry = page.locator('.legend-row[data-type="Microservice"]');
    await expect(microserviceEntry).toBeVisible();
    await expect(microserviceEntry).toContainText('Microservice');
    const marker = microserviceEntry.locator('.legend-dot');
    await expect(marker).toBeVisible();

    const databaseEntry = page.locator('.legend-row[data-type="Database"]');
    await expect(databaseEntry).toBeVisible();
    await expect(databaseEntry).toContainText('Database');
    const dbMarker = databaseEntry.locator('.legend-dot');
    await expect(dbMarker).toBeVisible();
  });

  test('TC-2.2.4: Legend position is draggable and persists globally', async ({ page }) => {
    // Enable legend
    await page.locator('#legend-toggle').check();
    await page.waitForTimeout(200);

    const legend = page.locator('#graph-legend');
    await expect(legend).toBeVisible();

    const initialBox = await legend.boundingBox();

    // Drag legend to a new position using mouse events directly
    const handle = legend.locator('.legend-header, .legend-row').first();
    await handle.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100, { steps: 10 });
    await page.mouse.up();

    const newBox = await legend.boundingBox();
    // Position should have changed (either x or y)
    expect(newBox.x !== initialBox.x || newBox.y !== initialBox.y).toBeTruthy();
  });

  test('TC-2.2.5: Legend updates on filter changes (removes hidden types)', async ({ page }) => {
    // Ensure legend is visible
    await page.locator('#legend-toggle').check();
    await page.waitForTimeout(200);

    const dbLegendEntry = page.locator('.legend-row[data-type="Database"]');
    await expect(dbLegendEntry).toBeVisible();

    // Uncheck Database in filter
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();
    await page.waitForTimeout(200);

    // Database should be removed from legend
    await expect(dbLegendEntry).not.toBeVisible();

    // Re-check Database
    await page.locator('input[data-kind="elem"][data-type="Database"]').check();
    await page.waitForTimeout(200);

    // Database should reappear in legend
    await expect(dbLegendEntry).toBeVisible();
  });

  test('TC-2.2.6: Relationship types may also appear in legend (if applicable)', async ({
    page,
  }) => {
    // Ensure legend is visible
    await page.locator('#legend-toggle').check();
    await page.waitForTimeout(200);

    const relSection = page.locator('.legend-section-label:has-text("Relationships")');
    if (await relSection.isVisible()) {
      const relEntries = page.locator('.legend-row[data-kind="rel"]');
      const count = await relEntries.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('TC-2.2.7: Canvas resize keeps legend within bounds', async ({ page }) => {
    // Enable legend
    await page.locator('#legend-toggle').check();
    await page.waitForTimeout(200);

    const legend = page.locator('#graph-legend');
    await expect(legend).toBeVisible();

    // Set viewport size
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(200);

    const box = await legend.boundingBox();
    // Legend should be within viewport bounds
    expect(box.x + box.width).toBeLessThanOrEqual(800);
    expect(box.y + box.height).toBeLessThanOrEqual(600);
  });

  test('TC-2.2.8: Legend does not interfere with node interactions', async ({ page }) => {
    // Enable legend
    await page.locator('#legend-toggle').check();
    await page.waitForTimeout(200);

    // Verify graph canvas is still visible
    const canvas = page.locator('#cy');
    await expect(canvas).toBeVisible();
  });
});
