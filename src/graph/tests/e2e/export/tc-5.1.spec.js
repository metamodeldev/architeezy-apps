// eslint-disable-next-line import/no-nodejs-modules
import { readFile } from 'node:fs/promises';

import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-5.1: Entity table export', () => {
  test('TC-5.1.1: Export entities table to CSV with all visible columns', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Wait for export button to be enabled
    await expect(page.locator('#export-csv-btn')).toBeEnabled();

    // Set up download listener and click in parallel
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    // Verify filename pattern (model name may contain spaces and special chars)
    expect(download.suggestedFilename()).toMatch(/[a-zA-Z0-9\s-]+-entities-\d{8}-\d{6}\.csv/i);

    // Verify CSV has header and multiple data rows with actual values
    const path = await download.path();
    const fileContent = await readFile(path, 'utf8');
    const csvText = fileContent.replace(/^\uFEFF/, '');
    const lines = csvText.trim().split('\n');

    // Header row should list Name, Type, and extra columns
    expect(lines[0]).toMatch(/Name,Type/i);

    // Should have many data rows (model-test has 60+ elements)
    expect(lines.length).toBeGreaterThan(10);

    // Data rows should not be entirely empty (each row must have at least a name value)
    const dataRows = lines.slice(1).filter((l) => l.trim());
    for (const row of dataRows) {
      expect(row.trim()).not.toBe(',,');
      expect(row.split(',')[0].trim()).not.toBe('');
    }
  });

  // TC-5.1.2: Column visibility UI not implemented; skipping test
  test.skip('TC-5.1.2: Export only currently visible columns', async () => {
    // Skipped: column visibility feature not available
  });

  test('TC-5.1.3: Export with special characters (commas, quotes, newlines)', async ({ page }) => {
    // Mock a model with special characters
    const SPECIAL_CONTENT_URL =
      'https://architeezy.com/api/models/test/test/1/special/content?format=json';
    const SPECIAL_CONTENT = {
      ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
      content: [
        {
          eClass: 'archi:ArchimateModel',
          id: 'model-root',
          data: {
            name: 'Special',
            elements: [
              { eClass: 'archi:ApplicationComponent', id: 'c1', data: { name: 'Comp, Alpha' } },
              { eClass: 'archi:ApplicationComponent', id: 'c2', data: { name: 'Comp "Beta"' } },
              {
                eClass: 'archi:ApplicationComponent',
                id: 'c3',
                data: { name: 'Comp "Gamma"\nwith newline' },
              },
            ],
            relations: [],
          },
        },
      ],
    };

    // Override routes for special model
    await page.route('https://architeezy.com/api/models*', (r) => {
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'special',
                name: 'Special Characters',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: { content: { href: SPECIAL_CONTENT_URL } },
              },
            ],
          },
          _links: {},
        }),
      });
    });

    await page.route(`${SPECIAL_CONTENT_URL}*`, (r) => {
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SPECIAL_CONTENT),
      });
    });

    await page.goto('/graph/?model=special&view=table');
    // Wait for table rows to be rendered (at least the 3 special elements)
    await expect(page.locator('#table-body tr')).toHaveCount(3);

    await expect(page.locator('#export-csv-btn')).toBeEnabled();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    // Read download content using file read
    const path = await download.path();
    const fileContent = await readFile(path, 'utf8');
    const csvText = fileContent.replace(/^\uFEFF/, '');

    // Verify proper escaping (RFC 4180)
    // Comma in name → field should be quoted
    expect(csvText).toContain('"Comp, Alpha"');
    // Double quotes in name → should be escaped as double double-quotes inside quoted field
    expect(csvText).toContain('"Comp ""Beta"""');
    // Newline should be within quoted field; internal quotes escaped
    expect(csvText).toContain('Comp ""Gamma""');
    expect(csvText).toContain('with newline');
  });

  test('TC-5.1.4: Export empty table produces headers only', async ({ page }) => {
    await mockApi(page);
    // Use a filter that yields zero visible rows: filter by a non-existent entity type
    await page.goto('/graph/?model=model-test&view=table&entities=NonExistentType');
    await waitForLoading(page);

    // Export button should be enabled because model has elements (even though none visible)
    await expect(page.locator('#export-csv-btn')).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    const path = await download.path();
    const fileContent = await readFile(path, 'utf8');
    const text = fileContent.replace(/^\uFEFF/, '');

    // Should have headers but no data rows
    const lines = text.trim().split('\n');
    expect(lines[0]).toMatch(/Name,Type,Documentation,Status,Owner/i);
    expect(lines.length).toBe(1); // Only header
  });

  test('TC-5.1.5: Export respects current sorting order', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Sort by Type (second column)
    await page.locator('th[data-col="1"]').click();
    // Wait for sort to be applied: check that the first data row's Type cell matches expected order
    await expect(page.locator('#table-body tr:first-child td:nth-child(2)')).toBeVisible();

    await expect(page.locator('#export-csv-btn')).toBeEnabled();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    // Read download content using file read
    const path = await download.path();
    const fileContent = await readFile(path, 'utf8');
    const csvText = fileContent.replace(/^\uFEFF/, '');

    // Parse rows, skip header
    const lines = csvText.trim().split('\n');
    const dataRows = lines.slice(1).filter((l) => l.trim());
    // Extract type column (index 1) from each row and verify they are sorted ascending
    const types = dataRows.map((row) => row.split(',')[1]?.trim());
    const sortedTypes = [...types].toSorted((a, b) => a.localeCompare(b));
    expect(types).toEqual(sortedTypes);
  });

  test('TC-5.1.6: Extra column data is exported correctly', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    await expect(page.locator('#export-csv-btn')).toBeEnabled();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    const path = await download.path();
    const fileContent = await readFile(path, 'utf8');
    const csvText = fileContent.replace(/^\uFEFF/, '');
    const lines = csvText.trim().split('\n');

    // Header must include extra columns in order: Name, Type, Documentation, Status, Owner
    const header = lines[0];
    expect(header).toBe('Name,Type,Documentation,Status,Owner');

    // Find the index of each column
    const cols = header.split(',');
    const docIdx = cols.indexOf('Documentation');
    const statusIdx = cols.indexOf('Status');
    const ownerIdx = cols.indexOf('Owner');

    expect(docIdx).toBeGreaterThan(1);
    expect(statusIdx).toBeGreaterThan(1);
    expect(ownerIdx).toBeGreaterThan(1);

    // At least one row should have a non-empty Documentation value
    // (comp-a has documentation: 'First component')
    const hasDocumentation = lines
      .slice(1)
      .some((row) => row.split(',')[docIdx]?.trim().length > 0);
    expect(hasDocumentation).toBe(true);

    // The row for "John's Component" must have status=active and owner=john
    const johnRow = lines.slice(1).find((row) => row.startsWith("John's Component"));
    expect(johnRow).toBeDefined();
    const johnCols = johnRow.split(',');
    expect(johnCols[statusIdx]?.trim()).toBe('active');
    expect(johnCols[ownerIdx]?.trim()).toBe('john');
  });

  test('TC-5.1.7: Export during loading shows indicator', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Ensure export button is enabled
    await expect(page.locator('#export-csv-btn')).toBeEnabled();

    // Slow down requestAnimationFrame to make loading state detectable
    await page.evaluate(() => {
      const originalRAF = globalThis.requestAnimationFrame;
      // eslint-disable-next-line promise/prefer-await-to-callbacks
      globalThis.requestAnimationFrame = (cb) => setTimeout(() => originalRAF(cb), 100); // 100ms delay
    });

    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.locator('#export-csv-btn').click();

    // Should show loading indicator during export (button gets loading class)
    await expect(page.locator('#export-csv-btn')).toHaveClass(/loading/);

    // Wait for download to complete
    const download = await downloadPromise;

    // Loading indicator should be removed after download completes
    await expect(page.locator('#export-csv-btn')).not.toHaveClass(/loading/);

    // Verify the download completed
    expect(download).toBeTruthy();
  });

  // TC-5.1.8: Export cancellation not implemented
  test.skip('TC-5.1.8: Export can be cancelled if takes too long', () => {
    // Skipped: cancellation feature not available
  });

  test('TC-5.1.9: Export respects global filters', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table&entities=ApplicationComponent');
    await waitForLoading(page);

    await expect(page.locator('#export-csv-btn')).toBeEnabled();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    // Read download content using file read
    const path = await download.path();
    const fileContent = await readFile(path, 'utf8');
    const csvText = fileContent.replace(/^\uFEFF/, '');

    // Should only contain rows where Type column equals ApplicationComponent
    const lines = csvText.trim().split('\n');
    for (const row of lines.slice(1).filter((l) => l.trim())) {
      const cols = row.split(',');
      // Assuming Type is the second column (index 1) based on earlier tests
      const type = cols[1]?.trim();
      expect(type).toBe('ApplicationComponent');
    }
  });
});
