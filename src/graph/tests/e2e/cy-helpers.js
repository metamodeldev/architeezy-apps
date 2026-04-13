// ── Cytoscape helpers for e2e tests ──────────────────────────────────────────

/**
 * Injects a script that captures the Cytoscape instance into globalThis.__cy. Must be called before
 * page.goto().
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 */
export async function injectCyCapture(page) {
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

/**
 * Waits for the Cytoscape instance to be initialised (globalThis.__cy). Also handles the case where
 * the app exposes the instance as globalThis.cy.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 */
export async function waitForCyReady(page) {
  await page.waitForFunction(
    () => globalThis.__cy !== undefined || (globalThis.cy && globalThis.cy !== undefined),
  );
  await page.evaluate(() => {
    if (globalThis.cy && !globalThis.__cy) {
      globalThis.__cy = globalThis.cy;
    }
  });
}

/**
 * Waits until a Cytoscape element (node or edge) is rendered. For nodes: waits until the rendered
 * position is > (10, 10). For edges: waits until the element exists in the graph.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string} nodeId - Cytoscape element ID.
 */
export async function waitForCyNode(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const el = globalThis.__cy.$id(id);
    if (!el.length) {
      return false;
    }
    if (el.isNode && el.isNode()) {
      const pos = el.renderedPosition();
      return pos && pos.x > 10 && pos.y > 10;
    }
    return true;
  }, nodeId);
}

/**
 * Waits until the specified node is selected.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string} nodeId - Cytoscape node ID.
 */
export async function waitForNodeSelected(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const node = globalThis.__cy.$id(id);
    return node && node.length && node.isNode() && node.selected();
  }, nodeId);
}

/**
 * Waits until the specified node is centered within the viewport (within 100px of center).
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string} nodeId - Cytoscape node ID.
 */
export async function waitForNodeCentered(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const node = globalThis.__cy.$id(id);
    if (!node.length) {
      return false;
    }
    if (!node.selected()) {
      return false;
    }
    const pos = node.renderedPosition();
    if (!pos) {
      return false;
    }
    const nodeCenterX = pos.x + node.outerWidth() / 2;
    const nodeCenterY = pos.y + node.outerHeight() / 2;
    const cyEl = document.getElementById('cy');
    if (!cyEl) {
      return false;
    }
    const rect = cyEl.getBoundingClientRect();
    return Math.hypot(nodeCenterX - rect.width / 2, nodeCenterY - rect.height / 2) < 100;
  }, nodeId);
}

/**
 * Waits until the specified node is fully within the viewport (50px margin).
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string} nodeId - Cytoscape node ID.
 */
export async function waitForNodeInViewport(page, nodeId) {
  await page.waitForFunction((id) => {
    if (!globalThis.__cy) {
      return false;
    }
    const node = globalThis.__cy.$id(id);
    if (!node.length) {
      return false;
    }
    const pos = node.renderedPosition();
    if (!pos) {
      return false;
    }
    const w = node.outerWidth();
    const h = node.outerHeight();
    const cyEl = document.getElementById('cy');
    if (!cyEl) {
      return false;
    }
    const rect = cyEl.getBoundingClientRect();
    return (
      pos.x >= 50 && pos.y >= 50 && pos.x + w <= rect.width - 50 && pos.y + h <= rect.height - 50
    );
  }, nodeId);
}

/**
 * Returns the screen coordinates of a Cytoscape node.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @param {string} nodeId - Cytoscape node ID.
 * @returns {Promise<{ x: number; y: number }>} Screen coordinates.
 */
export function getNodePos(page, nodeId) {
  return page.evaluate((id) => {
    const pos = globalThis.__cy.$id(id).renderedPosition();
    const rect = document.getElementById('cy').getBoundingClientRect();
    return { x: rect.left + pos.x, y: rect.top + pos.y };
  }, nodeId);
}

/**
 * Returns the number of currently visible nodes in the Cytoscape graph.
 *
 * @param {import('@playwright/test').Page} page - Playwright page object.
 * @returns {Promise<number>} Number of visible nodes.
 */
export function countVisibleNodes(page) {
  return page.evaluate(() => globalThis.__cy.nodes(':visible').length);
}
