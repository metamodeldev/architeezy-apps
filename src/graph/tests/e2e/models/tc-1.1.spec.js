import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-1.1: Model Selector Interface', () => {
  test('TC-1.1.1: Model selector opens automatically when no model is stored', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    await expect(page.locator('#model-modal')).toBeVisible();
    await expect(page.locator('#cy')).not.toBeVisible();
  });

  test('TC-1.1.2: Selecting a model from the selector loads it and closes the modal', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await page.locator('.model-item', { hasText: 'e-commerce' }).click();
    await waitForLoading(page);

    await expect(page.locator('#model-modal')).toBeHidden();
    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#current-model-name')).toHaveText('e-commerce');
  });

  test('TC-1.1.3: Filtering the model list using search', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    // The model selector should be visible
    await expect(page.locator('#model-modal')).toBeVisible();

    // Type to filter
    await page.locator('#model-search').fill('e-commerce');
    await page.locator('#model-search').press('Enter');

    // Should show e-commerce
    await expect(page.locator('.model-item', { hasText: 'e-commerce' })).toBeVisible();
    // Other models should be hidden
    await expect(page.locator('.model-item', { hasText: 'Test Architecture' })).not.toBeVisible();
  });

  test('TC-1.1.4: Handling an empty model repository', async ({ page }) => {
    // Mock API with empty model list
    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _embedded: { models: [] } }),
      }),
    );

    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    // Modal should show empty state
    await expect(page.locator('#model-modal')).toBeVisible();
    await expect(page.locator('.empty-model-message, .no-models')).toBeVisible();
  });

  test('TC-1.1.5: Model has no elements - handle empty model data', async ({ page }) => {
    // Mock empty model content
    const emptyContent = {
      ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
      content: [
        {
          eClass: 'archi:ArchimateModel',
          id: 'model-root',
          data: {
            name: 'Empty Model',
            elements: [],
            relations: [],
          },
        },
      ],
    };

    await mockApi(page);
    await page.route(
      'https://architeezy.com/api/models/test/test/1/empty-model/content?format=json',
      (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(emptyContent),
        }),
    );

    // Add the empty model to the model list
    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'model-empty',
                name: 'Empty Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: 'https://architeezy.com/api/models/test/test/1/empty-model/content?format=json',
                  },
                },
              },
            ],
          },
          _links: {},
        }),
      }),
    );

    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    await page.locator('.model-item', { hasText: 'Empty Model' }).click();
    await waitForLoading(page);

    // Should show empty state
    await expect(page.locator('.empty-state-message, canvas')).toBeVisible();
  });

  test('TC-1.1.6: Keyboard navigation in the selection modal', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    await expect(page.locator('#model-modal')).toBeVisible();

    // Press down arrow to focus first model
    await page.locator('#model-modal').press('ArrowDown');
    await page.locator('.model-item:first-child').focus();

    // Press enter to select
    await page.keyboard.press('Enter');
    await waitForLoading(page);

    // Modal should close and model loads
    await expect(page.locator('#model-modal')).toBeHidden();
    await expect(page.locator('#cy')).toBeVisible();
  });

  test('TC-1.1.7: Real-time search filtering with multiple queries', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    await expect(page.locator('#model-modal')).toBeVisible();

    const searchInput = page.locator('#model-search');

    // Type "e" - should match e-commerce
    await searchInput.fill('e');
    await expect(page.locator('.model-item', { hasText: 'e-commerce' })).toBeVisible();
    await expect(page.locator('.model-item', { hasText: 'Test Architecture' })).not.toBeVisible();

    // Add more characters
    await searchInput.fill('e-com');
    await expect(page.locator('.model-item', { hasText: 'e-commerce' })).toBeVisible();

    // Clear
    await searchInput.fill('');
    await expect(page.locator('.model-item', { hasText: 'Test Architecture' })).toBeVisible();
  });
});
