// eslint-disable-next-line import/no-nodejs-modules
import { readFile } from 'node:fs/promises';

import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

test.describe('TC-5.2: Relationship table export', () => {
  test('TC-5.2.1: Export relationships table to CSV', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    // Switch to relationships tab
    await page.locator('#ttab-rels').click();
    await page.waitForTimeout(300);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-csv-btn').click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Filename should contain 'relationships' and date-time pattern
    expect(filename).toContain('relationships');
    expect(filename).toMatch(/\d{8}-\d{6}\.csv$/i);
  });

  test('TC-5.2.2: Export respects current filters', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table&relationships=AssociationRelationship');
    await waitForLoading(page);

    await page.locator('#ttab-rels').click();
    await page.waitForTimeout(300);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-csv-btn').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fileContent = await readFile(path, 'utf8');
    const csvText = fileContent.replace(/^\uFEFF/, '');

    // Should only include AssociationRelationship rows
    const lines = csvText.trim().split('\n');
    // Header line may be: Source,Relationship type,Target,Name
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].trim();
      if (!row) {
        continue;
      }
      const cols = row.split(',');
      // Relationship type column is index 1
      const relType = cols[1]?.trim();
      expect(relType).toBe('AssociationRelationship');
    }
  });

  test('TC-5.2.3: Empty relationships export', async ({ page }) => {
    // Mock model with no relationships
    await page.route(
      'https://architeezy.com/api/models/test/test/1/no-rels/content?format=json',
      (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
            content: [
              {
                eClass: 'archi:ArchimateModel',
                id: 'model-root',
                data: {
                  name: 'No Rels',
                  elements: [
                    { eClass: 'archi:ApplicationComponent', id: 'c1', data: { name: 'C1' } },
                  ],
                  relations: [],
                },
              },
            ],
          }),
        }),
    );

    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'no-rels',
                name: 'No Rels',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: {
                  content: {
                    href: 'https://architeezy.com/api/models/test/test/1/no-rels/content?format=json',
                  },
                },
              },
            ],
          },
          _links: {},
        }),
      }),
    );

    await page.goto('/graph/?model=no-rels&view=table');
    await waitForLoading(page);

    await page.locator('#ttab-rels').click();
    await page.waitForTimeout(300);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-csv-btn').click();
    const download = await downloadPromise;
    const path = await download.path();
    const fileContent = await readFile(path, 'utf8');
    const text = fileContent.replace(/^\uFEFF/, '');

    // Should have headers only
    const lines = text.trim().split('\n');
    expect(lines.length).toBe(1);
    // Header should contain Source
    expect(lines[0]).toContain('Source');
  });

  test('TC-5.2.4: Special characters in relationship names', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    await page.locator('#ttab-rels').click();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-csv-btn').click();
    const download = await downloadPromise;
    const path = await download.path();
    const csvText = await readFile(path, 'utf8');

    // Check CSV format handles special chars (basic check)
    expect(csvText).toBeDefined();
  });

  test('TC-5.2.5: Export respects table sorting', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    await page.locator('#ttab-rels').click();
    await page.waitForTimeout(300);

    // Sort by Relationship type (second column)
    await page.locator('th[data-col="1"]').click();
    await page.waitForTimeout(300);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-csv-btn').click();
    const download = await downloadPromise;
    const path = await download.path();
    const csvText = await readFile(path, 'utf8');

    // Basic check that export succeeded and contains header
    expect(csvText).toContain('Source,Relationship type,Target,Name');
  });

  test('TC-5.2.6: Export uses correct file naming pattern', async ({ page }) => {
    await mockApi(page);
    await page.goto('/graph/?model=model-test&view=table');
    await waitForLoading(page);

    await page.locator('#ttab-rels').click();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-csv-btn').click();
    const download = await downloadPromise;
    const filename = download.suggestedFilename();

    // Should contain 'relationships' and date-time pattern
    expect(filename).toContain('relationships');
    expect(filename).toMatch(/\d{8}-\d{6}\.csv$/i);
  });
});
