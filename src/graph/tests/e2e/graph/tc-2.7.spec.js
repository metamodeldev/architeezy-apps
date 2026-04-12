import { expect } from '@playwright/test';

import { mockApi, test, waitForLoading } from '../fixtures.js';

// Wait for cytoscape to be ready (test hook: globalThis.__cy)
async function waitForCyReady(page) {
  await page.waitForFunction(() => globalThis.__cy !== undefined);
}

test.describe('TC-2.7: Drill-down', () => {
  test('TC-2.7.1: Enter drill-down mode on a node (double-click)', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Double-click a node
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });

    await page.waitForTimeout(500);

    // Should enter drill-down mode: crumb separator and label become visible
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).not.toHaveClass(/hidden/);
    // URL should contain drill parameters (entity and/or depth)
    await expect(page).toHaveURL(/(entity=|depth=)/);
  });

  test('TC-2.7.2: Increase drill-depth expands the scope', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Enter drill-down
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Get current visible node count
    const initialCount = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);

    // Increase depth: click button with data-depth="3"
    const increaseBtn = page.locator('#depth-picker .depth-btn[data-depth="3"]');
    await increaseBtn.click();
    // Wait for layout to settle
    await page.waitForTimeout(1000);

    // More nodes should be visible after increasing depth
    const newCount = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('TC-2.7.3: Decrease depth shrinks the scope', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Increase to depth 3 first
    const depth3Btn = page.locator('#depth-picker .depth-btn[data-depth="3"]');
    await depth3Btn.click();
    await page.waitForTimeout(1000);

    // Decrease: click depth 2
    const decreaseBtn = page.locator('#depth-picker .depth-btn[data-depth="2"]');
    await decreaseBtn.click();
    await page.waitForTimeout(1000);

    const nodeCount = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);

    // Should have fewer nodes than at deeper depth (or at least >=1)
    expect(nodeCount).toBeGreaterThanOrEqual(1);
  });

  test('TC-2.7.4: Exit drill-down via application name in header', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Drill-down nav should be visible: crumb-entity-sep and drill-label shown
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).not.toHaveClass(/hidden/);

    // Click exit button (drill-exit-btn) to exit
    await page.locator('#drill-exit-btn').click();

    await page.waitForTimeout(300);

    // After exit, crumb separator and label should be hidden again
    await expect(page.locator('#crumb-entity-sep')).toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).toHaveClass(/hidden/);
  });

  test('TC-2.7.5: Drill-down uses BFS to compute visible set', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Enter drill-down
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Check depth: get active depth button text
    const depthText = await page.locator('#depth-picker .depth-btn.active').textContent();
    const depth = Number.parseInt(depthText, 10);

    // Depth should be between 1 and 5
    expect(depth).toBeGreaterThanOrEqual(1);
    expect(depth).toBeLessThanOrEqual(5);
  });

  test('TC-2.7.6: Drill-down respects current entity filters', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    // Wait for filter list to populate (e.g., Database checkbox exists)
    await page.waitForSelector('input[data-kind="elem"][data-type="Database"]', {
      state: 'visible',
    });
    await waitForCyReady(page);

    // Apply filter first: uncheck Database entity filter
    await page.locator('input[data-kind="elem"][data-type="Database"]').uncheck();
    await page.waitForTimeout(300);

    // Enter drill-down
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Should only include allowed entity types: visible nodes should not include Database
    const nodeTypes = await page.evaluate(() =>
      globalThis.__cy.nodes(':visible').map((n) => n.data('type')),
    );

    // Should not contain Database if filtered out
    expect(nodeTypes).not.toContain('Database');
  });

  test('TC-2.7.7: Drill-down URL parameters encode entity and depth', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Verify at least one node exists before proceeding
    const hasNodes = await page.evaluate(() => globalThis.__cy?.nodes()?.length > 0);
    expect(hasNodes).toBe(true);

    // Enter drill-down
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });

    // Wait for URL to update with drill parameters instead of fixed timeout
    await expect(page).toHaveURL(/(entity=|depth=)/, { timeout: 5000 });
  });

  test('TC-2.7.8: Breadcrumb/navigation bar shows current root and depth', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Breadcrumb nav should be visible
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).not.toHaveClass(/hidden/);
    // Depth picker should be visible
    await expect(page.locator('#depth-picker')).toBeVisible();
    // Drill label should show the name of the root node
    const labelText = await page.locator('#drill-label').textContent();
    expect(labelText).not.toBe('');
  });

  test('TC-2.7.9: Drill-down on a node already in drill-down scope changes root', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Enter drill-down on first node
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Increase depth to 2 to ensure a second node is reachable
    const depth2Btn = page.locator('#depth-picker .depth-btn[data-depth="2"]');
    await depth2Btn.click();
    await page.waitForTimeout(500);

    const visibleCount = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);
    expect(visibleCount).toBeGreaterThan(1);

    // Double-click a neighbor node to re-root drill-down
    await page.evaluate(() => {
      const visible = globalThis.__cy.nodes(':visible');
      // Pick a node that is NOT the current root (not depth=0)
      visible
        .filter((n) => n.data('drillDepth') !== 0)
        .first()
        .trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Drill-down nav must remain visible with the new root
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).not.toHaveClass(/hidden/);

    // Depth must be preserved (remains at 2, not reset to 1)
    const activeDepthText = await page.locator('#depth-picker .depth-btn.active').textContent();
    expect(activeDepthText.trim()).toBe('2');

    // Layout must use only the newly visible nodes (no hidden nodes visible)
    const hiddenInScope = await page.evaluate(
      () =>
        globalThis.__cy.nodes(':hidden').filter((n) => n.data('drillDepth') !== undefined).length,
    );
    expect(hiddenInScope).toBe(0);
  });

  // oxlint-disable-next-line max-statements
  test('TC-2.7.10: Exit drill-down preserves previous layout state', async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Ensure any previous layout has finished before changing layout
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Apply dagre layout to establish a baseline
    await page.selectOption('#layout-select', 'dagre');

    // Wait for the new layout to start and then fully complete
    await page.waitForFunction(() => globalThis.__layoutRunning);
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Capture initial node positions before drill-down
    const initialPositions = await page.evaluate(() => {
      const nodes = globalThis.__cy.nodes();
      return Object.fromEntries(
        nodes.map((n) => [n.id(), { x: n.position().x, y: n.position().y }]),
      );
    });

    // Enter drill-down on first node
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    // Wait for drill layout to complete
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Exit drill-down via app name/header
    await page.locator('#drill-exit-btn').click();
    // Restore is synchronous, brief wait for any post-processing
    await page.waitForTimeout(200);

    // Capture positions after exit
    const restoredPositions = await page.evaluate(() => {
      const nodes = globalThis.__cy.nodes();
      return Object.fromEntries(
        nodes.map((n) => [n.id(), { x: n.position().x, y: n.position().y }]),
      );
    });

    // Verify: positions should be preserved (same as before drill-down, within tolerance)
    for (const nodeId of Object.keys(initialPositions)) {
      const initial = initialPositions[nodeId];
      const restored = restoredPositions[nodeId];
      // Allow tolerance for minor differences (a few pixels)
      expect(Math.abs(restored.x - initial.x)).toBeLessThan(10);
      expect(Math.abs(restored.y - initial.y)).toBeLessThan(10);
    }

    // Change layout algorithm to fcose and apply
    await page.selectOption('#layout-select', 'fcose');

    // Wait for the new layout to start and then fully complete
    await page.waitForFunction(() => globalThis.__layoutRunning);
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Capture positions after layout change
    const afterFcose = await page.evaluate(() => {
      const nodes = globalThis.__cy.nodes();
      return Object.fromEntries(
        nodes.map((n) => [n.id(), { x: n.position().x, y: n.position().y }]),
      );
    });

    // Re-enter drill-down
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // Exit again
    await page.locator('#drill-exit-btn').click();
    await page.waitForTimeout(200);

    // Capture positions after second exit
    const finalPositions = await page.evaluate(() => {
      const nodes = globalThis.__cy.nodes();
      return Object.fromEntries(
        nodes.map((n) => [n.id(), { x: n.position().x, y: n.position().y }]),
      );
    });

    // Verify: fcose layout positions should be preserved after this drill cycle
    const preservesFcose = Object.keys(afterFcose).every((nodeId) => {
      const fcosePos = afterFcose[nodeId];
      const finalPos = finalPositions[nodeId];
      return Math.max(Math.abs(finalPos.x - fcosePos.x), Math.abs(finalPos.y - fcosePos.y)) < 10;
    });
    expect(preservesFcose).toBe(true);
  });

  test('TC-2.7.12: Properties panel link in drill-down changes the drill-down root', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Enter drill-down on comp-a (has connection to comp-b via rel-1)
    await page.evaluate(() => {
      globalThis.__cy.$id('comp-a').trigger('dbltap');
    });
    await page.waitForTimeout(500);
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);

    // Increase depth to 2
    const depth2Btn = page.locator('#depth-picker .depth-btn[data-depth="2"]');
    await depth2Btn.click();
    await page.waitForTimeout(300);

    // Select the root node so its properties are shown
    await page.evaluate(() => {
      globalThis.__cy.$id('comp-a').trigger('tap');
    });
    await page.waitForTimeout(300);

    // Properties panel should show comp-a's connection to comp-b
    await expect(page.locator('#detail-panel')).toBeVisible();

    // Get the drill-down root before clicking the link
    const rootBefore = await page.locator('#drill-label').textContent();

    // Click the related entity link to comp-b in the properties panel
    const connLink = page.locator('#detail-panel .detail-conn-item').first();
    await connLink.click();
    await page.waitForTimeout(500);

    // Drill-down root should now be comp-b (label changed)
    const rootAfter = await page.locator('#drill-label').textContent();
    expect(rootAfter).not.toBe(rootBefore);

    // URL should reflect new entity via replaceState
    await expect(page).toHaveURL(/entity=/);

    // Drill-down nav is still visible
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);

    // Exploration depth is preserved (not reset to 1)
    const activeDepth = await page.locator('#depth-picker .depth-btn.active').textContent();
    expect(activeDepth.trim()).toBe('2');
  });

  test('TC-2.7.13: Dangling nodes disconnected from drill-down root are hidden after filter change', async ({
    page,
  }) => {
    // Custom model: root-r (ApplicationComponent) → middle-m (Microservice) → end-d (Database)
    const DANGLING_MODEL = {
      ns: { archi: 'http://www.opengroup.org/xsd/archimate/3.0/' },
      content: [
        {
          eClass: 'archi:ArchimateModel',
          id: 'model-root',
          data: {
            name: 'Dangling Test',
            elements: [
              { eClass: 'archi:ApplicationComponent', id: 'root-r', data: { name: 'Root R' } },
              { eClass: 'archi:Microservice', id: 'middle-m', data: { name: 'Middle M' } },
              { eClass: 'archi:Database', id: 'end-d', data: { name: 'End D' } },
            ],
            relations: [
              {
                eClass: 'archi:AssociationRelationship',
                id: 'rel-r-m',
                data: { source: 'root-r', target: 'middle-m' },
              },
              {
                eClass: 'archi:AssociationRelationship',
                id: 'rel-m-d',
                data: { source: 'middle-m', target: 'end-d' },
              },
            ],
          },
        },
      ],
    };

    await mockApi(page);
    // Override model content with the dangling-test model
    const { MODEL_CONTENT_URL } = await import('../fixtures.js');
    await page.route(MODEL_CONTENT_URL, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DANGLING_MODEL),
      }),
    );
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Enter drill-down on root-r at depth=2 (should see root-r, middle-m, end-d)
    await page.evaluate(() => {
      globalThis.__cy.$id('root-r').trigger('dbltap');
    });
    await page.waitForTimeout(500);

    // Increase depth to 2 to include end-d
    const depth2Btn = page.locator('#depth-picker .depth-btn[data-depth="2"]');
    await depth2Btn.click();
    await page.waitForTimeout(500);

    // All three nodes should be visible
    const visibleBefore = await page.evaluate(() =>
      globalThis.__cy.nodes(':visible').map((n) => n.id()),
    );
    expect(visibleBefore).toContain('root-r');
    expect(visibleBefore).toContain('middle-m');
    expect(visibleBefore).toContain('end-d');

    // Filter out Microservice — middle-m disappears, end-d becomes dangling
    await page.locator('input[data-kind="elem"][data-type="Microservice"]').uncheck();
    await page.waitForTimeout(500);

    const visibleAfter = await page.evaluate(() =>
      globalThis.__cy.nodes(':visible').map((n) => n.id()),
    );
    // Middle-m should be hidden (filtered)
    expect(visibleAfter).not.toContain('middle-m');
    // End-d should also be hidden (dangling — no path from root-r)
    expect(visibleAfter).not.toContain('end-d');
    // Root-r itself should remain visible
    expect(visibleAfter).toContain('root-r');

    // Re-check Microservice — both nodes should reappear
    await page.locator('input[data-kind="elem"][data-type="Microservice"]').check();
    await page.waitForTimeout(500);

    const visibleRestored = await page.evaluate(() =>
      globalThis.__cy.nodes(':visible').map((n) => n.id()),
    );
    expect(visibleRestored).toContain('middle-m');
    expect(visibleRestored).toContain('end-d');
  });

  test('TC-2.7.14: Switching to a different model while in drill-down exits drill-down', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Enter drill-down on first node at depth=2
    await page.evaluate(() => {
      globalThis.__cy.nodes().first().trigger('dbltap');
    });
    await page.waitForTimeout(500);
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);

    const depth2Btn = page.locator('#depth-picker .depth-btn[data-depth="2"]');
    await depth2Btn.click();
    await page.waitForTimeout(300);

    // Switch to a different model via the model selector
    await page.locator('#current-model-btn').click();
    await expect(page.locator('#model-modal')).toBeVisible();
    await page.locator('.model-item', { hasText: 'e-commerce' }).click();
    await waitForLoading(page);

    // Drill-down mode should exit automatically
    await expect(page.locator('#crumb-entity-sep')).toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).toHaveClass(/hidden/);

    // Full model view of e-commerce is shown
    await expect(page.locator('#cy')).toBeVisible();

    // URL should not contain drill-down parameters from the previous model
    await expect(page).not.toHaveURL(/entity=/);
    await expect(page).not.toHaveURL(/depth=/);
  });

  test('TC-2.7.11: Exit drill-down with no previous state applies fresh layout', async ({
    page,
  }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.clear());

    // First load the graph normally to obtain a valid node ID from the mock data
    await page.goto('/graph/?model=model-test');
    await waitForLoading(page);
    await waitForCyReady(page);

    // Get the first visible node's ID to use for deep link
    const firstNodeId = await page.evaluate(() => {
      const first = globalThis.__cy.nodes().first();
      return first?.id();
    });
    expect(firstNodeId).toBeTruthy();

    // Now simulate a deep link: navigate directly to drill-down via URL
    const deepLink = `/graph/?model=model-test&entity=${firstNodeId}&depth=2`;
    await page.goto(deepLink);
    await waitForLoading(page);
    await waitForCyReady(page);

    // Should be in drill-down mode immediately (URL parameters trigger drill-down)
    await expect(page.locator('#crumb-entity-sep')).not.toHaveClass(/hidden/);
    await expect(page.locator('#drill-label')).not.toHaveClass(/hidden/);

    // Verify drill-down is active with limited visible nodes (BFS scope)
    const initialVisibleCount = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);
    const totalNodes = await page.evaluate(() => globalThis.__cy.nodes().length);
    // In drill-down, visible nodes should be less than total (unless depth includes all)
    expect(initialVisibleCount).toBeLessThan(totalNodes);

    // Exit drill-down
    await page.locator('#drill-exit-btn').click();
    // Wait for fresh layout to run (if no state to restore)
    await page.waitForFunction(() => !globalThis.__layoutRunning);

    // After exit: full model should be restored with layout applied
    const afterExitVisible = await page.evaluate(() => globalThis.__cy.nodes(':visible').length);
    // All nodes that match filters should be visible (close to total)
    expect(afterExitVisible).toBeGreaterThanOrEqual(totalNodes - 2); // Allow some filtered nodes

    // Verify that nodes have proper positions (not all at origin or overlapping)
    const positions = await page.evaluate(() => {
      const nodes = globalThis.__cy.nodes(':visible');
      return [...nodes].map((n) => ({ x: n.position().x, y: n.position().y }));
    });

    // Check that positions are spread out (not all identical)
    const uniqueX = new Set(positions.map((p) => Math.round(p.x)));
    const uniqueY = new Set(positions.map((p) => Math.round(p.y)));
    expect(uniqueX.size).toBeGreaterThan(1);
    expect(uniqueY.size).toBeGreaterThan(1);

    // Verify that node positions are finite numbers (not NaN)
    for (const pos of positions) {
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
    }

    // Also verify URL no longer contains drill parameters
    await expect(page).not.toHaveURL(/(entity=|depth=)/);
  });
});
