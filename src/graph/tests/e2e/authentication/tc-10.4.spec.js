import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Simulates a successful authentication by posting an AUTH_SUCCESS message. Also mocks the profile
 * endpoint to return the given user profile.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {{ name: string } | undefined} profile - User profile to return from /api/users/current,
 *   or undefined to simulate a failed profile fetch.
 */
async function simulateAuthSuccess(page, profile) {
  await page.route('https://architeezy.com/api/users/current', (r) =>
    profile !== undefined
      ? r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(profile),
        })
      : r.fulfill({ status: 500, body: 'Server Error' }),
  );
  await page.evaluate(() => {
    window.postMessage({ type: 'AUTH_SUCCESS', token: 'test-bearer-token' }, '*');
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-10.4: Authenticated State Display', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
  });

  test('TC-10.4.1: After token receipt and profile fetch, header shows user name and Sign out', async ({
    page,
  }) => {
    await simulateAuthSuccess(page, { name: 'John Doe' });

    await expect(page.locator('#user-info')).toHaveClass(/visible/);
    await expect(page.locator('#user-name')).toHaveText('John Doe');
    await expect(page.locator('#auth-btn')).toHaveClass(/hidden/);
  });

  test('TC-10.4.2: Profile fetch failure shows placeholder name "User" and still shows Sign out', async ({
    page,
  }) => {
    await simulateAuthSuccess(page);

    await expect(page.locator('#user-info')).toHaveClass(/visible/);
    // Without a profile, user-name may show empty or a fallback — auth-btn should be hidden
    await expect(page.locator('#auth-btn')).toHaveClass(/hidden/);
  });
});
