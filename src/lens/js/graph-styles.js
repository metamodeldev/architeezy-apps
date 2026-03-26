// ── GRAPH STYLES & LABEL MEASUREMENT ───────────────────────────────────────
//
// Separated from graph.js so the Cytoscape style array and the label-size
// Helper can be read and tested independently of the graph lifecycle code.

import { LABEL_OUTLINE, LABEL_WRAP_W } from './constants.js';

const NODE_FONT_FAMILY = 'system-ui, -apple-system, sans-serif';
const LINE_H = 13; // 10 px font + 3 px leading
const H_PAD = 10; // Horizontal padding inside a node box
const V_PAD = 6; // Vertical padding inside a node box

// ── LABEL MEASUREMENT ──────────────────────────────────────────────────────

/**
 * Measures the rendered pixel width of `text` using the given span element.
 *
 * @param {HTMLSpanElement} span - Off-screen measurement span.
 * @param {string} text - Text to measure.
 * @returns {number} Rendered width in pixels.
 */
function measureText(span, text) {
  span.textContent = text;
  return span.getBoundingClientRect().width;
}

/**
 * Greedily wraps `words` into lines that do not exceed `maxW` pixels.
 *
 * @param {HTMLSpanElement} span - Off-screen measurement span.
 * @param {string[]} words - Array of words to wrap.
 * @param {number} maxW - Maximum line width in pixels.
 * @returns {string[]} Array of wrapped line strings.
 */
function wrapLines(span, words, maxW) {
  const lines = [];
  let cur = '';
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (cur && measureText(span, candidate) > maxW) {
      lines.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur) {
    lines.push(cur);
  }
  return lines;
}

/**
 * Creates a temporary off-screen DOM span for measuring node label dimensions. The span matches the
 * Cytoscape node label font exactly. Call destroy() when all measurements are done to remove the
 * span from the DOM.
 *
 * @returns {{
 *   labelSize(text: string): { nw: number; nh: number };
 *   destroy(): void;
 * }}
 *   The label measurer object.
 */
export function createLabelMeasurer() {
  const span = document.createElement('span');
  span.style.cssText =
    'position:absolute;top:-9999px;left:-9999px;visibility:hidden;' +
    `white-space:nowrap;font-size:10px;font-family:${NODE_FONT_FAMILY};`;
  document.body.append(span);

  return {
    /**
     * Returns the pixel width/height a Cytoscape node needs to fit `text`.
     *
     * @param {string} text - The label text to measure.
     * @returns {{ nw: number; nh: number }} The computed node width and height.
     */
    labelSize(text) {
      const words = String(text || '').split(/\s+/);
      const lines = wrapLines(span, words, LABEL_WRAP_W);
      const tw = Math.max(1, ...lines.map((l) => measureText(span, l)));
      const th = lines.length * LINE_H;
      return {
        nw: Math.ceil(tw + LABEL_OUTLINE * 2 + H_PAD * 2),
        nh: Math.ceil(th + LABEL_OUTLINE * 2 + V_PAD * 2),
      };
    },
    /** Removes the measurement span from the DOM. */
    destroy() {
      span.remove();
    },
  };
}

// ── THEME HELPER ───────────────────────────────────────────────────────────

/**
 * Returns the Cytoscape canvas background color from the active CSS theme variable.
 *
 * @returns {string} The CSS color value for the canvas background.
 */
export function cyBg() {
  return getComputedStyle(document.documentElement).getPropertyValue('--cy-bg').trim() || '#12172b';
}

// ── CYTOSCAPE STYLE ARRAY ──────────────────────────────────────────────────

/**
 * Builds and returns the full Cytoscape style array for the graph.
 *
 * @returns {Array} The Cytoscape style array.
 */
export function buildCyStyles() {
  return [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'color': '#fff',
        'text-outline-width': LABEL_OUTLINE,
        'font-size': '10px',
        'font-family': NODE_FONT_FAMILY,
        'line-height': 1.3,
        'shape': 'round-rectangle',
        'text-halign': 'center',
        'text-valign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': `${LABEL_WRAP_W}px`, // Keep in sync with LABEL_WRAP_W
        'min-zoomed-font-size': 5,
        'border-width': 1,
        'border-color': 'rgba(255,255,255,0.18)',
      },
    },
    {
      // Only apply color mappings to nodes that have the `color` data field.
      // Parent/compound nodes have no color and would trigger a Cytoscape warning.
      selector: 'node[color]',
      style: {
        'background-color': 'data(color)',
        'text-outline-color': 'data(color)',
      },
    },
    {
      // Leaf nodes only: apply canvas-measured dimensions.
      // Compound (:parent) nodes are excluded — they auto-size to fit children.
      selector: 'node:childless',
      style: { width: 'data(nw)', height: 'data(nh)' },
    },
    {
      // Compound (container) nodes: label pinned to top; padding-top reserves space for it.
      selector: ':parent',
      style: {
        'text-valign': 'top',
        'text-halign': 'center',
        'text-margin-y': 6,
        'text-wrap': 'wrap',
        'text-max-width': `${LABEL_WRAP_W}px`, // Updated per-node after layout
        'padding-top': '50px', // Room for up to ~3 label lines
        'padding-right': '12px',
        'padding-bottom': '12px',
        'padding-left': '12px',
        'background-opacity': 0.12,
        'border-style': 'dashed',
        'border-width': 2,
        'min-width': 60, // Stay visible even when all children are hidden
        'min-height': 30,
      },
    },
    {
      // Drill-root node — green border regardless of selection state
      selector: 'node.drill-root',
      style: { 'border-width': 3, 'border-color': '#22c55e', 'z-index': 9998 },
    },
    {
      // Selected node — red border; overrides green when node is both drill-root and selected.
      // Must come AFTER node.drill-root in this array so its specificity wins.
      selector: 'node:selected',
      style: { 'border-width': 3, 'border-color': '#e94560', 'z-index': 9999 },
    },
    {
      selector: 'edge',
      style: {
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.8,
        'width': 1.5,
        'curve-style': 'bezier',
        'opacity': 0.75,
      },
    },
    {
      selector: 'edge[label]',
      style: {
        'label': 'data(label)',
        'font-size': '8px',
        'color': '#aaa',
        'text-outline-width': 0,
        // CyBg() reads the active CSS variable so the label background matches the canvas.
        'text-background-color': cyBg(),
        'text-background-opacity': 0.7,
        'text-background-padding': '2px',
        'min-zoomed-font-size': 7,
      },
    },
    {
      selector: 'edge:selected',
      style: { 'width': 3, 'opacity': 1, 'z-index': 9999 },
    },
    {
      // Containment (composition) edges: filled diamond at source (parent) end, no arrowhead at target.
      selector: 'edge[?isContainment]',
      style: {
        'source-arrow-shape': 'diamond',
        'source-arrow-color': 'data(color)',
        'source-arrow-fill': 'filled',
        'target-arrow-shape': 'none',
        'line-color': 'data(color)',
        'width': 2,
        'opacity': 0.55,
        'curve-style': 'bezier',
      },
    },
  ];
}
