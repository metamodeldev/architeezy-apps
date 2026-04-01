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
        ],
        relations: [
          { eClass: 'archi:Calls', id: 'call-1', data: { source: 'ms1', target: 'db1' } },
          { eClass: 'archi:Calls', id: 'call-2', data: { source: 'ms2', target: 'db2' } },
          { eClass: 'archi:DependsOn', id: 'dep-1', data: { source: 'ms1', target: 'queue1' } },
          { eClass: 'archi:Produces', id: 'prod-1', data: { source: 'db1', target: 'api1' } },
          { eClass: 'archi:Triggers', id: 'trigger-1', data: { source: 'queue1', target: 'ms1' } },
        ],
      },
    },
  ],
};

test.describe('TC-4.1: Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    // Override model content with filter-specific types
    await page.route(MODEL_CONTENT_URL, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FILTER_MODEL_CONTENT),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
  });

  test('TC-4.1.1: Toggle entity type visibility', async ({ page }) => {
    // Filter panel is always visible; no toggle needed

    // Uncheck Database
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();

    // Database checkbox should be unchecked
    await expect(page.locator('input[data-kind="elem"][data-type="Database"]')).not.toBeChecked();

    // Re-check
    await page.locator('input[data-kind="elem"][data-type="Database"]').check();
    await expect(page.locator('input[data-kind="elem"][data-type="Database"]')).toBeChecked();
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

  test('TC-4.1.3: "Available" count updates dynamically', async ({ page }) => {
    // Get initial count for Calls relationship (should be 2)
    const initialCallsCount = await page
      .locator('label.filter-item:has(input[data-kind="rel"][data-type="Calls"]) .count')
      .textContent();

    // Uncheck Database (endpoint of Calls relationships)
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();

    // Calls available count should drop to 0 (or show 0/2)
    const newCallsCount = await page
      .locator('label.filter-item:has(input[data-kind="rel"][data-type="Calls"]) .count')
      .textContent();

    // Counts should be different (since both Calls become unavailable)
    expect(newCallsCount).not.toBe(initialCallsCount);
  });

  test('TC-4.1.4: Relationship types hidden or dimmed when count is 0', async ({ page }) => {
    // Setup: Ensure Calls is unchecked (so it qualifies for hiding when count=0)
    // DependsOn remains checked (default) to test dimming.
    await page.locator('input[data-kind="rel"][data-type="Calls"]').uncheck();

    // Uncheck all entities that are endpoints for relationships
    await page.locator('input[data-kind="elem"][data-type="Microservice"]').uncheck();
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();
    await page.locator('input[data-kind="elem"][data-type="Queue"]').uncheck();

    // Types with count=0 that were unchecked should now be hidden from the list entirely
    // The Calls relationship (unchecked) should not be visible
    const callsCheckbox = page.locator('input[data-kind="rel"][data-type="Calls"]');
    await expect(callsCheckbox).not.toBeVisible();

    // Types with count=0 that were previously checked should remain visible but dimmed
    // DependsOn was checked by default and remains checked
    const dependsOnCheckbox = page.locator('input[data-kind="rel"][data-type="DependsOn"]');
    await expect(dependsOnCheckbox).toBeChecked();

    const dependsOnRow = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="DependsOn"])',
    );
    await expect(dependsOnRow).toBeVisible();
    // The row should have the 'dim' class
    await expect(dependsOnRow).toHaveClass(/dim/);
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
    // Verify by checking table body does not contain Database
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
