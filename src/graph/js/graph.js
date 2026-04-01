// ── CYTOSCAPE LIFECYCLE ─────────────────────────────────────────────────────

import { buildCyStyles, createLabelMeasurer } from './graph-styles.js';
import { elemColor, relColor } from './palette.js';
import { bindTooltipEvents } from './tooltip.js';

// Delay (ms) before treating a single tap as a click, allowing double-tap detection
const TAP_DELAY_MS = 180;
// Node count below which layout runs with animation; above this, skip animation for speed
const LAYOUT_ANIM_THRESHOLD = 400;
// Padding around the graph when fitting to the viewport (px)
const FIT_PADDING = 40;
// Zoom level applied when focusing a node from the table view
const FOCUS_ZOOM = 1.5;

// Re-export cyBg so callers (ui.js, etc.) don't need to know about graph-styles.js
export { cyBg } from './graph-styles.js';

// Cytoscape instance owned by this module — never exported directly.
// Callers use the specific operation exports below.
let _cy;

// Tracks whether a layout is currently running
let _isLayoutRunning = false;

// Current layout instance — kept so callers can stop it early (e.g., on drill exit)
let _currentLayoutInst;

// Debounce timer for single-tap detection (owned here, not in global state).
let _tapTimer;

// Tracks the AbortController for the current pointer interaction listeners so
// That stale listeners are removed before a new set is attached on each rebuild.
let _pointerController;

// ── LAYOUT STATE PRESERVATION ───────────────────────────────────────────────────

/**
 * @type {{
 *   positions: Record<string, { x: number; y: number }>;
 *   viewport: { zoom: number; pan: { x: number; y: number } };
 * } | null}
 *   Saved layout state before entering drill-down. Contains node positions and viewport.
 */
let _savedLayoutState;

// ── CONTAINMENT MODE ─────────────────────────────────────────────────────────

/** @type {'none' | 'edge' | 'compound'} How parent–child relationships are displayed */
let _containmentMode = globalThis.localStorage?.getItem('architeezyGraphContainment') ?? 'edge';

/**
 * Returns the current containment display mode.
 *
 * @returns {'none' | 'edge' | 'compound'} The current containment mode
 */
export function getContainmentMode() {
  return _containmentMode;
}

/**
 * Stores the containment mode and persists it to localStorage. Does NOT rebuild the graph — caller
 * is responsible for that.
 *
 * @param {'none' | 'edge' | 'compound'} mode Containment display mode to apply
 */
export function setContainmentMode(mode) {
  _containmentMode = mode;
  localStorage.setItem('architeezyGraphContainment', mode);
}

/**
 * Returns whether a layout is currently running.
 *
 * @returns {boolean} True while a layout animation is in progress.
 */
export function isLayoutRunning() {
  return _isLayoutRunning;
}

/** Cancels any pending single-tap debounce timer. */
export function cancelTapTimer() {
  clearTimeout(_tapTimer);
}

// ── NODE & EDGE DATA BUILDERS ───────────────────────────────────────────────

/**
 * Pure: builds the Cytoscape node data array from the provided elements. Uses a temporary label
 * measurer to compute node dimensions; the measurer is always destroyed in the `finally` block to
 * avoid DOM leaks.
 *
 * @param {Array} elements - Model elements (allElements).
 * @param {Set<string>} elemIds - Set of all element IDs (used to resolve compound parents).
 * @returns {Array} Cytoscape node descriptors.
 */
