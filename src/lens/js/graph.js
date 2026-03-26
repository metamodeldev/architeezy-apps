// ── CYTOSCAPE LIFECYCLE ─────────────────────────────────────────────────────

import { FIT_PADDING, LAYOUT_ANIM_THRESHOLD, TAP_DELAY_MS } from './constants.js';
import { buildCyStyles, createLabelMeasurer } from './graph-styles.js';
import { t } from './i18n.js';
import { state } from './state.js';
import { elemColor, relColor } from './utils.js';

// Re-export cyBg so callers (ui.js, etc.) don't need to know about graph-styles.js
export { cyBg } from './graph-styles.js';

// Tracks the AbortController for the current pointer interaction listeners so
// That stale listeners are removed before a new set is attached on each rebuild.
let _pointerController;

// ── NODE & EDGE DATA BUILDERS ───────────────────────────────────────────────

/**
 * Builds the Cytoscape node data array for all elements in `state.allElements`. Uses a temporary
 * label measurer to compute node dimensions; the measurer is always destroyed in the `finally`
 * block to avoid DOM leaks.
 *
 * @param {Set<string>} elemIds - Set of all element IDs (used to resolve compound parents).
 * @returns {Array} Cytoscape node descriptors.
 */
function buildNodes(elemIds) {
  const measurer = createLabelMeasurer();
  try {
    return state.allElements.map((e) => {
      const { nw, nh } = measurer.labelSize(e.name || e.type);
      const data = {
        id: e.id,
        label: e.name,
        type: e.type,
        ns: e.ns,
        color: elemColor(e.type),
        nw,
        nh,
      };
      if (state.containmentMode === 'compound' && e.parent && elemIds.has(e.parent)) {
        data.parent = e.parent;
        // ModelParent preserves the original parent so it can be restored after
        // The node is detached from a compound container for visibility reasons.
        data.modelParent = e.parent;
      }
      return { group: 'nodes', data };
    });
  } finally {
    // Always remove the measurement span, even if an error occurs mid-build.
    measurer.destroy();
  }
}

/**
 * Builds the Cytoscape edge data array for all relations whose both endpoints exist in `elemIds`.
 * In "edge" containment mode, also adds synthetic containment edges (filled diamond) for
 * parent–child relationships.
 *
 * @param {Set<string>} elemIds - Set of element IDs used to filter dangling edges.
 * @returns {Array} Cytoscape edge descriptors.
 */
