import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector } from '../fixtures.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

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

test.describe('TC-10.5: Sign-Out Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);
  });

  test('TC-10.5.1: Clicking "Sign out" removes the token, hides user name, and shows "Sign in"', async ({
    page,
  }) => {
    await authenticateUser(page);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#user-name')).toHaveText('John Doe');

    // Reset users/current to 401 so probeAuth in the re-initialised init() stays anonymous
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );
    await page.locator('#signout-btn').click();

    await expect(page.locator('#auth-btn')).not.toHaveClass(/hidden/);
    await expect(page.locator('#user-info')).not.toHaveClass(/visible/);
    await expect(page.locator('#user-name')).toHaveText('');
  });

  test('TC-10.5.2: After sign-out a confirmation toast "Signed out successfully" appears', async ({
    page,
  }) => {
    await authenticateUser(page);
    await page.waitForLoadState('networkidle');

    // Reset users/current to 401 so re-init stays anonymous
    await page.route('https://architeezy.com/api/users/current', (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );
    await page.locator('#signout-btn').click();

    await expect(page.locator('#toast')).toHaveClass(/visible/);
    await expect(page.locator('#toast-msg')).toContainText(/signed out/i);
  });
});