function buildNodes(elements, elemIds) {
  const measurer = createLabelMeasurer();
  try {
    return elements.map((e) => {
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
      if (_containmentMode === 'compound' && e.parent && elemIds.has(e.parent)) {
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
 * Pure: builds the Cytoscape edge data array for all relations whose both endpoints exist in
 * `elemIds`. In "edge" containment mode, also adds synthetic containment edges (filled diamond) for
 * parent–child relationships.
 *
 * @param {Array} elements - Model elements (allElements).
 * @param {Array} relations - Model relations (allRelations).
 * @param {Set<string>} elemIds - Set of element IDs used to filter dangling edges.
 * @returns {Array} Cytoscape edge descriptors.
 */
function buildEdges(elements, relations, elemIds) {
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
        color: relColor(r.type),
      },
    }));

  // Edge mode: add synthetic containment edges (parent → child) with a filled diamond.
  // Compound mode uses Cytoscape's native parent/child relationship instead.
  if (_containmentMode === 'edge') {
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

// ── EVENT BINDING ───────────────────────────────────────────────────────────

/**
 * Attaches Cytoscape event handlers for tap, double-tap, canvas tap, and unselect. Single-tap is
 * debounced by `TAP_DELAY_MS` to let double-tap cancel it first.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {function(string): void} onNodeTap - Called with the node ID on single tap.
 * @param {function(string): void} onNodeDblTap - Called with the node ID on double tap.
 * @param {function(): void} onCanvasTap - Called when the canvas background is tapped.
 * @param {function(): string | undefined} getDrillNodeId - Returns the current drill-root node ID.
 */
function bindCyEvents(cy, onNodeTap, onNodeDblTap, onCanvasTap, getDrillNodeId) {
  // Prevent spurious dbltap when a canvas tap is followed quickly by a node tap.
  // Cytoscape's dbltap detector is position-based and can fire even when tap-1 was on the canvas.
  // _awaitingFirstNodeTap: set true on canvas tap, consumed (→ _prevTapWasCanvas) on next node tap.
  // _prevTapWasCanvas: true when the tap that Cytoscape counts as "tap-1" of the dblclick was
  // Actually a canvas tap — in that case we suppress the resulting dbltap.
  let _awaitingFirstNodeTap = false;
  let _prevTapWasCanvas = false;

  // Single-tap is delayed to let double-tap cancel it first.
  cy.on('tap', 'node', (e) => {
    _prevTapWasCanvas = _awaitingFirstNodeTap;
    _awaitingFirstNodeTap = false;
    clearTimeout(_tapTimer);
    _tapTimer = setTimeout(() => onNodeTap(e.target.id()), TAP_DELAY_MS);
  });
  cy.on('dbltap', 'node', (e) => {
    // Suppress dbltap whose first tap was a canvas tap (not a real double-click on the node).
    if (_prevTapWasCanvas) {
      _prevTapWasCanvas = false;
      return;
    }
    clearTimeout(_tapTimer);
    onNodeDblTap(e.target.id());
  });
  cy.on('tap', (e) => {
    if (e.target === cy) {
      _awaitingFirstNodeTap = true;
      onCanvasTap();
    }
  });

  // Cytoscape re-evaluates all styles after a node is deselected, which can
  // Silently drop dynamically added classes (like .drill-root). Re-assert it.
  cy.on('unselect', () => {
    const drillNodeId = getDrillNodeId();
    if (drillNodeId) {
      cy.$id(drillNodeId).addClass('drill-root');
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
      const panStart = { ..._cy.pan() };
      const mouseStart = { x: e.clientX, y: e.clientY };
      function onMove(mv) {
        return _cy.pan({
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
      if (!_cy) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
      const level = Math.max(_cy.minZoom(), Math.min(_cy.maxZoom(), _cy.zoom() * factor));
      _cy.zoom({
        level,
        renderedPosition: { x: e.offsetX, y: e.offsetY },
      });
    },
    { passive: false, capture: true, signal },
  );
}

// ── PUBLIC API ──────────────────────────────────────────────────────────────

/**
 * Destroys any existing Cytoscape instance and creates a new one from the provided model data.
 * Binds node/edge/canvas tap handlers and sets up pointer interactions.
 *
 * @param {{
 *   elements: Array;
 *   relations: Array;
 *   onNodeTap: function;
 *   (string): void;
 *   onNodeDblTap: function;
 *   (string): void;
 *   onCanvasTap: function;
 *   (): void;
 *   getDrillNodeId: function;
 *   (): string | undefined;
 * }} params
 *   - Model data and event callbacks for the new Cytoscape instance.
 */
export function buildCytoscape({
  elements,
  relations,
  onNodeTap,
  onNodeDblTap,
  onCanvasTap,
  getDrillNodeId,
}) {
  if (_cy) {
    _cy.destroy();
    globalThis.cy = undefined;
    _cy = undefined;
  }
  // Clear any saved layout state from previous graph
  clearSavedLayoutState();

  document.getElementById('cy').classList.remove('hidden');

  const elemIds = new Set(elements.map((e) => e.id));

  // oxlint-disable-next-line no-undef
  _cy = cytoscape({
    container: document.getElementById('cy'),
    elements: {
      nodes: buildNodes(elements, elemIds),
      edges: buildEdges(elements, relations, elemIds),
    },
    style: buildCyStyles(),
    layout: { name: 'grid' },
    userZoomingEnabled: true,
    minZoom: 0.04,
    maxZoom: 6,
    autoResize: false, // Prevent auto-fit on container resize; we manage manually
  });

  bindCyEvents(_cy, onNodeTap, onNodeDblTap, onCanvasTap, getDrillNodeId);
  setupPointerInteractions();
  bindTooltipEvents(_cy);
  updateStats(elements, relations);
  globalThis.updateExportButtonState?.();

  // Expose Cytoscape instance for testing
  globalThis.cy = _cy;
}

/**
 * Runs the layout selected in `#layout-select` on all currently visible elements. Animates only
 * when the visible node count is below `LAYOUT_ANIM_THRESHOLD`. After layout, updates compound node
 * label widths to match their rendered size.
 *
 * @param {object} options - Layout options.
 */
export function applyLayout(options = {}) {
  if (!_cy) {
    return;
  }
  // Stop any currently running layout to avoid interference
  if (_isLayoutRunning) {
    stopLayout();
  }
  const name = document.getElementById('layout-select').value;
  // Run layout only on visible elements — on large models hidden nodes would
  // Dominate computation and produce wrong positions for the visible subset.
  const eles = _cy.elements(':visible');
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

  _isLayoutRunning = true;
  globalThis.__layoutRunning = true;
  globalThis.updateExportButtonState?.();

  let cfg = cfgMap[name] ?? { name, fit: true, padding: 30 };
  let savedViewport;
  if (options.preserveViewport) {
    cfg = { ...cfg, fit: false };
    const zoom = _cy.zoom();
    const pan = _cy.pan();
    savedViewport = { zoom, pan };
  }
  _currentLayoutInst = eles.layout(cfg);
  const layoutInst = _currentLayoutInst;
  layoutInst.on('layoutstop', () => {
    _isLayoutRunning = false;
    globalThis.__layoutRunning = false;
    globalThis.updateExportButtonState?.();
    // Restore viewport if it was saved (pan first, then zoom to avoid zoom adjusting pan)
    if (savedViewport) {
      _cy.pan(savedViewport.pan);
      _cy.zoom(savedViewport.zoom);
    }
    // After layout, set text-max-width on compound nodes to match their actual rendered width
    // So long labels wrap correctly rather than overflowing the container box.
    for (const n of _cy.nodes(':parent:visible')) {
      n.style('text-max-width', `${Math.max(n.width() - 24, 40)}px`);
    }
  });
  layoutInst.run();
}

/** Fits the graph to the viewport with the standard padding. */
export function fitGraph() {
  _cy?.fit(undefined, FIT_PADDING);
}

/**
 * Stops any running layout animation and snaps all nodes to their final positions immediately. Call
 * before fitGraph() when you need stable node positions without waiting for animation.
 */
export function stopLayout() {
  if (_isLayoutRunning && _cy) {
    _cy.stop(false, true);
  }
}

/** Notifies Cytoscape that the container size may have changed; call after un-hiding #cy. */
export function resizeCy() {
  // Defer so the browser reflows #cy before Cytoscape queries its bounding rect.
  setTimeout(() => _cy?.resize(), 0);
}

/**
 * Updates the sidebar count badges based on the current visible element and relationship counts.
 * Shows "visible / total" when they differ, or just "total" when all are visible.
 *
 * @param {Array} allElements - All model elements.
 * @param {Array} allRelations - All model relations.
 */
export function updateStats(allElements, allRelations) {
  if (!_cy) {
    return;
  }
  const vis = _cy.elements(':visible');
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

// ── ZOOM ────────────────────────────────────────────────────────────────────

/** Zooms the graph in by 1.3× and re-centres. */
export function zoomIn() {
  if (!_cy) {
    return;
  }
  _cy.zoom(_cy.zoom() * 1.3);
  _cy.center();
}

/** Zooms the graph out by 1/1.3× and re-centres. */
export function zoomOut() {
  if (!_cy) {
    return;
  }
  _cy.zoom(_cy.zoom() * 0.77);
  _cy.center();
}

// ── COMPOUND PARENT SYNC ───────────────────────────────────────────────────

/**
 * In compound mode, syncs each node's parent membership against the provided visibility set. A node
 * is moved back to its model parent when both the node and the parent are visible, and detached
 * when either is hidden — preventing Cytoscape from collapsing the container to zero size.
 *
 * @param {Set<string>} visibleIds - Set of visible node IDs.
 */
function syncCompoundParentIds(visibleIds) {
  if (!_cy || _containmentMode !== 'compound') {
    return;
  }
  for (const n of _cy.nodes()) {
    const origParent = n.data('modelParent');
    if (!origParent) {
      continue;
    }
    const nodeOk = visibleIds.has(n.id());
    const parentOk = _cy.$id(origParent).length > 0 && visibleIds.has(origParent);
    const currentParId = n.parent().length ? n.parent().id() : undefined;
    if (nodeOk && parentOk) {
      if (currentParId !== origParent) {
        n.move({ parent: origParent });
      }
    } else if (currentParId !== undefined) {
      // eslint-disable-next-line unicorn/no-null
      n.move({ parent: null });
    }
  }
}

// ── VISIBILITY APPLICATION ──────────────────────────────────────────────────

/**
 * Returns a plain-data snapshot of all nodes and edges currently in the graph. Used by
 * visibility.js to feed BFS without accessing _cy directly. Call only after confirming
 * `isGraphLoaded()` — returns undefined when no graph is loaded.
 *
 * @returns {{ nodes: Array; edges: Array } | undefined} Snapshot of graph elements, or undefined
 *   when no graph is loaded.
 */
export function getGraphSnapshot() {
  if (!_cy) {
    return;
  }
  return {
    nodes: _cy.nodes().map((n) => ({ id: n.id(), type: n.data('type'), parent: n.parent().id() })),
    edges: _cy.edges().map((e) => ({
      id: e.id(),
      type: e.data('type'),
      source: e.source().id(),
      target: e.target().id(),
      isContainment: Boolean(e.data('isContainment')),
    })),
  };
}

/**
 * Applies display visibility to all graph elements in a single batched operation. Also syncs
 * compound parent membership when in compound containment mode.
 *
 * @param {{
 *   visibleNodeIds: Set<string>;
 *   isEdgeVisible: function;
 *   (string, string, string, boolean): boolean;
 *   forceVisibleId?: string;
 * }} params
 *   - `visibleNodeIds`: node IDs that should be displayed.
 *
 *     - `isEdgeVisible(srcId, tgtId, type, isContainment)`: predicate for each edge.
 *     - `forceVisibleId`: always show this node regardless of the visible set (drill root).
 */
export function applyDisplayState({ visibleNodeIds, isEdgeVisible, forceVisibleId }) {
  if (!_cy) {
    return;
  }
  syncCompoundParentIds(visibleNodeIds);
  _cy.batch(() => {
    for (const n of _cy.nodes()) {
      const show = visibleNodeIds.has(n.id()) || n.id() === forceVisibleId;
      n.style('display', show ? 'element' : 'none');
    }
    for (const e of _cy.edges()) {
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

// ── DRILL-ROOT CLASS HELPERS ────────────────────────────────────────────────

/**
 * Returns true if the graph is loaded (a Cytoscape instance exists).
 *
 * @returns {boolean} Whether a model is currently displayed.
 */
export function isGraphLoaded() {
  return Boolean(_cy);
}

/**
 * Returns the Cytoscape instance, or undefined if not loaded. Use with caution - avoid calling
 * during graph rebuild.
 *
 * @returns {cytoscape.Core | undefined} The Cytoscape instance, or undefined if not initialised.
 */
export function getCy() {
  return _cy;
}

/**
 * Returns a snapshot of currently visible elements (nodes and edges). Respects Cytoscape's :visible
 * selector (filters, containment).
 *
 * @returns {{
 *   nodes: { id: string; type: string; label: string }[];
 *   edges: { id: string; type: string; source: string; target: string; label: string }[];
 * }}
 *   Snapshot of visible nodes and edges.
 */
export function getVisibleElements() {
  if (!_cy) {
    return { nodes: [], edges: [] };
  }
  const visibleNodes = _cy.nodes(':visible').map((n) => ({
    id: n.id(),
    type: n.data('type'),
    label: n.data('label') || n.data('name') || '',
  }));
  const visibleEdges = _cy.edges(':visible').map((e) => ({
    id: e.id(),
    type: e.data('type'),
    source: e.source().id(),
    target: e.target().id(),
    label: e.data('label') || '',
  }));
  return { nodes: visibleNodes, edges: visibleEdges };
}

/**
 * Returns the viewport dimensions (container width and height in pixels).
 *
 * @returns {{ width: number; height: number }} Container dimensions in pixels.
 */
export function getViewportBounds() {
  if (!_cy) {
    return { width: 0, height: 0 };
  }
  const rect = _cy.container().getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

/**
 * Adds the `.drill-root` class to the node with the given ID. Used to restore the class after a
 * graph rebuild that creates fresh node objects.
 *
 * @param {string} nodeId - The drill-root node ID.
 */
export function addDrillRootClass(nodeId) {
  _cy?.$id(nodeId).addClass('drill-root');
}

/**
 * Clears `.drill-root` from all nodes, then marks `nodeId` as the new drill root. Called when
 * entering or switching the drill-down focus node.
 *
 * @param {string} nodeId - The new drill-root node ID.
 */
export function setDrillRootNode(nodeId) {
  _cy.nodes().removeClass('drill-root');
  _cy.$id(nodeId).addClass('drill-root');
}

/** Removes the `.drill-root` class from all nodes. Called when exiting drill mode. */
export function clearDrillRootNodes() {
  _cy?.nodes().removeClass('drill-root');
}

// ── NODE FOCUS ──────────────────────────────────────────────────────────────

/**
 * Returns true when the graph contains a visible node with the given ID.
 *
 * @param {string} id - Node ID to check.
 * @returns {boolean} Whether the node exists in the current graph.
 */
export function hasGraphNode(id) {
  return Boolean(_cy?.$id(id).length);
}

/**
 * Resizes the Cytoscape canvas, animates the camera to the node with `id`, and selects it. Returns
 * true if the node was found and the animation was started, false otherwise.
 *
 * @param {string} id - The element ID to focus.
 * @returns {boolean} Whether the node was found.
 */
export function focusCyNode(id) {
  if (!_cy) {
    return false;
  }
  // Ensure container has up-to-date dimensions before resizing
  const cyEl = document.getElementById('cy');
  if (cyEl) {
    // Force reflow to get accurate container size
    const _ = cyEl.offsetHeight;
  }
  _cy.resize();
  const node = _cy.$id(id);
  if (!node?.length) {
    return false;
  }
  _cy.animate({ center: { eles: node }, zoom: FOCUS_ZOOM }, { duration: 400 });
  node.select();
  return true;
}

// ── THEME ───────────────────────────────────────────────────────────────────

/**
 * Refreshes the Cytoscape edge label background colour to match the current canvas background.
 * Called after a theme change so the label knockout matches the new theme.
 *
 * @param {function(): string} getBg - Returns the current canvas background colour.
 */
export function refreshEdgeLabelBg(getBg) {
  if (!_cy) {
    return;
  }
  requestAnimationFrame(() =>
    _cy.style().selector('edge').style('text-background-color', getBg()).update(),
  );
}

// ── LAYOUT STATE PRESERVATION ───────────────────────────────────────────────────

/**
 * Saves the current node positions and viewport state. Call before entering drill-down. The saved
 * state can be restored later via restoreLayoutState().
 */
export function saveLayoutState() {
  if (!_cy) {
    _savedLayoutState = undefined;
    return;
  }
  const positions = {};
  for (const n of _cy.nodes()) {
    positions[n.id()] = { x: n.position('x'), y: n.position('y') };
  }
  _savedLayoutState = {
    positions,
    viewport: {
      zoom: _cy.zoom(),
      pan: { ..._cy.pan() }, // Copy pan object to avoid mutation
    },
  };
}

/**
 * Restores a previously saved layout state (node positions and viewport).
 *
 * @returns {boolean} True if a saved state existed and was restored, false otherwise.
 */
export function restoreLayoutState() {
  if (!_cy || !_savedLayoutState) {
    return false;
  }
  const { positions, viewport } = _savedLayoutState;
  _cy.batch(() => {
    for (const n of _cy.nodes()) {
      if (positions[n.id()]) {
        n.position(positions[n.id()]);
      }
    }
  });
  // Restore viewport: pan first, then zoom to avoid zoom adjusting pan
  _cy.pan(viewport.pan);
  _cy.zoom(viewport.zoom);
  _savedLayoutState = undefined; // Consume
  return true;
}

/** Clears any saved layout state. Call on model load or when state should be discarded. */
export function clearSavedLayoutState() {
  _savedLayoutState = undefined;
}
