/**
 * Display management for graph elements.
 *
 * Provides functions for visibility, fading, and snapshot queries.
 *
 * @module graph/display
 * @package
 */

import { getContainmentMode } from './containment.js';
import { getCy } from './cy.js';

function syncCompoundParentIds(visibleIds) {
  const cy = getCy();
  if (!cy || getContainmentMode() !== 'compound') {
    return;
  }
  for (const n of cy.nodes()) {
    const origParent = n.data('modelParent');
    if (!origParent) {
      continue;
    }
    const nodeOk = visibleIds.has(n.id());
    const parentOk = cy.$id(origParent).length > 0 && visibleIds.has(origParent);
    const currentParId = n.parent().length ? n.parent().id() : undefined;
    if (nodeOk && parentOk) {
      if (currentParId !== origParent) {
        n.move({ parent: origParent });
      }
    } else if (currentParId !== undefined) {
      n.move({ parent: undefined });
    }
  }
}

/**
 * Returns a plain-data snapshot of all nodes and edges currently in the graph.
 *
 * @returns {{
 *       nodes: { id: string; type: string; parent: string }[];
 *       edges: {
 *         id: string;
 *         type: string;
 *         source: string;
 *         target: string;
 *         isContainment: boolean;
 *       }[];
 *     }
 *   | undefined}
 *   Snapshot of all graph elements, or undefined if graph not loaded
 */
export function getGraphSnapshot() {
  const cy = getCy();
  if (!cy) {
    return;
  }
  return {
    nodes: cy.nodes().map((n) => ({
      id: n.id(),
      type: n.data('type'),
      parent: n.parent().id(),
    })),
    edges: cy.edges().map((e) => ({
      id: e.id(),
      type: e.data('type'),
      source: e.source().id(),
      target: e.target().id(),
      isContainment: Boolean(e.data('isContainment')),
    })),
  };
}

/**
 * Applies display visibility to all graph elements in a single batched operation.
 *
 * @param {{
 *   visibleNodeIds: Set<string>;
 *   isEdgeVisible: (
 *     sourceId: string,
 *     targetId: string,
 *     type: string,
 *     isContainment: boolean,
 *   ) => boolean;
 *   forceVisibleId?: string;
 * }} params
 *   Configuration object for display state
 */
export function applyDisplayState({ visibleNodeIds, isEdgeVisible, forceVisibleId }) {
  const cy = getCy();
  if (!cy) {
    return;
  }
  syncCompoundParentIds(visibleNodeIds);
  cy.batch(() => {
    for (const n of cy.nodes()) {
      const show = visibleNodeIds.has(n.id()) || n.id() === forceVisibleId;
      n.style('display', show ? 'element' : 'none');
    }
    for (const e of cy.edges()) {
      const show = isEdgeVisible(
        e.source().id(),
        e.target().id(),
        e.data('type'),
        Boolean(e.data('isContainment')),
      );
      e.style('display', show ? 'element' : 'none');
    }
  });
}

/**
 * Returns visible nodes and edges with their .faded class status.
 *
 * @returns {{
 *   nodes: { id: string; type: string; faded: boolean }[];
 *   edges: { id: string; type: string; isContainment: boolean; faded: boolean }[];
 * }}
 *   Visible nodes and edges with their faded class status
 */
export function getVisibleFadedElements() {
  const cy = getCy();
  if (!cy) {
    return { nodes: [], edges: [] };
  }
  return {
    nodes: cy.nodes(':visible').map((n) => ({
      id: n.id(),
      type: n.data('type'),
      faded: n.hasClass('faded'),
    })),
    edges: cy.edges(':visible').map((e) => ({
      id: e.id(),
      type: e.data('type'),
      isContainment: Boolean(e.data('isContainment')),
      faded: e.hasClass('faded'),
    })),
  };
}

/**
 * Applies the .faded CSS class to nodes and edges according to caller-supplied predicates.
 *
 * @param {(nodeId: string) => boolean} shouldFadeNode - Predicate returning true if the node should
 *   be faded
 * @param {(srcId: string, tgtId: string, edgeId: string) => boolean} shouldFadeEdge - Predicate
 *   returning true if the edge should be faded
 */
export function applyFadedClasses(shouldFadeNode, shouldFadeEdge) {
  const cy = getCy();
  if (!cy) {
    return;
  }
  cy.batch(() => {
    for (const n of cy.nodes()) {
      n.toggleClass('faded', shouldFadeNode(n.id()));
    }
    for (const e of cy.edges()) {
      e.toggleClass('faded', shouldFadeEdge(e.source().id(), e.target().id(), e.id()));
    }
  });
}

/** Removes the .faded class from all nodes and edges. */
export function clearFadedClasses() {
  const cy = getCy();
  if (!cy) {
    return;
  }
  cy.nodes().removeClass('faded');
  cy.edges().removeClass('faded');
}

/**
 * Returns a snapshot of currently visible elements.
 *
 * @returns {{
 *   nodes: { id: string; type: string; label: string }[];
 *   edges: { id: string; type: string; label: string }[];
 *   }}
 *   Snapshot of currently visible nodes and edges with basic metadata
 */
export function getVisibleElements() {
  const cy = getCy();
  if (!cy) {
    return { nodes: [], edges: [] };
  }
  const visibleNodes = cy.nodes(':visible').map((n) => ({
    id: n.id(),
    type: n.data('type'),
    label: n.data('label') || n.data('name') || '',
  }));
  const visibleEdges = cy.edges(':visible').map((e) => ({
    id: e.id(),
    type: e.data('type'),
    source: e.source().id(),
    target: e.target().id(),
    label: e.data('label') || '',
  }));
  return { nodes: visibleNodes, edges: visibleEdges };
}
