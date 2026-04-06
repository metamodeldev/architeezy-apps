/**
 * Layout module - combines state persistence and controller.
 *
 * @module graph/layout
 * @package
 */

import { getCy } from './cy.js';
import { applyLayout } from './controls.js';

let savedLayoutState;

/** Saves the current node positions and viewport state. Call before entering drill-down. */
export function saveLayoutState() {
  const cy = getCy();
  if (!cy) {
    savedLayoutState = undefined;
    return;
  }
  const positions = {};
  for (const n of cy.nodes()) {
    positions[n.id()] = { x: n.position('x'), y: n.position('y') };
  }
  savedLayoutState = {
    positions,
    viewport: {
      zoom: cy.zoom(),
      pan: { ...cy.pan() },
    },
  };
}

/**
 * Restores a previously saved layout state.
 *
 * @returns {boolean} True if state was restored, false otherwise.
 */
export function restoreLayoutState() {
  const cy = getCy();
  if (!cy || !savedLayoutState) {
    return false;
  }
  const { positions, viewport } = savedLayoutState;
  cy.batch(() => {
    for (const n of cy.nodes()) {
      if (positions[n.id()]) {
        n.position(positions[n.id()]);
      }
    }
  });
  cy.pan(viewport.pan);
  cy.zoom(viewport.zoom);
  savedLayoutState = undefined;
  return true;
}

/** Clears any saved layout state. */
export function clearSavedLayoutState() {
  savedLayoutState = undefined;
}

/**
 * Handler for layout:request event.
 *
 * @param {CustomEvent} e - Event with optional { preserveViewport: boolean }.
 */
function onLayoutRequest(e) {
  const { preserveViewport = false } = e.detail || {};
  applyLayout({ preserveViewport });
}

/**
 * Handler for layout:saveStateRequest event.
 */
function onSaveLayoutStateRequest() {
  saveLayoutState();
}

/**
 * Initializes the layout controller by registering global event listeners.
 */
export function initLayout() {
  document.addEventListener('layout:request', onLayoutRequest);
  document.addEventListener('layout:saveStateRequest', onSaveLayoutStateRequest);
}
