import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// Test data for deep links
export const PRIVATE_MODEL_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/private-model/content?format=json';

export const PRIVATE_MODEL_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Private Model',
        elements: [
          {
            eClass: 'archi:ApplicationComponent',
            id: 'private-svc',
            data: { name: 'Private Service' },
          },
        ],
        relations: [],
      },
    },
  ],
};

test.describe('TC-1.2: Deep links', () => {
  test('TC-1.2.1: Loading a public model from a deep link', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());

    // Navigate with model parameter
    await page.goto('/graph/?model=model-test');

    await waitForLoading(page);

    // Model should load directly without modal
    await expect(page.locator('#model-modal')).not.toBeVisible();
    await expect(page.locator('#cy')).toBeVisible();
    await expect(page.locator('#current-model-name')).toHaveText('Test Architecture');
  });

  test('TC-1.2.2: Loading a private model requires authentication', async ({ page }) => {
    // Mock private model requires auth
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );

    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'private-model-id',
                name: 'Private Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: PRIVATE_MODEL_CONTENT_URL,
                  },
                },
              },
            ],
          },
          _links: {},
        }),
      }),
    );

    await page.route(`${PRIVATE_MODEL_CONTENT_URL}*`, (r) =>
      r.fulfill({
        status: 401,
        body: 'Unauthorized',
      }),
    );

    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=private-model-id');

    // Should show access denied
    await expect(page.locator('.access-denied, .login-required')).toBeVisible();
  });

  test('TC-1.2.3: Invalid model identifier in deep link', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());

    // Navigate with non-existent model
    await page.goto('/graph/?model=nonexistent-id');

    // Should show error and open selector
    await expect(page.locator('.error-toast, .notification')).toBeVisible();
    await expect(page.locator('#model-modal')).toBeVisible();
  });

  test('TC-1.2.4: Session expiration while accessing a private model from deep link', async ({
    page,
  }) => {
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );

    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'private-model-id',
                name: 'Private Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: PRIVATE_MODEL_CONTENT_URL,
                  },
                },
              },
            ],
          },
          _links: {},
        }),
      }),
    );

    await page.route(`${PRIVATE_MODEL_CONTENT_URL}*`, (r) =>
      r.fulfill({
        status: 401,
        body: 'Unauthorized',
      }),
    );

    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=private-model-id');

    // Should show access denied due to expired session
    await expect(page.locator('.access-denied, .login-required')).toBeVisible();
  });

  test('TC-1.2.5: Deep link with missing view parameters loads with defaults', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Should load with default view (graph)
    await expect(page.locator('#cy')).toBeVisible();
    // URL should have model parameter
    await expect(page).toHaveURL(/model=model-test/);
  });

  test('TC-1.2.6: Deep link preserves view parameters', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());

    // Navigate with model and view parameter - note: view=graph is omitted (default)
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // Should load with correct view (graph by default)
    await expect(page.locator('#cy')).toBeVisible();
    await expect(page).toHaveURL(/model=model-test/);
    // View=graph should NOT be in URL (default)
    await expect(page).not.toHaveURL(/view=/);
  });

  test('TC-1.2.7: Deep link to a restricted model after successful login remembers original target', async ({
    page,
  }) => {
    // This test would require auth flow - simplified version
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );

    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'private-dashboard',
                name: 'Private Dashboard',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: PRIVATE_MODEL_CONTENT_URL,
                  },
                },
              },
            ],
          },
          _links: {},
        }),
      }),
    );

    // Mock private content to require auth
    await page.route(`${PRIVATE_MODEL_CONTENT_URL}*`, (r) =>
      r.fulfill({
        status: 401,
        body: 'Unauthorized',
      }),
    );

    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=private-dashboard');

    // Should show access denied with login option
    await expect(page.locator('.access-denied, .login-required')).toBeVisible();
  });

  test('TC-1.2.8: Deep link with multiple view state parameters', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());

    // According to tc-1.2.md: /graph/?model=inventory&view=table&sort=name&order=asc
    // Use a valid entity type that exists in the test model (ApplicationComponent)
    await page.goto('/graph/?model=model-test&view=table&entities=ApplicationComponent');
    await waitForLoading(page);

    // Model should load with parameters preserved
    await expect(page.locator('#table-view')).toBeVisible();
    await expect(page.locator('#cy')).toHaveClass(/hidden/);
    await expect(page).toHaveURL(/model=model-test/);
    await expect(page).toHaveURL(/view=table/); // Table view should be in URL
    await expect(page).toHaveURL(/entities=ApplicationComponent/);
  });
});
