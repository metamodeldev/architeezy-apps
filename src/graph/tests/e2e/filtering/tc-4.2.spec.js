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

test.describe('TC-4.2: Bulk actions', () => {
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

  test('TC-4.2.1: "Uncheck all" in Entities hides all entity types', async ({ page }) => {
    // Click "Uncheck all" in Entities section
    await page.locator('[data-action="select-none"][data-kind="elem"]').click();

    // All entity checkboxes should be unchecked (for visible types)
    const entities = ['Microservice', 'Database', 'Queue', 'ExternalAPI'];
    for (const entity of entities) {
      const checkbox = page.locator(`input[data-kind="elem"][data-type="${entity}"]`);
      if (await checkbox.isVisible()) {
        await expect(checkbox).not.toBeChecked();
      }
    }

    // Graph should be empty or show only drill-down root if active
  });

  test('TC-4.2.2: "Check all" in Entities restores all entity types', async ({ page }) => {
    // First uncheck all
    await page.locator('[data-action="select-none"][data-kind="elem"]').click();

    // Then check all
    await page.locator('[data-action="select-all"][data-kind="elem"]').click();

    // All should be checked
    const entities = ['Microservice', 'Database', 'Queue', 'ExternalAPI'];
    for (const entity of entities) {
      const checkbox = page.locator(`input[data-kind="elem"][data-type="${entity}"]`);
      if (await checkbox.isVisible()) {
        await expect(checkbox).toBeChecked();
      }
    }
  });

  test('TC-4.2.3: "Check all" in Relationships shows all relationship types', async ({ page }) => {
    // Uncheck some relationships first
    await page.locator('input[data-kind="rel"][data-type="Calls"]').uncheck();

    // Check all
    await page.locator('[data-action="select-all"][data-kind="rel"]').click();

    // Should have relationships checked
    await expect(page.locator('input[data-kind="rel"][data-type="Calls"]')).toBeChecked();
  });

  test('TC-4.2.4: Bulk actions do not clear search field', async ({ page }) => {
    // Enter search in filter list (Entities)
    await page.locator('#elem-filter-search').fill('micro');
    await page.waitForTimeout(200);

    // Click uncheck all
    await page.locator('[data-action="select-none"][data-kind="elem"]').click();

    // Search should remain
    expect(await page.locator('#elem-filter-search').inputValue()).toBe('micro');
  });

  test('TC-4.2.5: Bulk action on Relationships with mixed visibility', async ({ page }) => {
    // Some relationships unchecked - use Calls as example
    await page.locator('input[data-kind="rel"][data-type="Calls"]').uncheck();

    // Check all relationships
    await page.locator('[data-action="select-all"][data-kind="rel"]').click();

    // All should be checked
    await expect(page.locator('input[data-kind="rel"][data-type="Calls"]')).toBeChecked();

    // Uncheck all
    await page.locator('[data-action="select-none"][data-kind="rel"]').click();

    // All should be unchecked
    await expect(page.locator('input[data-kind="rel"][data-type="Calls"]')).not.toBeChecked();
  });

  test('TC-4.2.6: Bulk actions affect all relationship types regardless of visibility', async ({
    page,
  }) => {
    // Uncheck all entities first - this causes all relationships to have count=0
    await page.locator('[data-action="select-none"][data-kind="elem"]').click();

    // Uncheck Calls to establish the "unchecked" precondition (it starts checked from buildFilters)
    await page.locator('input[data-kind="rel"][data-type="Calls"]').uncheck();

    // Relationship types with count=0 that were unchecked should be hidden from the list
    const callsCheckbox = page.locator('input[data-kind="rel"][data-type="Calls"]');
    await expect(callsCheckbox).not.toBeVisible();

    // Click "Check all" in Relationships - this should affect ALL relationship types
    await page.locator('[data-action="select-all"][data-kind="rel"]').click();

    // Now hidden types like Calls should become visible (even though count is still 0)
    await expect(callsCheckbox).toBeVisible();
    await expect(callsCheckbox).toBeChecked();

    // The row should have the 'dim' class because count=0
    const callsRow = page.locator(
      'label.filter-item:has(input[data-kind="rel"][data-type="Calls"])',
    );
    await expect(callsRow).toHaveClass(/dim/);

    // Verify that even with all relationships checked, no edges appear on graph
    // (because no entities are visible - this is implicit in the design)

    // Now click "Uncheck all" on relationships
    await page.locator('[data-action="select-none"][data-kind="rel"]').click();

    // All relationships should become unchecked
    await expect(callsCheckbox).not.toBeChecked();
    // The type may become hidden again (if it was originally unchecked before bulk action)
    // But the key is that bulk actions work regardless of count visibility
  });
});
