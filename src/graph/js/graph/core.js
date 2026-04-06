/**
 * Core graph initialization and lifecycle.
 *
 * @module graph/core
 * @package
 */

import { createLabelMeasurer, buildCyStyles } from './styles.js';
import { applyLayout, updateStats } from './controls.js';
import { destroyCy, setCy, getCy } from './cy.js';
import { bindCyEvents, setupPointerInteractions } from './events.js';
import { clearSavedLayoutState } from './layout.js';
import { bindTooltipEvents } from './tooltip.js';
import { getAllElements, getAllRelations } from '../model/index.js';
import { elemColor, relColor } from '../palette.js';

// ── BUILDERS (moved from builders.js) ────────────────────────────────────────────

function buildNodes(elements, elemIds, elemColorFn, containmentMode) {
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

function buildEdges(elements, relations, elemIds, relColorFn, containmentMode) {
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

// ── CYTOSCAPE BUILD ─────────────────────────────────────────────────────────────

export function buildCytoscape({
  elements,
  relations,
  onNodeTap,
  onNodeDblTap,
  onCanvasTap,
  elemColorFn,
  relColorFn,
  containmentMode,
}) {
  if (getCy()) {
    destroyCy();
  }
  clearSavedLayoutState();

  document.getElementById('cy').classList.remove('hidden');

  const elemIds = new Set(elements.map((e) => e.id));

  // oxlint-disable-next-line no-undef
  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: {
      nodes: buildNodes(elements, elemIds, elemColorFn, containmentMode),
      edges: buildEdges(elements, relations, elemIds, relColorFn, containmentMode),
    },
    style: buildCyStyles(),
    // Layout will be applied manually after initialization
    userZoomingEnabled: true,
    minZoom: 0.04,
    maxZoom: 6,
    autoResize: false,
  });

  setCy(cy);
  bindCyEvents(cy, onNodeTap, onNodeDblTap, onCanvasTap);
  setupPointerInteractions();
  bindTooltipEvents(cy);
  updateStats(elements, relations);
  document.dispatchEvent(new CustomEvent('graph:built'));
}

// ── REBUILD ON MODEL LOAD ───────────────────────────────────────────────────────

export function rebuildGraph(containmentMode) {
  const elements = getAllElements();
  const relations = getAllRelations();

  if (elements.length === 0) {
    return;
  }

  buildCytoscape({
    elements,
    relations,
    elemColorFn: elemColor,
    relColorFn: relColor,
    containmentMode,
  });

  applyLayout();
}
