import { expect } from '@playwright/test';

import { mockApi, test, loadTestModelFromSelector, MODEL_CONTENT_URL } from '../fixtures.js';

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

test.describe('TC-10.7: Authentication Failure and Expiry', () => {
  test('TC-10.7.1: A 401 response during an API call clears the token and shows "Sign in"', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await authenticateUser(page);
    // Wait for init() triggered by AUTH_SUCCESS to finish all network requests
    await page.waitForLoadState('networkidle');

    // Simulate a 401 on the next model content fetch (token expiry)
    await page.route(`${MODEL_CONTENT_URL}*`, (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );

    // Open model selector (renders from cache, no fetch) then click model to trigger content fetch
    await page.locator('#current-model-btn').click();
    await page.locator('.model-item', { hasText: 'Test Architecture' }).click();

    // After 401, the user should be signed out
    await expect(page.locator('#auth-btn')).not.toHaveClass(/hidden/);
  });

  test('TC-10.7.2: "Session expired. Please sign in again." notification appears after 401', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await loadTestModelFromSelector(page);

    await authenticateUser(page);
    // Wait for init() triggered by AUTH_SUCCESS to finish all network requests
    await page.waitForLoadState('networkidle');

    // Simulate a 401 on the next model content fetch (token expiry)
    await page.route(`${MODEL_CONTENT_URL}*`, (r) =>
      r.fulfill({ status: 401, body: 'Unauthorized' }),
    );

    // Open model selector (renders from cache) then click model to trigger the 401
    await page.locator('#current-model-btn').click();
    await page.locator('.model-item', { hasText: 'Test Architecture' }).click();

    // A toast with sign-in prompt should appear
    await expect(page.locator('#toast')).toHaveClass(/visible/);
    await expect(page.locator('#toast-msg')).toContainText(/session|expired|sign in/i);
  });
});
