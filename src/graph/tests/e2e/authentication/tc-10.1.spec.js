import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Mocks API to include a private model that returns 401.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 */
async function mockApiWithPrivateModel(page) {
  const PRIVATE_URL = 'https://architeezy.com/api/models/test/test/1/private/content?format=json';
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
              id: 'model-private',
              name: 'Private Architecture',
              contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
              _links: { content: { href: PRIVATE_URL } },
            },
          ],
        },
        _links: {},
      }),
    }),
  );
  await page.route(`${PRIVATE_URL}*`, (r) => r.fulfill({ status: 401, body: 'Unauthorized' }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-10.1: Anonymous Mode', () => {
  test('TC-10.1.1: Application loads without any token and all public models are accessible', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    // Sign in button visible; user info hidden
    await expect(page.locator('#auth-btn')).not.toHaveClass(/hidden/);
    await expect(page.locator('#user-info')).not.toHaveClass(/visible/);

    // Public model loads successfully
    await loadTestModelFromSelector(page);
    await expect(page.locator('#cy')).not.toHaveClass(/hidden/);
  });

  test('TC-10.1.2: Attempting to load a private model in anonymous mode shows a 401 error notification', async ({
    page,
  }) => {
    await mockApiWithPrivateModel(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();

    await page.locator('.model-item', { hasText: 'Private Architecture' }).click();

    await expect(page.locator('#toast')).toBeVisible();
  });
});
