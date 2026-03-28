import { expect } from '@playwright/test';

import { MODEL_CONTENT, MODEL_CONTENT_URL, MODEL_LIST, test, waitForLoading } from './fixtures.js';

/**
 * Sets up API mocks with the /api/users/current probe returning a logged-in user.
 *
 * @param {object} page - Playwright page object.
 * @param {{ name?: string; displayName?: string }} [user] - User info for auth mock. Defaults to {
 *   name: 'Alice' }.
 */
async function mockCookieAuth(page, user) {
  const defaultUser = { name: 'Alice' };
  const userData = user ? { ...defaultUser, ...user } : defaultUser;
  await page.route('https://architeezy.com/api/users/current', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(userData) }),
  );
  await page.route('https://architeezy.com/api/models*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MODEL_LIST) }),
  );
  await page.route(`${MODEL_CONTENT_URL}*`, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MODEL_CONTENT),
    }),
  );
}

test.describe('authenticated session', () => {
  test('cookie auth shows user name in the header', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await mockCookieAuth(page);

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(page.locator('#user-name')).toHaveText('Alice');
  });

  test('cookie auth hides the sign-in button', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await mockCookieAuth(page);

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(page.locator('#auth-btn')).toHaveClass(/hidden/);
  });

  test('cookie auth hides the sign-out button (session is server-managed)', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await mockCookieAuth(page);

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(page.locator('#signout-btn')).toHaveClass(/hidden/);
  });

  test('user displayName is used when name field is absent', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await mockCookieAuth(page, { displayName: 'Bob Display' });

    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    await expect(page.locator('#user-name')).toHaveText('Bob Display');
  });

  test('unauthenticated session shows the sign-in button', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    // Probe returns 401 → anonymous
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );
    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MODEL_LIST) }),
    );

    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible({ timeout: 10_000 });

    await expect(page.locator('#auth-btn')).not.toHaveClass(/hidden/);
    await expect(page.locator('#user-info')).not.toHaveClass(/visible/);
  });
});
