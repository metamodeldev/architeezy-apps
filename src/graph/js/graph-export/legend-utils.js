/**
 * Graph export legend utilities.
 *
 * @module graph-export/legend-utils
 * @package
 */

/**
 * Returns the top-left position of the #graph-legend DOM element converted to Cytoscape graph
 * coordinates. Returns undefined when the element cannot be found or the Cytoscape container is
 * unavailable.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @returns {{ x: number; y: number } | undefined} Graph-space position of the legend's top-left
 *   corner.
 */

export function getLegendGraphPosition(cy) {
  const el = document.getElementById('graph-legend');
  if (!el) {
    return;
  }
  const cyContainer = cy.container();
  if (!cyContainer) {
    return;
  }
  const legendRect = el.getBoundingClientRect();
  const cyRect = cyContainer.getBoundingClientRect();
  const canvasX = legendRect.left - cyRect.left;
  const canvasY = legendRect.top - cyRect.top;
  const pan = cy.pan();
  const zoom = cy.zoom();
  return {
    x: (canvasX - pan.x) / zoom,
    y: (canvasY - pan.y) / zoom,
  };
}
