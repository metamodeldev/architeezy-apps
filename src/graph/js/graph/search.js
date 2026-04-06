/**
 * Reactive search integration for graph view.
 *
 * Applies search dimming to graph nodes and edges based on the global search query. Automatically
 * updates when query or display state changes.
 *
 * @module graph/search
 * @package
 */

import { query, setNoResultsHintVisible } from '../search/index.js';
import { effect } from '../signals/index.js';
import { getCy } from './cy.js';
import { displayState } from './service.js';

/** Initializes search integration for the graph. Sets up reactive effect to apply search dimming. */
export function initSearchIntegration() {
  effect(() => {
    const { visibleIds } = displayState.value;
    const q = query.value.toLowerCase();
    const cy = getCy();

    if (!cy) {
      return;
    }

    // Remove existing dimming
    cy.nodes().removeClass('search-dimmed');
    cy.edges().removeClass('search-dimmed');

    if (!q) {
      return;
    }

    // Dim nodes that are visible but don't match the query
    let hasMatches = false;
    for (const node of cy.nodes()) {
      if (!visibleIds.has(node.id())) {
        continue;
      }
      const name = (node.data('label') ?? '').toLowerCase();
      if (name.includes(q)) {
        hasMatches = true;
      } else {
        node.addClass('search-dimmed');
      }
    }

    // Dim edges where both endpoints are search-dimmed
    for (const edge of cy.edges()) {
      const sourceDimmed = edge.source().hasClass('search-dimmed');
      const targetDimmed = edge.target().hasClass('search-dimmed');
      if (sourceDimmed && targetDimmed) {
        edge.addClass('search-dimmed');
      }
    }

    setNoResultsHintVisible(hasMatches);
  });
}
