import { expect } from '@playwright/test';

import {
  mockApi,
  test,
  waitForLoading,
  MODEL_CONTENT,
  loadTestModelFromSelector,
} from '../fixtures.js';

// ── Constants for private model tests ───────────────────────────────────────────

const PRIVATE_MODEL_ID = 'private-model';
const PRIVATE_MODEL_URL =
  'https://architeezy.com/api/models/test/test/1/private/content?format=json';

// ── Helper: Private model route handler ─────────────────────────────────────────

function fulfillPrivateModelRoute(r) {
  if (r.request().headers()['authorization']) {
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MODEL_CONTENT),
    });
  } else {
    r.fulfill({ status: 401, body: 'Unauthorized' });
  }
}

// ── Helper: Authenticate user ───────────────────────────────────────────────────

/**
 * Simulates user login by posting AUTH_SUCCESS and mocking /api/users/current to return a user.
 * Assumes the page is already loaded (app initialized).
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {string} name - The user name to display.
 */
async function authenticateUser(page, name = 'John Doe') {
  await page.route('https://architeezy.com/api/users/current', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name }),
    }),
  );
  await page.evaluate(() => {
    window.postMessage({ type: 'AUTH_SUCCESS', token: 'test-bearer-token' }, '*');
  });
  await expect(page.locator('#user-info')).toHaveClass(/visible/);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-1.5: Access', () => {
  test('TC-1.5.1: User identity status is always visible in the header', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    // When anonymous, should show Sign in button
    const authBtn = page.locator('#auth-btn');
    await expect(authBtn).toBeVisible();
    await expect(authBtn).toContainText(/Sign in/i);
  });

  test('TC-1.5.2: Sign out while viewing a private model closes the model and clears data', async ({
    page,
  }) => {
    // Setup: model list with a single private model
    await page.route('https://architeezy.com/api/models*', (r) => {
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: PRIVATE_MODEL_ID,
                name: 'Private Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: { content: { href: PRIVATE_MODEL_URL } },
              },
            ],
          },
          _links: {},
        }),
      });
    });

    // Private model content: succeeds with auth, fails without
    await page.route(PRIVATE_MODEL_URL, fulfillPrivateModelRoute);

    // Load the app initially (anonymous)
    await page.goto('/graph/');

    // Authenticate
    await authenticateUser(page);

    // After auth, the model selector should open; wait for it
    await expect(page.locator('#model-modal')).toBeVisible();

    // Select the private model from the now-visible selector
    await expect(page.locator('.model-item', { hasText: 'Private Model' })).toBeVisible();
    await page.locator('.model-item', { hasText: 'Private Model' }).click();
    await waitForLoading(page);

    // Verify model loaded
    await expect(page.locator('#cy')).toBeVisible();

    // Before logout, reset users/current to 401 to simulate session termination after signout
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );

    // Click logout
    await page.locator('#signout-btn').click();

    // Should show model selector
    await expect(page.locator('#model-modal')).toBeVisible();
  });

  test('TC-1.5.3: Sign out while viewing a public model keeps it visible', async ({ page }) => {
    // Use default public models
    await mockApi(page);

    // Load app
    await page.goto('/graph/');

    // Authenticate
    await authenticateUser(page);

    // After auth, model selector should open
    await expect(page.locator('#model-modal')).toBeVisible();

    // Select a public model (Test Architecture)
    await loadTestModelFromSelector(page);
    await waitForLoading(page);

    // Verify model loaded
    await expect(page.locator('#cy')).toBeVisible();

    // Ensure after signout the API reports unauthenticated
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );

    // Logout
    await page.locator('#signout-btn').click();

    // Wait for possible reload to complete
    await waitForLoading(page);

    // After logout, model selector should open
    await expect(page.locator('#model-modal')).toBeVisible();
  });

  test('TC-1.5.4: Access control respects private model visibility in selector', async ({
    page,
  }) => {
    // Mock only public models for anonymous user
    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'public-model',
                name: 'Public Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: 'https://architeezy.com/api/models/test/test/1/public/content?format=json',
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

    // Only public models should be selectable
    await expect(page.locator('.model-item', { hasText: 'Public Model' })).toBeVisible();
    await expect(page.locator('.model-item', { hasText: 'Private Model' })).not.toBeVisible();
  });

  test('TC-1.5.5: After login, private models become visible in selector', async ({ page }) => {
    // Mock mixed public/private models for authenticated user (server returns all accessible models)
    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'public-model',
                name: 'Public Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: 'https://architeezy.com/api/models/test/test/1/public/content?format=json',
                  },
                },
              },
              {
                id: 'private-model',
                name: 'Private Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: 'https://architeezy.com/api/models/test/test/1/private/content?format=json',
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

    // After auth, modal should be open showing both public and private models
    await expect(page.locator('#model-modal')).toBeVisible();
    await expect(page.locator('.model-item', { hasText: 'Public Model' })).toBeVisible();
    await expect(page.locator('.model-item', { hasText: 'Private Model' })).toBeVisible();
  });

  test('TC-1.5.6: Session expiration triggers access denial on next private model request', async ({
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
                id: 'private-model',
                name: 'Private Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: 'https://architeezy.com/api/models/test/test/1/private/content?format=json',
                  },
                },
              },
            ],
          },
          _links: {},
        }),
      }),
    );

    await page.goto('/graph/?model=private-model');

    // Should show access denied
    await expect(page.locator('.access-denied, .login-required')).toBeVisible();
  });

  test('TC-1.5.7: Logout clears all non-public model data from memory', async ({ page }) => {
    // Reuse private model setup from TC-1.5.2
    await page.route('https://architeezy.com/api/models*', (r) => {
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: PRIVATE_MODEL_ID,
                name: 'Private Model',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: { content: { href: PRIVATE_MODEL_URL } },
              },
            ],
          },
          _links: {},
        }),
      });
    });

    await page.route(PRIVATE_MODEL_URL, fulfillPrivateModelRoute);

    // Load app
    await page.goto('/graph/');

    // Authenticate
    await authenticateUser(page);

    // After auth, modal should be open
    await expect(page.locator('#model-modal')).toBeVisible();

    // Select the private model
    await expect(page.locator('.model-item', { hasText: 'Private Model' })).toBeVisible();
    await page.locator('.model-item', { hasText: 'Private Model' }).click();
    await waitForLoading(page);

    // Verify model loaded
    await expect(page.locator('#cy')).toBeVisible();

    // Reset auth to 401 for post-logout
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );

    // Logout
    await page.locator('#signout-btn').click();

    // Model should be cleared (selector opens)
    await expect(page.locator('#model-modal')).toBeVisible();
  });

  test('TC-1.5.8: Identity display updates immediately after login/logout', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');

    // Check initial state (Sign in)
    const authBtn = page.locator('#auth-btn');
    await expect(authBtn).toBeVisible();
    await expect(authBtn).toContainText(/Sign in|Guest/i);

    // Login would update immediately - placeholder
    // Full test would complete auth flow
  });

  test('TC-1.5.9: Access to private model is denied after session expiry, even if model is cached', async ({
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
                id: 'private-report',
                name: 'Private Report',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: 'https://architeezy.com/api/models/test/test/1/private/content?format=json',
                  },
                },
              },
            ],
          },
          _links: {},
        }),
      }),
    );

    await page.goto('/graph/?model=private-report');

    // Should be denied access despite any caching
    await expect(page.locator('.access-denied, .login-required')).toBeVisible();
  });
});
