/**
 * Graph styling constants and label measurement.
 *
 * @module graph/styles
 * @package
 */

// Max text-wrap width for node labels (px); must stay in sync with text-max-width in buildCyStyles
const LABEL_WRAP_W = 120;
// Text outline width for node labels (px); used in node size calculation to pad the bounding box
const LABEL_OUTLINE = 2;

const NODE_FONT_FAMILY = 'system-ui, -apple-system, sans-serif';
const LINE_H = 13; // 10 px font + 3 px leading
const H_PAD = 10; // Horizontal padding inside a node box
const V_PAD = 6; // Vertical padding inside a node box

function measureText(span, text) {
  span.textContent = text;
  return span.getBoundingClientRect().width;
}

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
 * Creates a temporary off-screen DOM span for measuring node label dimensions.
 *
 * @returns {{ labelSize(text: string): { nw: number; nh: number }; destroy(): void }} Object with
 *   labelSize method for measuring text and destroy method for cleanup
 */
export function createLabelMeasurer() {
  const span = document.createElement('span');
  span.style.cssText =
    'position:absolute;top:-9999px;left:-9999px;visibility:hidden;' +
    `white-space:nowrap;font-size:10px;font-family:${NODE_FONT_FAMILY};`;
  document.body.append(span);

  return {
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
    destroy() {
      span.remove();
    },
  };
}

/**
 * Returns the Cytoscape canvas background color from the active CSS theme variable.
 *
 * @returns {string} The CSS color value for the canvas background.
 */
export function cyBg() {
  return getComputedStyle(document.documentElement).getPropertyValue('--cy-bg').trim() || '#12172b';
}

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
        'text-max-width': `${LABEL_WRAP_W}px`,
        'min-zoomed-font-size': 5,
        'border-width': 1,
        'border-color': 'rgba(255,255,255,0.18)',
      },
    },
    {
      selector: 'node[color]',
      style: {
        'background-color': 'data(color)',
        'text-outline-color': 'data(color)',
      },
    },
    {
      selector: 'node:childless',
      style: { width: 'data(nw)', height: 'data(nh)' },
    },
    {
      selector: ':parent',
      style: {
        'text-valign': 'top',
        'text-halign': 'center',
        'text-margin-y': 6,
        'text-wrap': 'wrap',
        'text-max-width': `${LABEL_WRAP_W}px`,
        'padding-top': '50px',
        'padding-right': '12px',
        'padding-bottom': '12px',
        'padding-left': '12px',
        'background-opacity': 0.12,
        'border-style': 'dashed',
        'border-width': 2,
        'min-width': 60,
        'min-height': 30,
      },
    },
    {
      selector: 'node.drill-root',
      style: { 'border-width': 3, 'border-color': '#22c55e', 'z-index': 9998 },
    },
    {
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
        'hit-width': 10, // Increase clickable area for better test reliability
      },
    },
    {
      selector: 'edge[label]',
      style: {
        'label': 'data(label)',
        'font-size': '8px',
        'color': '#aaa',
        'text-outline-width': 0,
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
    {
      selector: 'node.faded',
      style: { 'opacity': 0.35, 'text-outline-width': 0 },
    },
    {
      selector: 'edge.faded',
      style: { opacity: 0.15 },
    },
    {
      selector: 'node.search-dimmed',
      style: { 'opacity': 0.35, 'text-outline-width': 0 },
    },
    {
      selector: 'edge.search-dimmed',
      style: { opacity: 0.15 },
    },
  ];
}
