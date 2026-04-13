/**
 * Performance benchmarks for the Graph app.
 *
 * Measures render time, layout time, and display-state update time on synthetic large graphs. Run
 * these tests to catch performance regressions and to identify bottlenecks before and after code
 * changes.
 *
 * Results are attached to the test report as annotations and logged with console.info for terminal
 * visibility.
 *
 * Usage: bunx playwright test src/graph/tests/e2e/graph/perf.spec.js
 */

import { expect, test } from '@playwright/test';

import { injectCyCapture } from '../cy-helpers.js';
import { waitForLoading } from '../fixtures.js';

// ── GRAPH GENERATOR ───────────────────────────────────────────────────────────

const ELEM_TYPES = [
  'archi:ApplicationComponent',
  'archi:ApplicationService',
  'archi:DataObject',
  'archi:ApplicationFunction',
  'archi:Node',
  'archi:SystemSoftware',
  'archi:Database',
  'archi:Interface',
];

const REL_TYPES = [
  'archi:AssociationRelationship',
  'archi:ServingRelationship',
  'archi:UsedByRelationship',
  'archi:FlowRelationship',
  'archi:RealizationRelationship',
];

/**
 * Generates a synthetic ArchiMate model.
 *
 * @param {number} nodeCount - Number of element nodes to generate.
 * @param {number} edgeDensity - Average edges per node (default 1.5).
 * @returns {object} Model content object in the app's JSON format.
 */
function generateLargeModel(nodeCount, edgeDensity = 1.5) {
  const elements = Array.from({ length: nodeCount }, (_, i) => ({
    eClass: ELEM_TYPES[i % ELEM_TYPES.length],
    id: `perf-node-${i}`,
    data: { name: `Component ${i}` },
  }));

  const targetEdgeCount = Math.floor(nodeCount * edgeDensity);
  const relations = [];
  for (let i = 0; i < targetEdgeCount; i++) {
    const src = i % nodeCount;
    const tgt = (i * 7 + 3) % nodeCount; // Deterministic, non-sequential spread
    if (src !== tgt) {
      relations.push({
        eClass: REL_TYPES[i % REL_TYPES.length],
        id: `perf-edge-${i}`,
        data: { source: `perf-node-${src}`, target: `perf-node-${tgt}` },
      });
    }
  }

  return {
    ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
    content: [
      {
        eClass: 'archi:ArchimateModel',
        id: 'model-root',
        data: {
          name: `Perf Model (${nodeCount} nodes)`,
          elements,
          relations,
        },
      },
    ],
  };
}

// ── MOCK SETUP ────────────────────────────────────────────────────────────────

const PERF_CONTENT_URL =
  'https://architeezy.com/api/models/test/test/1/perf-model/content?format=json';

function corsHeaders(r) {
  const origin = r.request().headers().origin ?? 'http://localhost:4200';
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' };
}

/**
 * Registers API mocks backed by the provided model content.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {object} modelContent - Model content to serve at the perf content URL.
 */
async function mockApiWithContent(page, modelContent) {
  await page.route('https://architeezy.com/api/users/current', (r) =>
    r.fulfill({ status: 401, headers: corsHeaders(r), body: 'Unauthorized' }),
  );

  await page.route('https://architeezy.com/api/models*', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders(r),
      body: JSON.stringify({
        _embedded: {
          models: [
            {
              id: 'model-perf',
              name: 'Performance Test Model',
              contentType: 'application/vnd.opengroup.archimate/metamodel/archimate/3.0/',
              _links: { content: { href: PERF_CONTENT_URL } },
            },
          ],
        },
        _links: {},
      }),
    }),
  );

  await page.route(`${PERF_CONTENT_URL}*`, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders(r),
      body: JSON.stringify(modelContent),
    }),
  );
}

// ── BROWSER HOOKS ─────────────────────────────────────────────────────────────

/**
 * Waits until Cytoscape exists AND the layout has finished.
 *
 * `__layoutRunning` transitions: `undefined` (before first layout) → `true` (during layout) →
 * `false` (after `layoutstop`). The strict `=== false` check blocks on both `undefined` and `true`,
 * so this is safe to call immediately after navigation.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {number} timeout - Maximum wait in milliseconds.
 */