function buildEdges(elemIds) {
  const edges = state.allRelations
    .filter((r) => elemIds.has(r.source) && elemIds.has(r.target))
    .map((r) => ({
      group: 'edges',
      data: {
        id: r.id,
        source: r.source,
        target: r.target,
        type: r.type,
        label: r.name,
        color: relColor(r.type),
      },
    }));

  // Edge mode: add synthetic containment edges (parent → child) with a filled diamond.
  // Compound mode uses Cytoscape's native parent/child relationship instead.
  if (state.containmentMode === 'edge') {
    for (const e of state.allElements) {
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

// ── EVENT BINDING ───────────────────────────────────────────────────────────

/**
 * Attaches Cytoscape event handlers for tap, double-tap, canvas tap, and unselect. Single-tap is
 * debounced by `TAP_DELAY_MS` to let double-tap cancel it first.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {function(string): void} onNodeTap - Called with the node ID on single tap.
 * @param {function(cytoscape.NodeSingular): void} onNodeDblTap - Called with the node on double
 *   tap.
 * @param {function(): void} onCanvasTap - Called when the canvas background is tapped.
 */
function bindCyEvents(cy, onNodeTap, onNodeDblTap, onCanvasTap) {
  // Single-tap is delayed to let double-tap cancel it first.
  cy.on('tap', 'node', (e) => {
    clearTimeout(state.tapTimer);
    state.tapTimer = setTimeout(() => onNodeTap(e.target.id()), TAP_DELAY_MS);
  });
  cy.on('dbltap', 'node', (e) => {
    clearTimeout(state.tapTimer);
    onNodeDblTap(e.target);
  });
  cy.on('tap', (e) => {
    if (e.target === cy) {
      onCanvasTap();
    }
  });

  // Cytoscape re-evaluates all styles after a node is deselected, which can
  // Silently drop dynamically added classes (like .drill-root). Re-assert it.
  cy.on('unselect', () => {
    if (state.drillNodeId) {
      cy.$id(state.drillNodeId).addClass('drill-root');
    }
  });
}

// ── POINTER INTERACTIONS ────────────────────────────────────────────────────

/**
 * Attaches native DOM event listeners to the Cytoscape container for: - Middle-mouse button panning
 * - Wheel zoom (cursor-centred, 1.3× per notch)
 *
 * These are handled outside Cytoscape's event system to avoid the `wheelSensitivity` deprecation
 * warning and to gain precise zoom control.
 */
function setupPointerInteractions() {
  // Abort any listeners from a previous buildCytoscape call so they don't stack.
  if (_pointerController) {
    _pointerController.abort();
  }
  _pointerController = new AbortController();
  const { signal } = _pointerController;

  const container = document.getElementById('cy');

  // Middle-mouse pan
  container.addEventListener(
    'mousedown',
    (e) => {
      if (e.button !== 1) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const panStart = { ...state.cy.pan() };
      const mouseStart = { x: e.clientX, y: e.clientY };
      function onMove(mv) {
        return state.cy.pan({
          x: panStart.x + mv.clientX - mouseStart.x,
          y: panStart.y + mv.clientY - mouseStart.y,
        });
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    { passive: false, signal },
  );
  container.addEventListener('auxclick', (e) => e.preventDefault(), { signal });

  // Custom wheel zoom — captured before Cytoscape to avoid the "wheelSensitivity" warning
  // While keeping precise control over the zoom factor (1.3× per notch, cursor-centred).
  container.addEventListener(
    'wheel',
    (e) => {
      if (!state.cy) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
      const level = Math.max(
        state.cy.minZoom(),
        Math.min(state.cy.maxZoom(), state.cy.zoom() * factor),
      );
      state.cy.zoom({
        level,
        renderedPosition: { x: e.offsetX, y: e.offsetY },
      });
    },
    { passive: false, capture: true, signal },
  );
}

// ── PUBLIC API ──────────────────────────────────────────────────────────────

/**
 * Destroys any existing Cytoscape instance and creates a new one from current state. Binds
 * node/edge/canvas tap handlers and sets up pointer interactions.
 *
 * @param {{
 *   onNodeTap: function(string): void,
 *   onNodeDblTap: function(cytoscape.NodeSingular): void,
 *   onCanvasTap: function(): void
 * }} handlers
 *   - Tap event callbacks.
 */
export function buildCytoscape({ onNodeTap, onNodeDblTap, onCanvasTap }) {
  if (state.cy) {
    state.cy.destroy();
    state.cy = undefined;
  }

  const elemIds = new Set(state.allElements.map((e) => e.id));

  // oxlint-disable-next-line no-undef
  state.cy = cytoscape({
    container: document.getElementById('cy'),
    elements: { nodes: buildNodes(elemIds), edges: buildEdges(elemIds) },
    style: buildCyStyles(),
    layout: { name: 'grid' },
    userZoomingEnabled: true,
    minZoom: 0.04,
    maxZoom: 6,
  });

  bindCyEvents(state.cy, onNodeTap, onNodeDblTap, onCanvasTap);
  setupPointerInteractions();
  updateStats();
}

/**
 * Runs the layout selected in `#layout-select` on all currently visible elements. Animates only
 * when the visible node count is below `LAYOUT_ANIM_THRESHOLD`. After layout, updates compound node
 * label widths to match their rendered size.
 */
export function applyLayout() {
  if (!state.cy) {
    return;
  }
  const name = document.getElementById('layout-select').value;
  // Run layout only on visible elements — on large models hidden nodes would
  // Dominate computation and produce wrong positions for the visible subset.
  const eles = state.cy.elements(':visible');
  // Animate only for smaller graphs; animation is distracting on large ones.
  const anim = eles.nodes().length < LAYOUT_ANIM_THRESHOLD;

  const cfgMap = {
    fcose: {
      name: 'fcose',
      quality: 'default',
      randomize: true,
      animate: anim,
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
      animate: anim,
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
      animate: anim,
      animationDuration: 600,
    },
    breadthfirst: {
      name: 'breadthfirst',
      directed: true,
      padding: 40,
      spacingFactor: 1.6,
      fit: true,
      animate: anim,
      animationDuration: 600,
      nodeDimensionsIncludeLabels: true,
    },
    grid: {
      name: 'grid',
      padding: 30,
      fit: true,
      animate: anim,
      animationDuration: 400,
      nodeDimensionsIncludeLabels: true,
    },
    circle: {
      name: 'circle',
      padding: 40,
      fit: true,
      animate: anim,
      animationDuration: 400,
      nodeDimensionsIncludeLabels: true,
    },
  };

  const layoutInst = eles.layout(cfgMap[name] ?? { name, fit: true, padding: 30 });
  layoutInst.on('layoutstop', () => {
    // After layout, set text-max-width on compound nodes to match their actual rendered width
    // So long labels wrap correctly rather than overflowing the container box.
    for (const n of state.cy.nodes(':parent:visible')) {
      n.style('text-max-width', `${Math.max(n.width() - 24, 40)}px`);
    }
  });
  layoutInst.run();
}

/** Fits the graph to the viewport with the standard padding. */
export function fitGraph() {
  state.cy?.fit(undefined, FIT_PADDING);
}

/**
 * Updates the stats bar (#stat-nodes, #stat-edges, #stat-visible) based on the current visible
 * element and relationship counts. In drill mode, shows visible/total for both nodes and edges.
 */
export function updateStats() {
  if (!state.cy) {
    return;
  }
  const vis = state.cy.elements(':visible');
  const visN = vis.nodes().length;
  const visE = vis.edges().filter((e) => !e.data('isContainment')).length;
  const totN = state.allElements.length;
  const totE = state.allRelations.length;

  if (state.drillNodeId) {
    // Drill mode: show visible/total for both counts
    document.getElementById('stat-nodes').textContent = t('statNodes', `${visN} / ${totN}`);
    document.getElementById('stat-edges').textContent = t('statEdges', `${visE} / ${totE}`);
    document.getElementById('stat-visible').textContent = '';
  } else {
    document.getElementById('stat-nodes').textContent = t('statNodes', totN);
    document.getElementById('stat-edges').textContent = t('statEdges', totE);
    document.getElementById('stat-visible').textContent = t('statVisible', visN, visE);
  }
}
