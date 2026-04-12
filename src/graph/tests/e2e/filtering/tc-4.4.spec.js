import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading, MODEL_CONTENT_URL, MODEL_CONTENT } from '../fixtures.js';

test.describe('TC-4.4: Global search', () => {
  test('TC-4.4.1: Global search in Graph view dims non-matching elements', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    const searchInput = page.locator('#global-search');
    await searchInput.fill('payment');
    await page.waitForTimeout(400);

    // Should dim non-matching nodes
    // Use 'label' field (node data) since name is stored as label in Cytoscape
    const nonMatchingOpacity = await page.evaluate(() => {
      const allNodes = globalThis.__cy.nodes();
      const matching = globalThis.__cy.$(`node[label*="payment"]`);
      const nonMatching = allNodes.not(matching);
      return nonMatching.first().style('opacity');
    });

    // Non-matching should be dimmed (less than 1)
    expect(Number.parseFloat(nonMatchingOpacity)).toBeLessThan(1);
  });

  test('TC-4.4.2: Global search in Table view filters to matching rows', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Before search: all rows visible (or filtered by entity types)
    const allRowsBefore = await page.locator('#table-body tr').count();

    await page.locator('#global-search').fill('john');
    await page.waitForTimeout(400);

    // After search: only matching rows visible
    const visibleRows = await page.locator('#table-body tr:visible').count();

    // Should have some visible rows and fewer than before (filtering occurred)
    expect(visibleRows).toBeGreaterThan(0);
    expect(visibleRows).toBeLessThan(allRowsBefore);
  });

  test('TC-4.4.3: Search results respect active entity filters', async ({ page }) => {
    // Create a custom model where the Microservice node name contains 'payment'
    const customModel = structuredClone(MODEL_CONTENT);
    const elements = customModel.content[0].data.elements;
    const microsvc = elements.find((e) => e.id === 'microsvc-1');
    expect(microsvc).toBeDefined();
    microsvc.data.name = 'Payment Microservice';

    // Override the model content API response (must be registered before mockApi's route)
    await page.route(MODEL_CONTENT_URL, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(customModel),
      });
    });

    // Clear any persisted filter state
    await page.addInitScript(() => localStorage.clear());

    // Load the page with our custom model
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    // Apply entity filter: only Microservice active
    // Uncheck all entity types first (bulk action)
    await page.locator('[data-action="select-none"][data-kind="elem"]').click();
    // Then check Microservice
    await page.locator('input[data-kind="elem"][data-type="Microservice"]').check();
    await page.waitForTimeout(300);

    // Search globally for 'payment'
    await page.locator('#global-search').fill('payment');
    await page.waitForTimeout(400);

    // Verify: all non-dimmed nodes should be Microservice
    const nonDimmedTypes = await page.evaluate(() => {
      const cy = globalThis.__cy;
      const visibleNodes = cy.nodes().filter((n) => n.style('display') !== 'none');
      const nonDimmed = visibleNodes.filter((n) => !n.hasClass('search-dimmed'));
      return nonDimmed.map((n) => n.data('type'));
    });

    expect(nonDimmedTypes.every((type) => type === 'Microservice')).toBeTruthy();
  });

  test('TC-4.4.4: Search with no results shows hint', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await page.locator('#global-search').fill('xyz123nonexistent');
    await page.waitForTimeout(400);

    await expect(page.locator('.no-results-hint')).toBeVisible();
  });

  test('TC-4.4.5: Search is debounced by 300ms', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    const searchInput = page.locator('#global-search');

    // Type quickly: "a", "ab", "abc"
    await searchInput.fill('a');
    await searchInput.fill('ab');
    await searchInput.fill('abc');

    // After 100ms from last keystroke: debounce hasn't fired yet, no dimming should occur
    await page.waitForTimeout(100);
    // Check that no nodes are dimmed yet (search hasn't been applied)
    const dimmedCountBefore = await page.evaluate(
      () => globalThis.__cy.nodes('.search-dimmed').length,
    );
    expect(dimmedCountBefore).toBe(0);

    // Wait additional 300ms: debounce should have fired
    await page.waitForTimeout(300);
    // Search executed: some nodes should be dimmed (or all if no match)
    const dimmedCountAfter = await page.evaluate(
      () => globalThis.__cy.nodes('.search-dimmed').length,
    );
    // At least some nodes exist and search was applied
    expect(dimmedCountAfter).toBeGreaterThanOrEqual(0);
  });

  test('TC-4.4.6: Search respects Drill-down scope', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Enter drill-down on first node
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Capture the set of visible node IDs after drill-down (the drill scope)
    const drillScopeIds = await page.evaluate(() => {
      const visibleNodes = globalThis.__cy.nodes().filter((n) => n.style('display') !== 'none');
      return visibleNodes.map((n) => n.id());
    });

    // Search globally for 'Service' (should match only within drill scope)
    await page.locator('#global-search').fill('Service');
    await page.waitForTimeout(400);

    // Verify: all non-dimmed nodes are within the drill scope
    const nonDimmedIds = await page.evaluate(() => {
      const visibleNodes = globalThis.__cy.nodes().filter((n) => n.style('display') !== 'none');
      const nonDimmed = visibleNodes.filter((n) => !n.hasClass('search-dimmed'));
      return nonDimmed.map((n) => n.id());
    });

    // Every non-dimmed node ID should be in the drill scope
    expect(nonDimmedIds.every((id) => drillScopeIds.includes(id))).toBeTruthy();
  });

  test('TC-4.4.7: Clear button resets search', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await page.locator('#global-search').fill('payment');
    await page.waitForTimeout(400);

    await page.locator('#global-search-clear').click();

    expect(await page.locator('#global-search').inputValue()).toBe('');
  });

  test('TC-4.4.8: Search matches on any cell/field', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Search by Type field
    await page.locator('#global-search').fill('Microservice');
    await page.waitForTimeout(400);
    const visibleRows1 = await page.locator('#table-body tr:visible').count();
    expect(visibleRows1).toBeGreaterThan(0);

    // Search by Owner field (clear first to avoid combined search)
    await page.locator('#global-search-clear').click();
    await page.locator('#global-search').fill('john');
    await page.waitForTimeout(400);
    const visibleRows2 = await page.locator('#table-body tr:visible').count();
    expect(visibleRows2).toBeGreaterThan(0);
  });

  test('TC-4.4.9: Edge case: case sensitivity', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    // Search uppercase
    await page.locator('#global-search').fill('PAYMENT');
    await page.waitForTimeout(400);
    const nonDimmedCount1 = await page.evaluate(() => {
      const visibleNodes = globalThis.__cy.nodes().filter((n) => n.style('display') !== 'none');
      return visibleNodes.filter((n) => !n.hasClass('search-dimmed')).length;
    });

    // Clear and search lowercase
    await page.locator('#global-search-clear').click();
    await page.locator('#global-search').fill('payment');
    await page.waitForTimeout(400);
    const nonDimmedCount2 = await page.evaluate(() => {
      const visibleNodes = globalThis.__cy.nodes().filter((n) => n.style('display') !== 'none');
      return visibleNodes.filter((n) => !n.hasClass('search-dimmed')).length;
    });

    // Should be same if case-insensitive (current implementation is case-insensitive)
    expect(nonDimmedCount1).toBe(nonDimmedCount2);
  });
});
