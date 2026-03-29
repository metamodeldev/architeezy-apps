import { expect } from '@playwright/test';

import { mockApi, test } from '../fixtures.js';

// ── Fixture data ──────────────────────────────────────────────────────────────

const SPECIAL_CHARS_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/special-chars/content?format=json';

const SPECIAL_CHARS_CONTENT = {
  ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
  content: [
    {
      eClass: 'archi:ArchimateModel',
      id: 'model-root',
      data: {
        name: 'Special Characters',
        elements: [
          {
            eClass: 'archi:ApplicationComponent',
            id: 'comp-comma',
            data: { name: 'Component, Alpha' },
          },
          {
            eClass: 'archi:ApplicationComponent',
            id: 'comp-quote',
            data: { name: 'Component "Beta"' },
          },
          {
            eClass: 'archi:ApplicationComponent',
            id: 'comp-umlaut',
            data: { name: 'Komponente Ä' },
          },
        ],
        relations: [],
      },
    },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-11.3: CSV Format and Encoding', () => {
  test('TC-11.3.1: Special characters in element names are correctly escaped in CSV output', async ({
    page,
  }) => {
    await mockApi(page);
    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'model-special',
                name: 'Special Characters',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: { content: { href: SPECIAL_CHARS_CONTENT_URL } },
              },
            ],
          },
          _links: {},
        }),
      }),
    );
    await page.route(`${SPECIAL_CHARS_CONTENT_URL}*`, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SPECIAL_CHARS_CONTENT),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'Special Characters' }).click();

    await page.locator('#tab-table').click();
    await expect(page.locator('#table-body tr')).toHaveCount(3);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    const content = await download.createReadStream().then(
      (stream) =>
        // oxlint-disable-next-line promise/avoid-new
        new Promise((resolve) => {
          let data = '';
          stream.on('data', (chunk) => (data += chunk));
          stream.on('end', () => resolve(data));
        }),
    );

    // Comma in name → should be quoted
    expect(content).toContain('"Component, Alpha"');
    // Double quotes in name → should be escaped
    expect(content).toContain('"Component ""Beta"""');
  });

  test('TC-11.3.2: Exported CSV file uses UTF-8 with BOM encoding', async ({ page }) => {
    await mockApi(page);
    await page.route('https://architeezy.com/api/models*', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _embedded: {
            models: [
              {
                id: 'model-special',
                name: 'Special Characters',
                contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
                _links: { content: { href: SPECIAL_CHARS_CONTENT_URL } },
              },
            ],
          },
          _links: {},
        }),
      }),
    );
    await page.route(`${SPECIAL_CHARS_CONTENT_URL}*`, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SPECIAL_CHARS_CONTENT),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/');
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'Special Characters' }).click();

    await page.locator('#tab-table').click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv-btn').click(),
    ]);

    const buffer = await download.createReadStream().then(
      (stream) =>
        // oxlint-disable-next-line promise/avoid-new
        new Promise((resolve) => {
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        }),
    );

    // UTF-8 BOM: EF BB BF
    expect(buffer[0]).toBe(0xef);
    expect(buffer[1]).toBe(0xbb);
    expect(buffer[2]).toBe(0xbf);

    // Umlaut character should be present
    const text = buffer.toString('utf8');
    expect(text).toContain('Komponente Ä');
  });
});
