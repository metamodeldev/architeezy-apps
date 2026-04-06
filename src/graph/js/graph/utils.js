/**
 * Helper functions for graph operations.
 *
 * @module graph/utils
 * @package
 */

import { getCy } from './cy.js';

/**
 * Returns the viewport dimensions (container width and height in pixels).
 *
 * @returns {{ width: number; height: number }} The viewport width and height in pixels.
 */
export function getViewportBounds() {
  const cy = getCy();
  if (!cy) {
    return { width: 0, height: 0 };
  }
  const rect = cy.container().getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

/**
 * Refreshes the Cytoscape edge label background colour to match the current canvas background.
 * Called after a theme change so the label knockout matches the new theme.
 *
 * @param {function(): string} getBg - Returns the current canvas background colour.
 */
export function refreshEdgeLabelBg(getBg) {
  const cy = getCy();
  if (!cy) {
    return;
  }
  requestAnimationFrame(() =>
    cy.style().selector('edge').style('text-background-color', getBg()).update(),
  );
}