async function waitForLayout(page, timeout = 45_000) {
  await page.waitForFunction(
    () => globalThis.__cy !== undefined && globalThis.__layoutRunning === false,
    { timeout },
  );
}

// ── RESULT REPORTING ──────────────────────────────────────────────────────────

/**
 * Attaches a timing result to the Playwright report and logs it.
 *
 * @param {string} label - Metric name shown in the report.
 * @param {number} ms - Measured time in milliseconds.
 */
function record(label, ms) {
  test.info().annotations.push({ type: 'perf', description: `${label}: ${ms.toFixed(1)} ms` });
  console.info(`[PERF] ${label}: ${ms.toFixed(1)} ms`); // eslint-disable-line no-console
}

// ── THRESHOLDS ────────────────────────────────────────────────────────────────
// Upper bounds sized to catch regressions on a typical dev machine with the
// Default grid layout. Raise them if baseline numbers are consistently higher.

const MAX_LOAD_LAYOUT_MS = {
  100: 8000,
  500: 25_000,
  1000: 60_000,
};
const MAX_FILTER_TOGGLE_MS = 500;
const MAX_HIGHLIGHT_MS = 500;
const MAX_HEAP_MB = 512;

// ── TESTS ─────────────────────────────────────────────────────────────────────

test.describe('@perf Graph performance', () => {
  // Run serially so tests do not compete for CPU or memory.
  test.describe.configure({ mode: 'serial' });

  // ── 1. Load + layout ───────────────────────────────────────────────────────

  for (const nodeCount of [100, 500, 1000]) {
    test(`PERF-1.${nodeCount}: load + layout time for ${nodeCount} nodes`, async ({ page }) => {
      test.setTimeout(90_000);

      await injectCyCapture(page);
      await mockApiWithContent(page, generateLargeModel(nodeCount));
      await page.addInitScript(() => {
        localStorage.clear();
      });

      const start = Date.now();
      await page.goto('/graph/?model=model-perf');
      await waitForLoading(page);
      await waitForLayout(page, 80_000);
      const elapsed = Date.now() - start;

      const nodes = await page.evaluate(() => globalThis.__cy.nodes().length);

      record(`Load+Layout ${nodeCount} nodes`, elapsed);

      expect(nodes).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(MAX_LOAD_LAYOUT_MS[nodeCount]);
    });
  }

  // ── 2. Filter toggle ───────────────────────────────────────────────────────

  test('PERF-2: filter toggle on 500-node graph', async ({ page }) => {
    test.setTimeout(60_000);

    await injectCyCapture(page);
    await mockApiWithContent(page, generateLargeModel(500));
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/graph/?model=model-perf');
    await waitForLoading(page);
    await waitForLayout(page);

    await page
      .locator('#elem-filter-list input[type="checkbox"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });

    const visibleBefore = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);

    const t0 = Date.now();
    await page.locator('#elem-filter-list input[type="checkbox"]').first().uncheck();

    // Wait for Cytoscape to reflect the filter: some visible nodes should disappear.
    await page.waitForFunction(
      (before) => globalThis.__cy.nodes(':visible').length < before,
      visibleBefore,
      { timeout: 5000 },
    );
    const elapsed = Date.now() - t0;

    record('Filter toggle 500 nodes', elapsed);
    expect(elapsed).toBeLessThan(MAX_FILTER_TOGGLE_MS);
  });

  // ── 3. Highlight mode ──────────────────────────────────────────────────────

  test('PERF-3: highlight propagation on 500-node graph', async ({ page }) => {
    test.setTimeout(60_000);

    await injectCyCapture(page);
    await mockApiWithContent(page, generateLargeModel(500));
    await page.addInitScript(() => {
      localStorage.clear();
      // Pre-enable highlight mode so the service starts with it active.
      localStorage.setItem('architeezyGraphHighlightEnabled', 'true');
    });

    await page.goto('/graph/?model=model-perf');
    await waitForLoading(page);
    await waitForLayout(page);

    // Trigger a tap on the first visible node via Cytoscape's event system.
    await page.evaluate(() => {
      globalThis.__cy.nodes(':visible').first().trigger('tap');
    });

    // Wait for faded class to propagate: highlight dims all non-neighbour nodes.
    const t0 = Date.now();
    await page.waitForFunction(() => globalThis.__cy.nodes('.faded').length > 0, {
      timeout: 5000,
    });
    const elapsed = Date.now() - t0;

    record('Highlight propagation 500 nodes', elapsed);
    expect(elapsed).toBeLessThan(MAX_HIGHLIGHT_MS);
  });

  // ── 4. Memory ──────────────────────────────────────────────────────────────

  test('PERF-4: JS heap after loading 1000-node graph', async ({ page }) => {
    test.setTimeout(90_000);

    await injectCyCapture(page);
    await mockApiWithContent(page, generateLargeModel(1000));
    await page.addInitScript(() => {
      localStorage.clear();
    });

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');

    await page.goto('/graph/?model=model-perf');
    await waitForLoading(page);
    await waitForLayout(page, 80_000);

    // Force a GC pass to measure live objects rather than pending garbage.
    await cdp.send('HeapProfiler.collectGarbage');

    const { metrics } = await cdp.send('Performance.getMetrics');
    const heapUsed = metrics.find((m) => m.name === 'JSHeapUsedSize').value;
    const heapTotal = metrics.find((m) => m.name === 'JSHeapTotalSize').value;

    record('JS Heap Used (1000 nodes) MB', heapUsed / 1024 / 1024);
    record('JS Heap Total (1000 nodes) MB', heapTotal / 1024 / 1024);

    expect(heapUsed).toBeLessThan(MAX_HEAP_MB * 1024 * 1024);
  });

  // ── 5. Graph rebuild (containment mode switch) ─────────────────────────────

  test('PERF-5: graph rebuild on 500-node graph', async ({ page }) => {
    test.setTimeout(60_000);

    await injectCyCapture(page);
    await mockApiWithContent(page, generateLargeModel(500));
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/graph/?model=model-perf');
    await waitForLoading(page);
    await waitForLayout(page);

    const containmentSelect = page.locator('#containment-select');
    await containmentSelect.waitFor({ state: 'visible', timeout: 5000 });

    // Switching containment mode triggers a full graph rebuild + re-layout.
    const t0 = Date.now();
    await containmentSelect.selectOption('compound');
    await waitForLayout(page);
    const elapsed = Date.now() - t0;

    record('Rebuild on containment switch 500 nodes', elapsed);
    // Rebuild should complete within the same budget as initial load.
    expect(elapsed).toBeLessThan(MAX_LOAD_LAYOUT_MS[500]);
  });

  // ── 6. Trace for bottleneck analysis ──────────────────────────────────────
  //
  // Writes two artefacts to the test attachment directory:
  //   - trace.zip   — open at trace.playwright.dev to see the full timeline
  //                   (network, JS tasks, layout, paint, rAF)
  //   - profile.json — open in Chrome DevTools > Performance > Load profile
  //                    To get a JS flamegraph of the load+layout phase
  //
  // Run this test in isolation when you need to dig into a slowdown:
  //   bunx playwright test --grep "PERF-6"

  test('PERF-6: trace + CPU profile for 500-node load', async ({ page }) => {
    test.setTimeout(90_000);

    await injectCyCapture(page);
    await mockApiWithContent(page, generateLargeModel(500));
    await page.addInitScript(() => {
      localStorage.clear();
    });

    const cdp = await page.context().newCDPSession(page);

    await page.context().tracing.start({ screenshots: true, snapshots: true });
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.start');

    await page.goto('/graph/?model=model-perf');
    await waitForLoading(page);
    await waitForLayout(page, 80_000);

    const { profile } = await cdp.send('Profiler.stop');
    const tracePath = test.info().outputPath('trace.zip');
    const profilePath = test.info().outputPath('profile.json');
    await page.context().tracing.stop({ path: tracePath });

    const fs = await import('node:fs/promises'); // eslint-disable-line import/no-nodejs-modules
    await fs.writeFile(profilePath, JSON.stringify(profile));

    test
      .info()
      .attachments.push(
        { name: 'trace.zip', path: tracePath, contentType: 'application/zip' },
        { name: 'profile.json', path: profilePath, contentType: 'application/json' },
      );

    console.info('[PERF] trace →', tracePath); // eslint-disable-line no-console
    console.info('[PERF] CPU profile →', profilePath); // eslint-disable-line no-console
  });
});
