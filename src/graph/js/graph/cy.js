/**
 * Manages the Cytoscape instance.
 *
 * Provides getter/setter functions.
 *
 * @module graph/cy
 * @package
 */

let cy;
let _layoutApplied = false;

/**
 * Returns the Cytoscape instance, or undefined if not loaded.
 *
 * @returns {import('cytoscape').Core | undefined} The Cytoscape instance or undefined.
 */
export function getCy() {
  return cy;
}

/**
 * Returns whether a graph is currently loaded.
 *
 * @returns {boolean} True if a Cytoscape instance exists.
 */
export function isGraphLoaded() {
  return Boolean(cy);
}

/**
 * Returns whether the initial layout has been applied to the current Cytoscape instance.
 *
 * @returns {boolean} True if layout has been applied since the last graph build.
 */
export function isLayoutApplied() {
  return _layoutApplied;
}

/** Marks the layout as applied for the current Cytoscape instance. */
export function markLayoutApplied() {
  _layoutApplied = true;
}

/**
 * Sets the Cytoscape instance and exposes it as globalThis.__cy for end-to-end tests. Resets the
 * layout-applied flag so the initial layout runs on the next graph show.
 *
 * @param {import('cytoscape').Core | undefined} newCy - The Cytoscape instance or undefined.
 */
export function setCy(newCy) {
  cy = newCy;
  _layoutApplied = false;
  // Expose for e2e tests under a reserved name
  globalThis.__cy = newCy ?? undefined;
}

/** Destroys the current Cytoscape instance and clears references. */
export function destroyCy() {
  if (cy) {
    cy.destroy();
    cy = undefined;
    globalThis.__cy = undefined;
  }
}
