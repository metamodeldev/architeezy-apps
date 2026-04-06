/**
 * Cytoscape graph builder — pure factory functions. No signals, no side effects — only
 * construction.
 *
 * @module graph/builder
 * @package
 */

import { createLabelMeasurer, buildCyStyles } from './styles.js';

/**
 * Builds Cytoscape node elements from model elements. Pure function - no side effects.
 *
 * @param {Object[]} elements - Model element objects.
 * @param {Set<string>} elemIds - Set of all element IDs (for quick lookup).
 * @param {Function} elemColorFn - Function mapping element type to color.
 * @param {string} containmentMode - 'edge' or 'compound'.
 * @returns {Object[]} Array of Cytoscape node group objects.
 */
export function buildNodes(elements, elemIds, elemColorFn, containmentMode) {
  const measurer = createLabelMeasurer();
  try {
    return elements.map((e) => {
      const { nw, nh } = measurer.labelSize(e.name || e.type);
      const data = {
        id: e.id,
        label: e.name,
        type: e.type,
        ns: e.ns,
        doc: e.doc,
        color: elemColorFn(e.type),
        nw,
        nh,
      };
      if (containmentMode === 'compound' && e.parent && elemIds.has(e.parent)) {
        data.parent = e.parent;
        data.modelParent = e.parent;
      }
      return { group: 'nodes', data };
    });
  } finally {
    measurer.destroy();
  }
}

/**
 * Builds Cytoscape edge elements from model relations. Pure function - no side effects.
 *
 * @param {Object[]} elements - Model elements (for containment edges).
 * @param {Object[]} relations - Model relation objects.
 * @param {Set<string>} elemIds - Set of element IDs (for filtering).
 * @param {Function} relColorFn - Function mapping relation type to color.
 * @param {string} containmentMode - 'edge' or 'compound'.
 * @returns {Object[]} Array of Cytoscape edge group objects.
 */
export function buildEdges(elements, relations, elemIds, relColorFn, containmentMode) {
  const edges = relations
    .filter((r) => elemIds.has(r.source) && elemIds.has(r.target))
    .map((r) => ({
      group: 'edges',
      data: {
        id: r.id,
        source: r.source,
        target: r.target,
        type: r.type,
        label: r.name,
        color: relColorFn(r.type),
      },
    }));

  if (containmentMode === 'edge') {
    for (const e of elements) {
      if (e.parent && elemIds.has(e.parent)) {
        edges.push({
          group: 'edges',
          data: {
            id: `_c_${e.id}`,
            source: e.parent,
            target: e.id,
            type: '_containment',
            label: '',
            color: '#9ca3af',
            isContainment: true,
          },
        });
      }
    }
  }

  return edges;
}

/**
 * Creates and returns a new Cytoscape instance. Pure factory. Does NOT call setCy() — that is the
 * caller's responsibility.
 *
 * @param {{
 *   container: HTMLElement;
 *   elements: Object[];
 *   relations: Object[];
 *   elemColorFn: Function;
 *   relColorFn: Function;
 *   containmentMode: string;
 * }} params
 *   - Configuration object for Cytoscape setup.
 * @returns {object} Cytoscape instance
 */
export function createCytoscapeInstance({
  container,
  elements,
  relations,
  elemColorFn,
  relColorFn,
  containmentMode,
}) {
  const elemIds = new Set(elements.map((e) => e.id));
  return globalThis.cytoscape({
    container,
    elements: {
      nodes: buildNodes(elements, elemIds, elemColorFn, containmentMode),
      edges: buildEdges(elements, relations, elemIds, relColorFn, containmentMode),
    },
    style: buildCyStyles(),
    userZoomingEnabled: true,
    minZoom: 0.04,
    maxZoom: 6,
    autoResize: false,
  });
}
