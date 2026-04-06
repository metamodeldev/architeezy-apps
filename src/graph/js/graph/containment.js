/**
 * Manages graph containment mode setting.
 *
 * Determines how node grouping is displayed.
 *
 * @module graph/containment
 * @package
 */

import { buildCytoscape } from './core.js';
import { getAllElements, getAllRelations } from '../model/index.js';
import { elemColor, relColor } from '../palette.js';

let containmentMode = (() => {
  try {
    return typeof localStorage !== 'undefined'
      ? (localStorage.getItem('architeezyGraphContainment') ?? 'edge')
      : 'edge';
  } catch {
    return 'edge';
  }
})();

/**
 * Returns the current containment display mode.
 *
 * @returns {'edge' | 'compound'} The current containment mode.
 */
export function getContainmentMode() {
  return containmentMode;
}

/**
 * Sets the containment mode and persists it to localStorage.
 *
 * @param {'edge' | 'compound'} mode - The containment mode to set.
 */
export function setContainmentMode(mode) {
  containmentMode = mode;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('architeezyGraphContainment', mode);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Wires the containment mode dropdown change event.
 *
 * @param {Function} onContainmentChange - Handler that receives the new mode.
 */
export function wireContainmentEvents(onContainmentChange) {
  document
    .getElementById('containment-select')
    .addEventListener('change', (e) => onContainmentChange(e.target.value));
}

/**
 * Handler for graph:containmentChanged event.
 * Rebuilds cytoscape with new containment mode.
 */
function onContainmentChanged() {
  const elements = getAllElements();
  if (!elements.length) {
    return;
  }

  buildCytoscape({
    elements,
    relations: getAllRelations(),
    elemColorFn: elemColor,
    relColorFn: relColor,
    containmentMode: getContainmentMode(),
  });

  document.dispatchEvent(new CustomEvent('graph:containmentApplied'));
}

/**
 * Initializes the containment module by registering global event listeners.
 */
export function initContainment() {
  document.addEventListener('graph:containmentChanged', onContainmentChanged);
}
