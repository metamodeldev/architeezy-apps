/**
 * Node selection and focus operations.
 *
 * @module graph/selection
 * @package
 */

import { getCy } from './cy.js';

const FOCUS_ZOOM = 1.5;

/**
 * Returns true if the graph contains a node with the given ID.
 *
 * @param {string} id - The node ID to check.
 * @returns {boolean} True if the node exists in the graph.
 */
export function hasGraphNode(id) {
  const cy = getCy();
  return Boolean(cy?.$id(id).length);
}

/**
 * Resizes the Cytoscape canvas, animates the camera to the node with `id`, and selects it.
 *
 * @param {string} id - The node ID to focus on.
 * @returns {boolean} True if node was found and focused.
 */
export function focusCyNode(id) {
  const cy = getCy();
  if (!cy) {
    return false;
  }
  const cyEl = document.getElementById('cy');
  if (cyEl) {
    const _ = cyEl.offsetHeight;
  }
  cy.resize();
  const node = cy.$id(id);
  if (!node?.length) {
    return false;
  }
  cy.animate({ center: { eles: node }, zoom: FOCUS_ZOOM }, { duration: 400 });
  node.select();
  return true;
}

/**
 * Adds the `.drill-root` class to the node with the given ID.
 *
 * @param {string} nodeId - The node ID to mark as drill root.
 */
export function addDrillRootClass(nodeId) {
  const cy = getCy();
  cy?.$id(nodeId).addClass('drill-root');
}

/**
 * Clears `.drill-root` from all nodes, then marks `nodeId` as the new drill root.
 *
 * @param {string} nodeId - The node ID to set as the new drill root.
 */
export function setDrillRootNode(nodeId) {
  const cy = getCy();
  if (cy) {
    cy.nodes().removeClass('drill-root');
    cy.$id(nodeId).addClass('drill-root');
  }
}

/** Removes the `.drill-root` class from all nodes. */
export function clearDrillRootNodes() {
  const cy = getCy();
  cy?.nodes().removeClass('drill-root');
}

/**
 * Returns the ID of the currently selected node, or undefined if none.
 *
 * @returns {string | undefined} The selected node ID.
 */
export function getSelectedNodeId() {
  const cy = getCy();
  if (!cy) {
    return;
  }
  const selected = cy.$(':selected').filter('node').first();
  return selected.id() || undefined;
}
