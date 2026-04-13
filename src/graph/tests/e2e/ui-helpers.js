import { expect } from '@playwright/test';

import { waitForCyReady } from './cy-helpers.js';

// ── UI helpers for e2e tests ──────────────────────────────────────────────────

/**
 * Enters drill-down mode by double-clicking (dbltap) the given node. Waits until the drill-down
 * label becomes visible.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string} nodeId - Cytoscape node ID.
 */
export async function enterDrillDown(page, nodeId) {
  await waitForCyReady(page);
  await page.evaluate((id) => {
    const node = globalThis.__cy.$id(id);
    if (node.length) {
      node.trigger('dbltap');
    }
  }, nodeId);
  await expect(page.locator('#drill-label')).toBeVisible();
}

/**
 * Exits drill-down mode by clicking the exit button (if visible).
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 */
export async function exitDrillDown(page) {
  const btn = page.locator('#drill-exit-btn');
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Switches to Table view and waits for the view to become visible.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 */
export async function switchToTableView(page) {
  await page.locator('#tab-table').click();
  await expect(page.locator('#table-view')).toBeVisible();
}

/**
 * Switches to Graph view and waits for the canvas to become visible.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 */
export async function switchToGraphView(page) {
  await page.locator('#tab-graph').click();
  await expect(page.locator('#cy')).toBeVisible();
}

/**
 * Returns the table column headers as trimmed strings.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @returns {Promise<string[]>} Trimmed header strings.
 */
export async function getTableHeaders(page) {
  const raw = await page.locator('#table-head th').allTextContents();
  return raw.map((h) => h.trim());
}
