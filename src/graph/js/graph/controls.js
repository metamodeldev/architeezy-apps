/**
 * Layout controls and graph manipulation.
 *
 * @module graph/controls
 * @package
 */

import { getCy } from './cy.js';

const FIT_PADDING = 40;

// Private module state
let layoutRunning = false;
let currentLayoutInst;

const cfgMap = {
  fcose: {
    name: 'fcose',
    quality: 'default',
    randomize: true,
    animate: true,
    animationDuration: 800,
    fit: true,
    padding: 50,
    nodeDimensionsIncludeLabels: true,
    uniformNodeDimensions: false,
    packComponents: true,
    nodeRepulsion: () => 9000,
    idealEdgeLength: () => 90,
    edgeElasticity: () => 0.45,
    gravity: 0.2,
    gravityRange: 3.8,
    numIter: 2500,
    tile: true,
    tilingPaddingVertical: 15,
    tilingPaddingHorizontal: 15,
  },
  dagre: {
    name: 'dagre',
    nodeDimensionsIncludeLabels: true,
    rankDir: 'TB',
    rankSep: 60,
    nodeSep: 40,
    edgeSep: 10,
    ranker: 'longest-path',
    animate: true,
    animationDuration: 600,
    fit: true,
    padding: 40,
  },
  cose: {
    name: 'cose',
    nodeDimensionsIncludeLabels: true,
    idealEdgeLength: 80,
    nodeOverlap: 20,
    fit: true,
    padding: 40,
    randomize: true,
    componentSpacing: 80,
    nodeRepulsion: () => 700_000,
    edgeElasticity: () => 100,
    gravity: 80,
    numIter: 1000,
    animate: true,
    animationDuration: 600,
  },
  breadthfirst: {
    name: 'breadthfirst',
    directed: true,
    padding: 40,
    spacingFactor: 1.6,
    fit: true,
    animate: true,
    animationDuration: 600,
    nodeDimensionsIncludeLabels: true,
  },
  grid: {
    name: 'grid',
    padding: 30,
    fit: true,
    animate: true,
    animationDuration: 400,
    nodeDimensionsIncludeLabels: true,
  },
  circle: {
    name: 'circle',
    padding: 40,
    fit: true,
    animate: true,
    animationDuration: 400,
    nodeDimensionsIncludeLabels: true,
  },
};

export function isLayoutRunning() {
  return layoutRunning;
}

export function applyLayout(options = {}) {
  const cy = getCy();
  if (!cy) {
    return;
  }
  if (layoutRunning) {
    stopLayout();
  }
  const layoutSelect = document.getElementById('layout-select');
  if (!layoutSelect) {
    console.warn('applyLayout: layout-select element not found, skipping');
    return;
  }
  const name = layoutSelect.value || 'grid'; // Default to grid if no value
  const eles = cy.elements(':visible');

  let cfg = cfgMap[name] ?? { name, fit: true, padding: 30 };
  let savedViewport;
  if (options.preserveViewport) {
    cfg = { ...cfg, fit: false };
    const zoom = cy.zoom();
    const pan = cy.pan();
    savedViewport = { zoom, pan };
  }
  layoutRunning = true;
  globalThis.__layoutRunning = true;

  currentLayoutInst = eles.layout(cfg);
  const layoutInst = currentLayoutInst;
  layoutInst.on('layoutstop', () => {
    layoutRunning = false;
    globalThis.__layoutRunning = false;
    document.dispatchEvent(new CustomEvent('graph:layoutApplied'));
    if (savedViewport) {
      cy.pan(savedViewport.pan);
      cy.zoom(savedViewport.zoom);
    }
    for (const n of cy.nodes(':parent:visible')) {
      n.style('text-max-width', `${Math.max(n.width() - 24, 40)}px`);
    }
  });
  layoutInst.run();
}

export function stopLayout() {
  if (layoutRunning && getCy()) {
    getCy().stop(false, true);
  }
}

export function fitGraph() {
  getCy()?.fit(undefined, FIT_PADDING);
}

export function zoomIn() {
  const cy = getCy();
  if (!cy) {
    return;
  }
  cy.zoom(cy.zoom() * 1.3);
  cy.center();
}

export function zoomOut() {
  const cy = getCy();
  if (!cy) {
    return;
  }
  cy.zoom(cy.zoom() * 0.77);
  cy.center();
}

export function resizeCy() {
  setTimeout(() => getCy()?.resize(), 0);
}

export function updateStats(allElements, allRelations) {
  const cy = getCy();
  if (!cy) {
    return;
  }
  const vis = cy.elements(':visible');
  const visN = vis.nodes().length;
  const visE = vis.edges().filter((e) => !e.data('isContainment')).length;
  const totN = allElements.length;
  const totE = allRelations.length;

  const badgeElem = document.getElementById('badge-elem');
  const badgeRel = document.getElementById('badge-rel');
  if (badgeElem) {
    badgeElem.textContent = visN === totN ? totN : `${visN} / ${totN}`;
  }
  if (badgeRel) {
    badgeRel.textContent = visE === totE ? totE : `${visE} / ${totE}`;
  }
}

/**
 * Pans the graph by the given offset.
 *
 * @param {number} dx - Horizontal pan amount in pixels.
 * @param {number} dy - Vertical pan amount in pixels.
 */
export function panBy(dx, dy) {
  const cy = getCy();
  if (cy) {
    cy.panBy({ x: dx, y: dy });
  }
}

// ── DOM EVENT WIRING ─────────────────────────────────────────────────────────

/** Wires zoom, fit, layout select, and refresh layout buttons. */
export function wireGraphControlEvents() {
  document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);
  document.getElementById('fit-cy-btn').addEventListener('click', fitGraph);
  const layoutSelect = document.getElementById('layout-select');
  if (layoutSelect) {
    layoutSelect.addEventListener('change', (e) => {
      applyLayout();
      localStorage.setItem('architeezyGraphLayout', e.target.value);
    });
  }
  document
    .getElementById('refresh-layout-btn')
    ?.addEventListener('click', () => applyLayout({ preserveViewport: true }));
}

/** Wires keyboard navigation for the graph canvas (arrows to pan, +/- to zoom). */
export function wireKeyboardEvents() {
  document.addEventListener('keydown', (e) => {
    if (document.activeElement?.id !== 'cy') {
      return;
    }
    const panAmount = 50;

    switch (e.key) {
      case 'ArrowUp':
        panBy(0, -panAmount);
        e.preventDefault();
        break;
      case 'ArrowDown':
        panBy(0, panAmount);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        panBy(-panAmount, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
        panBy(panAmount, 0);
        e.preventDefault();
        break;
      case '+':
      case '=':
        zoomIn();
        e.preventDefault();
        break;
      case '-':
        zoomOut();
        e.preventDefault();
        break;
    }
  });
}
