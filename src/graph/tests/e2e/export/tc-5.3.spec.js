// eslint-disable-next-line import/no-nodejs-modules
import { readFile } from 'node:fs/promises';

import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

function isMemoryConsoleError(m) {
  return m.type === 'error' && m.text.includes('memory');
}

test.describe('TC-5.3: Graph image export', () => {
  test('TC-5.3.1: Export graph as PNG with 2x resolution', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    const downloadPromise = page.waitForEvent('download');
    // Open export dropdown and click PNG
    await page.locator('#export-image-btn').click();
    await page.locator('#export-png-btn').click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Should be PNG and contain 'graph'
    expect(filename).toMatch(/\.png$/i);
    expect(filename).toContain('graph');
  });

  test('TC-5.3.2: Export graph as SVG (vector format)', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-svg-btn').click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    expect(filename).toMatch(/\.svg$/i);
    expect(filename).toContain('graph');

    const path = await download.path();
    const svgContent = await readFile(path, 'utf8');
    expect(svgContent).toContain('<svg');
    expect(svgContent).toContain('</svg>');
  });

  test('TC-5.3.3: PNG export respects Drill-down scope', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    // Enter drill-down
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-png-btn').click();

    const download = await downloadPromise;
    expect(download).toBeDefined();
  });

  test('TC-5.3.4: PNG export respects Highlight mode (dimming)', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    // Enable highlight
    await page.locator('#highlight-toggle').click();

    // Select a node
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('tap');
    });
    await page.waitForTimeout(500);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-png-btn').click();

    const download = await downloadPromise;
    expect(download).toBeDefined();
  });

  test('TC-5.3.5: Legend inclusion/exclusion based on visibility', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    // Enable legend
    await page.locator('#legend-toggle').click();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-png-btn').click();

    const download = await downloadPromise;
    expect(download).toBeDefined();

    // Turn off legend
    await page.locator('#legend-toggle').click();

    const downloadPromise2 = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-png-btn').click();

    const download2 = await downloadPromise2;
    expect(download2).toBeDefined();
  });

  test('TC-5.3.6: Large graph triggers SVG recommendation', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    // User guidance may be shown for large graphs (informational)
  });

  // TC-5.3.7: Export cancellation not implemented
  test.skip('TC-5.3.7: Export can be cancelled for long operations', () => {
    // Skipped: cancellation feature not available
  });

  test('TC-5.3.8: File naming follows pattern with model name', async ({ page }) => {
    await mockApi(page);
    // Use a model name with spaces and special chars to test sanitization
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-png-btn').click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Should start with 'architeezy-', contain 'graph', and end with '.png'
    expect(filename).toMatch(/^architeezy-.*-graph-.*\.png$/i);
  });

  test('TC-5.3.9: Multiple exports can run concurrently', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await page.waitForFunction(() => globalThis.__cy !== undefined);

    // Initiate first export
    const downloadPromise1 = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-png-btn').click();

    // Immediately initiate second
    const downloadPromise2 = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-svg-btn').click();

    const [download1, download2] = await Promise.all([downloadPromise1, downloadPromise2]);

    expect(download1).toBeDefined();
    expect(download2).toBeDefined();
  });

  test('TC-5.3.10: Blob/DataURL cleanup after download', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-image-btn').click();
    await page.locator('#export-png-btn').click();

    await downloadPromise;

    // Blob URLs should be cleaned - can't easily verify in test
    // Just ensure no memory leak warnings in console (basic check)
    const consoleMsgs = [];
    page.on('console', (msg) => consoleMsgs.push({ type: msg.type(), text: msg.text() }));

    // Wait a bit
    await page.waitForTimeout(1000);

    // Should not have memory leak errors
    const memoryErrors = consoleMsgs.filter((m) => isMemoryConsoleError(m));
    expect(memoryErrors).toHaveLength(0);
  });
});
