import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function injectCyCapture(page) {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'cytoscape', {
      configurable: true,
      get() {
        return globalThis.__cyImpl;
      },
      set(fn) {
        globalThis.__cyImpl = function cyWrapper(...args) {
          const inst = fn.apply(this, args);
          if (inst && typeof inst.$id === 'function') {
            globalThis.__cy = inst;
          }

          return inst;
        };
      },
    });
  });
}

async function waitForCyNode(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const node = globalThis.__cy.$id(id);
    if (!node.length) {
      return false;
    }
    const pos = node.renderedPosition();
    return pos.x > 10 && pos.y > 10;
  }, nodeId);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('TC-2.9: Legend Visibility and Content', () => {
  test.beforeEach(async ({ page }) => {
    await injectCyCapture(page);
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyNode(page, 'comp-a');
  });

  test('TC-2.9.1: Enabling Legend setting makes the legend appear with correct type entries', async ({
    page,
  }) => {
    const toggle = page.locator('#legend-toggle');
    await toggle.check();
    await expect(toggle).toBeChecked();

    const legend = page.locator('#graph-legend');
    await expect(legend).toBeVisible();

    // Both element types from model-test must appear
    await expect(legend.locator('.legend-row[data-type="ApplicationComponent"]')).toBeVisible();
    await expect(legend.locator('.legend-row[data-type="ApplicationService"]')).toBeVisible();

    // Both relationship types must appear
    await expect(legend.locator('.legend-row[data-type="AssociationRelationship"]')).toBeVisible();
    await expect(legend.locator('.legend-row[data-type="ServingRelationship"]')).toBeVisible();

    // Each row must contain a color dot element
    const dotCount = await legend.locator('.legend-row .legend-dot').count();
    expect(dotCount).toBeGreaterThanOrEqual(4);
  });

  test('TC-2.9.2: Filtering out a type removes its entry from the legend', async ({ page }) => {
    await page.locator('#legend-toggle').check();
    const legend = page.locator('#graph-legend');

    // ── Relationship type filter ────────────────────────────────────────────
    // Both relationship types are initially in the legend
    await expect(legend.locator('.legend-row[data-type="AssociationRelationship"]')).toBeVisible();
    await expect(legend.locator('.legend-row[data-type="ServingRelationship"]')).toBeVisible();

    // Uncheck AssociationRelationship: its row disappears, ServingRelationship stays
    await page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]').uncheck();
    await expect(
      legend.locator('.legend-row[data-type="AssociationRelationship"]'),
    ).not.toBeVisible();
    await expect(legend.locator('.legend-row[data-type="ServingRelationship"]')).toBeVisible();

    // Restore AssociationRelationship before the next assertion
    await page.locator('input[data-kind="rel"][data-type="AssociationRelationship"]').check();

    // ── Element type filter ─────────────────────────────────────────────────
    // Both element types are initially in the legend
    await expect(legend.locator('.legend-row[data-type="ApplicationComponent"]')).toBeVisible();
    await expect(legend.locator('.legend-row[data-type="ApplicationService"]')).toBeVisible();

    // Uncheck ApplicationService: its row disappears, ApplicationComponent stays
    await page.locator('input[data-kind="elem"][data-type="ApplicationService"]').uncheck();
    await expect(legend.locator('.legend-row[data-type="ApplicationService"]')).not.toBeVisible();
    await expect(legend.locator('.legend-row[data-type="ApplicationComponent"]')).toBeVisible();
  });

  test('TC-2.9.3: Disabling Legend removes it from the canvas', async ({ page }) => {
    const toggle = page.locator('#legend-toggle');
    await toggle.check();
    await expect(page.locator('#graph-legend')).toBeVisible();

    await toggle.uncheck();
    await expect(page.locator('#graph-legend')).not.toBeVisible();
  });

  test('TC-2.9.4: Legend can be repositioned by dragging', async ({ page }) => {
    await page.locator('#legend-toggle').check();
    const legend = page.locator('#graph-legend');
    await expect(legend).toBeVisible();

    const before = await legend.boundingBox();
    const startX = before.x + before.width / 2;
    const startY = before.y + before.height / 2;
    const deltaX = 160;
    const deltaY = 80;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 12 });
    await page.mouse.up();

    const after = await legend.boundingBox();
    expect(after.x).toBeGreaterThan(before.x + deltaX / 2);
  });

  test('TC-2.9.5: Legend is visible but shows no type rows when all types are filtered out', async ({
    page,
  }) => {
    await page.locator('#legend-toggle').check();
    await expect(page.locator('#graph-legend')).toBeVisible();

    // Select none for both elements and relationships
    await page.locator('[data-action="select-none"][data-kind="elem"]').click();
    await page.locator('[data-action="select-none"][data-kind="rel"]').click();

    const legend = page.locator('#graph-legend');
    await expect(legend).toBeVisible();
    await expect(legend.locator('.legend-row')).toHaveCount(0);
  });

  test('TC-2.9.7: Legend is re-clamped automatically when the canvas shrinks', async ({ page }) => {
    await page.locator('#legend-toggle').check();
    const legend = page.locator('#graph-legend');
    await expect(legend).toBeVisible();

    // Drag legend to the right side of the canvas (within current bounds)
    const container = page.locator('main');
    const containerBox = await container.boundingBox();
    const legendBox = await legend.boundingBox();
    const targetX = containerBox.x + containerBox.width - legendBox.width - 10;

    await page.mouse.move(legendBox.x + legendBox.width / 2, legendBox.y + legendBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetX + legendBox.width / 2, legendBox.y + legendBox.height / 2, {
      steps: 10,
    });
    await page.mouse.up();

    // Shrink the viewport so the legend would extend past the right boundary
    const viewport = page.viewportSize();
    await page.setViewportSize({ width: viewport.width - 200, height: viewport.height });

    // Wait for ResizeObserver to re-clamp the legend
    await page.waitForFunction(() => {
      const el = document.getElementById('graph-legend');
      const parent = el?.parentElement;
      if (!el || !parent) {
        return false;
      }
      const lr = el.getBoundingClientRect();
      const pr = parent.getBoundingClientRect();
      return lr.right <= pr.right - 4; // 5px margin, 1px tolerance
    });

    const after = await legend.boundingBox();
    const newContainerBox = await container.boundingBox();
    expect(after.x + after.width).toBeLessThanOrEqual(
      newContainerBox.x + newContainerBox.width - 4,
    );
  });

  test('TC-2.9.6: Legend is clamped to canvas bounds when dragged beyond the edge', async ({
    page,
  }) => {
    await page.locator('#legend-toggle').check();
    const legend = page.locator('#graph-legend');
    await expect(legend).toBeVisible();

    const container = page.locator('main');
    const containerBox = await container.boundingBox();
    const legendBox = await legend.boundingBox();

    // Drag far past the right and bottom edges of the container
    const startX = legendBox.x + legendBox.width / 2;
    const startY = legendBox.y + legendBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(
      containerBox.x + containerBox.width + 300,
      containerBox.y + containerBox.height + 300,
      { steps: 15 },
    );
    await page.mouse.up();

    const after = await legend.boundingBox();
    const margin = 5;

    // Legend must not exceed container bounds minus margin
    expect(after.x + after.width).toBeLessThanOrEqual(
      containerBox.x + containerBox.width - margin + 1,
    );
    expect(after.y + after.height).toBeLessThanOrEqual(
      containerBox.y + containerBox.height - margin + 1,
    );
  });
});
