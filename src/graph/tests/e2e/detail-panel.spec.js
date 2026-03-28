import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from './fixtures.js';

test.describe('detail panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
  });

  test('shows documentation for element that has it', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    await expect(page.locator('#detail-panel .detail-doc')).toHaveText('First component');
  });

  test('does not render doc div for element without documentation', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-b');
    await waitForLoading(page);

    await expect(page.locator('#detail-panel .detail-doc')).toHaveCount(0);
  });

  test('shows relation name inline when relation has a name', async ({ page }) => {
    // Rel-1: AssociationRelationship, comp-a → comp-b, name "calls"
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    // Rendered as "AssociationRelationship: calls"
    await expect(page.locator('#detail-panel .detail-conn')).toContainText(
      'AssociationRelationship: calls',
    );
  });

  test('shows relation type without colon when relation has no name', async ({ page }) => {
    // Rel-2: ServingRelationship, svc-x → comp-a, no name
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    const connText = await page.locator('#detail-panel .detail-conn').textContent();
    // ServingRelationship should appear without a colon following it
    expect(connText).toContain('ServingRelationship');
    expect(connText).not.toContain('ServingRelationship:');
  });

  test('clicking a connection item in drill mode drills into that node', async ({ page }) => {
    await page.goto('/graph/?model=model-test&entity=comp-a');
    await waitForLoading(page);

    // Click the connection pointing to Component B
    const connItem = page
      .locator('#detail-panel .detail-conn-item')
      .filter({ hasText: 'Component B' });
    await connItem.click();

    await expect(page.locator('#drill-label')).toHaveText('Component B');
  });
});
