// ── IMAGE EXPORT ─────────────────────────────────────────────────────────────
//
// Provides PNG and SVG export of the current graph view with optional legend.
// Follows the same pattern as table.js for CSV export.

import { getCy, getVisibleElements } from './graph.js';
import { t } from './i18n.js';
import { elemColor, relColor } from './palette.js';
import { showToast } from './ui.js';

let _isExporting = false;

/**
 * Returns the current exporting state.
 *
 * @returns {boolean} True while an export is in progress.
 */
export function getExportingState() {
  return _isExporting;
}

/**
 * Generates a sanitized export filename with timestamp.
 *
 * @param {string} rawName - Raw model name.
 * @param {'png' | 'svg'} format - Image format.
 * @returns {string} Export filename.
 */
function generateExportFilename(rawName, format) {
  const sanitizedName = (rawName || 'model').replaceAll(/[^\w\s-]/g, '').trim() || 'model';
  const timestamp = new Date().toISOString().replaceAll(/[:]/g, '-').slice(0, 19);
  return `architeezy-${sanitizedName}-graph-${timestamp}.${format}`;
}

/**
 * Performs the actual export based on format.
 *
 * @param {any} cy - Cytoscape instance.
 * @param {any[]} visibleElements - Visible elements.
 * @param {boolean} includeLegend - Whether to include legend.
 * @param {string} filename - Output filename.
 * @param {'png' | 'svg'} format - Export format.
 */
async function performExport(cy, visibleElements, includeLegend, filename, format) {
  if (format === 'png') {
    await exportPNG(cy, visibleElements, includeLegend, filename);
  } else if (format === 'svg') {
    exportSVG(cy, visibleElements, filename, includeLegend);
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Main entry point for graph image export. Includes the legend overlay when the #graph-legend
 * element is currently visible on the canvas.
 *
 * @param {'png' | 'svg'} format - Image format.
 */
export async function exportGraphImage(format) {
  const legendEl = document.getElementById('graph-legend');
  const includeLegend = Boolean(legendEl && !legendEl.classList.contains('hidden'));
  if (_isExporting) {
    return;
  }
  _isExporting = true;

  const btn = document.getElementById('export-image-btn');
  if (btn) {
    btn.classList.add('loading');
    // Let browser render loading state before disabling
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
    btn.disabled = true;
    // Another frame to ensure both states are painted
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }

  globalThis.updateExportButtonState?.(); // Also disables via state update

  try {
    const cy = getCy();
    if (!cy) {
      showToast(t('exportGraphNotReady'));
      return;
    }

    const visibleElements = getVisibleElements();
    const modelNameEl = document.getElementById('current-model-name');
    const rawName = modelNameEl?.textContent.trim() || 'model';
    const filename = generateExportFilename(rawName, format);
    await performExport(cy, visibleElements, includeLegend, filename, format);
  } catch (error) {
    console.error('Export failed', error);
    showToast(t('exportFailed') + ': ' + error.message);
  } finally {
    _isExporting = false;
    if (btn) {
      btn.classList.remove('loading');
    }
    globalThis.updateExportButtonState?.();
  }
}

// ── PNG EXPORT ───────────────────────────────────────────────────────────────

/**
 * Returns the top-left position of the #graph-legend DOM element converted to Cytoscape graph
 * coordinates. Returns undefined when the element cannot be found or the Cytoscape container is
 * unavailable.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @returns {{ x: number; y: number } | undefined} Graph-space position of the legend's top-left
 *   corner.
 */
function getLegendGraphPosition(cy) {
  const el = document.getElementById('graph-legend');
  if (!el) {
    return;
  }
  const cyContainer = cy.container();
  if (!cyContainer) {
    return;
  }
  // Use viewport-relative rects so the calculation is correct regardless of DOM nesting depth.
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

/**
 * Exports the entire graph as a PNG image with optional legend overlay. Uses `cy.png({ full: true
 * })` to capture all visible elements regardless of the current pan/zoom. When the legend is
 * enabled, the canvas is expanded as needed so the legend is never clipped.
 *
 * Coordinate mapping for the legend: - Cytoscape's internal transform: pixel = l * (graphCoord −
 * bb.x1), where l = scale × devicePixelRatio (Cytoscape always multiplies its getPixelRatio() on
 * top of the scale option). l is derived from the actual image width to avoid guessing the device
 * ratio. - The legend is drawn at drawScale = l / zoom so its size relative to graph nodes matches
 * what the user sees on screen (legW/nodeW·zoom in the browser = legW·drawScale / nodeW·l in PNG).
 * - If the legend extends beyond the graph image boundaries, the canvas is enlarged and the graph
 * image is offset accordingly.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Currently visible graph elements.
 * @param {boolean} includeLegend - Whether to draw a legend overlay.
 * @param {string} filename - Suggested download filename.
 */
async function exportPNG(cy, visibleElements, includeLegend, filename) {
  const bgColor =
    getComputedStyle(document.documentElement).getPropertyValue('--cy-bg').trim() || '#12172b';
  const scale = 2;
  const bb = cy.elements().boundingBox();
  const pngBlob = cy.png({ scale, full: true, bg: bgColor, output: 'blob' });
  const img = await createImageBitmap(pngBlob);
  if (img.width * img.height * 4 > 100 * 1024 * 1024) {
    throw new Error('Canvas too large for PNG export');
  }
  const { legendPos, drawScale, imgOffsetX, imgOffsetY, canvasW, canvasH } = computePngLegendLayout(
    cy,
    visibleElements,
    includeLegend,
    img,
    bb,
    scale,
  );
  const blob = await renderPngComposite(
    img,
    bgColor,
    canvasW,
    canvasH,
    imgOffsetX,
    imgOffsetY,
    includeLegend,
    legendPos,
    drawScale,
    visibleElements,
  );
  triggerDownload(blob, filename);
}

/**
 * Builds the list of legend line descriptors for the given visible elements. Mirrors the content of
 * the #graph-legend DOM overlay.
 *
 * @param {{ nodes: { type: string }[]; edges: { type: string }[] }} elements - Visible graph
 *   elements.
 * @returns {{ text: string; isHeader?: boolean; color?: string; isSwatch?: boolean }[]} Legend
 *   lines.
 */
function buildLegendLines(elements) {
  const lines = [];

  const elemTypes = [...new Set(elements.nodes.map((n) => n.type))];
  if (elemTypes.length > 0) {
    lines.push({ text: 'ENTITIES', isHeader: true });
    for (const type of elemTypes) {
      lines.push({ text: type, color: elemColor(type), isSwatch: true });
    }
  }

  const relTypes = [
    ...new Set(elements.edges.filter((e) => e.type !== '_containment').map((e) => e.type)),
  ];
  if (relTypes.length > 0) {
    lines.push({ text: 'RELATIONSHIPS', isHeader: true });
    for (const type of relTypes) {
      lines.push({ text: type, color: relColor(type), isSwatch: true });
    }
  }

  return lines;
}

// CSS-matched legend layout constants (values in CSS px; multiply by scale for HiDPI).
// Source: #graph-legend, .legend-section-label, .legend-row, .legend-dot in app.css.
const LEGEND = {
  padH: 10, // #graph-legend padding-left/right
  padV: 8, // #graph-legend padding-top/bottom
  headerFont: 10.4, // .legend-section-label font-size (0.65rem @ 16px base)
  headerH: 13, // Rendered height of header line incl. margin-bottom:2px
  sectionGap: 6, // .legend-section-label margin-top (non-first section)
  rowFont: 12, // .legend-row font-size (0.75rem @ 16px base)
  rowH: 16, // Rendered height of a row incl. padding:1px 0
  dotSize: 10, // .legend-dot width/height
  dotGap: 6, // .legend-row gap
  radius: 6, // #graph-legend border-radius
};

/**
 * Computes the pixel dimensions of the legend panel for a given line list and scale. Used by both
 * PNG and SVG renderers to size the background rectangle consistently.
 *
 * @param {{ text: string; isHeader?: boolean; isSwatch?: boolean }[]} lines - Legend lines.
 * @param {function(string): number} measureText - Returns text width in unscaled px.
 * @param {number} scale - HiDPI scale factor (1 for SVG).
 * @returns {{ width: number; height: number }} Panel dimensions in scaled px.
 */
function computeLegendSize(lines, measureText, scale) {
  const L = LEGEND;
  let contentH = 0;
  let maxW = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let tw;
    if (line.isHeader) {
      if (i > 0) {
        contentH += L.sectionGap * scale;
      }
      contentH += L.headerH * scale;
      tw = measureText(line.text, L.headerFont * scale);
    } else {
      contentH += L.rowH * scale;
      tw = measureText(line.text, L.rowFont * scale) + (L.dotSize + L.dotGap) * scale;
    }
    if (tw > maxW) {
      maxW = tw;
    }
  }

  return {
    width: maxW + L.padH * 2 * scale,
    height: contentH + L.padV * 2 * scale,
  };
}

/**
 * Renders the legend lines onto the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
 * @param {{ text: string; isHeader?: boolean; isSwatch?: boolean }[]} lines - Legend line
 *   descriptors.
 * @param {typeof LEGEND} L - Legend layout constants.
 * @param {number} ox - X coordinate of the legend background's top-left corner.
 * @param {number} oy - Y coordinate of the legend background's top-left corner.
 * @param {number} scale - HiDPI scale factor.
 * @param {string} headerLetterSpacing - Letter spacing for header text (e.g., "0.52px").
 * @param {string} mutedColor - Color for header and row text.
 * @returns {void}
 */
function renderLegendLines(ctx, lines, L, ox, oy, scale, headerLetterSpacing, mutedColor) {
  let y = oy + L.padV * scale;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.isHeader) {
      if (i > 0) {
        y += L.sectionGap * scale;
      }
      ctx.font = `${L.headerFont * scale}px "Segoe UI", system-ui, sans-serif`;
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = headerLetterSpacing;
      }
      ctx.fillStyle = mutedColor;
      ctx.textBaseline = 'top';
      ctx.fillText(line.text, ox + L.padH * scale, y);
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = '0px';
      }
      y += L.headerH * scale;
    } else {
      const midY = y + (L.rowH * scale) / 2;
      ctx.fillStyle = line.color;
      ctx.beginPath();
      ctx.arc(
        ox + L.padH * scale + (L.dotSize * scale) / 2,
        midY,
        (L.dotSize * scale) / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.font = `${L.rowFont * scale}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = mutedColor;
      ctx.textBaseline = 'middle';
      ctx.fillText(line.text, ox + (L.padH + L.dotSize + L.dotGap) * scale, midY);
      y += L.rowH * scale;
    }
  }
}

/**
 * Draws a legend overlay on the canvas at the given position. Layout and typography exactly match
 * the #graph-legend DOM overlay defined in app.css.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context.
 * @param {{ nodes: { type: string }[]; edges: object[] }} elements - Visible graph elements.
 * @param {{ x: number; y: number } | null} pos - Top-left position in canvas pixels. When null,
 *   falls back to top-left corner.
 * @param {number} scale - Device pixel ratio scale factor.
 */
function drawLegend(ctx, elements, pos, scale) {
  const docStyle = getComputedStyle(document.documentElement);
  const surfaceColor = docStyle.getPropertyValue('--surface').trim() || '#16213e';
  const borderColor = docStyle.getPropertyValue('--border').trim() || '#2a3a5c';
  const mutedColor = docStyle.getPropertyValue('--text-muted').trim() || '#9aa0b0';

  const lines = buildLegendLines(elements);
  if (!lines.length) {
    return;
  }

  const L = LEGEND;
  const headerLetterSpacing = `${(0.05 * L.headerFont * scale).toFixed(2)}px`;

  /**
   * Measures the width of the given text with the specified font size.
   *
   * @param {string} text - The text to measure.
   * @param {number} size - Font size in pixels.
   * @returns {number} Text width in pixels.
   */
  function measureText(text, size) {
    ctx.font = `${size}px "Segoe UI", system-ui, sans-serif`;
    return ctx.measureText(text).width || 0;
  }

  const { width: bgW, height: bgH } = computeLegendSize(lines, measureText, scale);
  const ox = pos ? pos.x : L.padH * scale;
  const oy = pos ? pos.y : L.padV * scale;

  // Background panel
  ctx.fillStyle = surfaceColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = scale;
  ctx.beginPath();
  ctx.roundRect(ox, oy, bgW, bgH, L.radius * scale);
  ctx.fill();
  ctx.stroke();

  // Draw lines
  renderLegendLines(ctx, lines, L, ox, oy, scale, headerLetterSpacing, mutedColor);
}

// ── PNG EXPORT HELPERS ────────────────────────────────────────────────────────

/**
 * Computes the layout metrics for PNG export, including legend position and canvas dimensions.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Currently visible graph elements.
 * @param {boolean} includeLegend - Whether to include a legend overlay.
 * @param {HTMLImageElement} img - The Cytoscape-rendered PNG image.
 * @param {{ x1: number; y1: number; x2: number; y2: number }} bb - Bounding box of the graph.
 * @param {number} baseScale - Base scale factor (e.g., 2 for HiDPI).
 * @returns {{
 *   legendPos: { x: number; y: number } | undefined;
 *   drawScale: number;
 *   imgOffsetX: number;
 *   imgOffsetY: number;
 *   canvasW: number;
 *   canvasH: number;
 * }}
 *   Computed layout metrics.
 */
function computePngLegendLayout(cy, visibleElements, includeLegend, img, bb, baseScale) {
  let legendPos,
    drawScale = baseScale,
    imgOffsetX = 0,
    imgOffsetY = 0,
    canvasW = img.width,
    canvasH = img.height;
  if (includeLegend) {
    const graphPos = getLegendGraphPosition(cy);
    const bbW = bb.x2 - bb.x1,
      bbH = bb.y2 - bb.y1;
    if (graphPos && Number.isFinite(bb.x1) && bbW > 0 && bbH > 0) {
      const effScaleX = img.width / Math.ceil(bbW),
        effScaleY = img.height / Math.ceil(bbH);
      drawScale = effScaleX / cy.zoom();
      legendPos = {
        x: (graphPos.x - bb.x1) * effScaleX,
        y: (graphPos.y - bb.y1) * effScaleY,
      };
      const lines = buildLegendLines(visibleElements);
      if (lines.length) {
        const tmpCtx = document.createElement('canvas').getContext('2d');
        const { width: legW, height: legH } = computeLegendSize(
          lines,
          (text, size) => {
            tmpCtx.font = `${size}px "Segoe UI", system-ui, sans-serif`;
            return tmpCtx.measureText(text).width || 0;
          },
          drawScale,
        );
        const overLeft = Math.max(0, Math.ceil(-legendPos.x));
        const overTop = Math.max(0, Math.ceil(-legendPos.y));
        const overRight = Math.max(0, Math.ceil(legendPos.x + legW - img.width));
        const overBottom = Math.max(0, Math.ceil(legendPos.y + legH - img.height));
        imgOffsetX = overLeft;
        imgOffsetY = overTop;
        canvasW = img.width + overLeft + overRight;
        canvasH = img.height + overTop + overBottom;
        legendPos = { x: legendPos.x + overLeft, y: legendPos.y + overTop };
      }
    }
  }
  return { legendPos, drawScale, imgOffsetX, imgOffsetY, canvasW, canvasH };
}

/**
 * Renders the composite PNG canvas and returns a blob.
 *
 * @param {HTMLImageElement} img - The Cytoscape PNG image.
 * @param {string} bgColor - Background color.
 * @param {number} canvasW - Composite canvas width.
 * @param {number} canvasH - Composite canvas height.
 * @param {number} imgOffsetX - X offset for drawing the graph image.
 * @param {number} imgOffsetY - Y offset for drawing the graph image.
 * @param {boolean} includeLegend - Whether to include the legend.
 * @param {{ x: number; y: number } | undefined} legendPos - Legend position in canvas coordinates.
 * @param {number} drawScale - Scale factor for drawing the legend.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Visible graph elements.
 * @returns {Promise<Blob>} The PNG blob.
 */
async function renderPngComposite(
  img,
  bgColor,
  canvasW,
  canvasH,
  imgOffsetX,
  imgOffsetY,
  includeLegend,
  legendPos,
  drawScale,
  visibleElements,
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.drawImage(img, imgOffsetX, imgOffsetY);
  if (includeLegend && legendPos !== undefined) {
    drawLegend(ctx, visibleElements, legendPos, drawScale);
  }
  // oxlint-disable-next-line promise/avoid-new
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  return blob;
}

// ── SVG EXPORT ───────────────────────────────────────────────────────────────

/**
 * Collects node data from the Cytoscape instance using graph (model) coordinates so the SVG
 * captures all visible elements regardless of the current pan/zoom.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @returns {{
 *   x: number;
 *   y: number;
 *   w: number;
 *   h: number;
 *   type: string;
 *   label: string;
 *   color: string;
 *   shape: string;
 * }[]}
 *   Node descriptors in graph coordinates.
 */
function collectSvgNodes(cy) {
  const nodes = [];
  for (const node of cy.nodes(':visible')) {
    const pos = node.position(); // Graph coords — independent of pan/zoom
    const type = node.data('type');
    nodes.push({
      x: pos.x,
      y: pos.y,
      w: node.width(),
      h: node.height(),
      type,
      label: node.data('label') || node.data('name') || '',
      color: elemColor(type),
      shape: node.style('shape') || 'ellipse',
    });
  }
  return nodes;
}

/**
 * Collects edge data from the Cytoscape instance using graph (model) coordinates.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @returns {{
 *   x1: number;
 *   y1: number;
 *   x2: number;
 *   y2: number;
 *   type: string;
 *   label: string;
 *   color: string;
 * }[]}
 *   Edge descriptors in graph coordinates.
 */
function collectSvgEdges(cy) {
  const edges = [];
  for (const edge of cy.edges(':visible')) {
    const src = edge.source();
    const tgt = edge.target();
    if (!src.length || !tgt.length) {
      continue;
    }
    const srcPos = src.position(); // Graph coords
    const tgtPos = tgt.position();
    const type = edge.data('type');
    edges.push({
      x1: srcPos.x,
      y1: srcPos.y,
      x2: tgtPos.x,
      y2: tgtPos.y,
      type,
      label: edge.data('label') || '',
      color: relColor(type),
    });
  }
  return edges;
}

/**
 * Computes the SVG viewBox that tightly fits all nodes with a uniform padding.
 *
 * @param {{ x: number; y: number; w: number; h: number }[]} nodes - Node descriptors.
 * @returns {{ x: number; y: number; w: number; h: number }} ViewBox in graph coordinates.
 */
function computeSvgViewBox(nodes) {
  const PADDING = 40;
  if (!nodes.length) {
    return { x: 0, y: 0, w: 400, h: 300 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.w / 2);
    minY = Math.min(minY, n.y - n.h / 2);
    maxX = Math.max(maxX, n.x + n.w / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  }
  return {
    x: minX - PADDING,
    y: minY - PADDING,
    w: maxX - minX + PADDING * 2,
    h: maxY - minY + PADDING * 2,
  };
}

/**
 * Builds SVG line/text markup for the given edges.
 *
 * @param {{ x1: number; y1: number; x2: number; y2: number; label: string; color: string }[]} edges -
 *   Edge descriptors.
 * @returns {string} SVG markup string.
 */
function buildSvgEdgeMarkup(edges) {
  let result = '';
  for (const e of edges) {
    result += `  <line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${e.color}" stroke-width="2" />\n`;
    if (e.label) {
      const midX = (e.x1 + e.x2) / 2;
      const midY = (e.y1 + e.y2) / 2;
      result += `  <text x="${midX}" y="${midY}" fill="#fff" font-size="10" text-anchor="middle" style="pointer-events: none;">${escapeXml(e.label)}</text>\n`;
    }
  }
  return result;
}

/**
 * Builds SVG markup for the given nodes.
 *
 * @param {{
 *   x: number;
 *   y: number;
 *   w: number;
 *   h: number;
 *   shape: string;
 *   color: string;
 *   label: string;
 * }[]} nodes
 *   - Node descriptors.
 * @returns {string} SVG markup for nodes.
 */
function buildSvgNodeMarkup(nodes) {
  let svg = '';
  for (const n of nodes) {
    const halfW = n.w / 2,
      halfH = n.h / 2;
    svg +=
      n.shape === 'ellipse' || n.shape === 'roundrectangle'
        ? `  <ellipse cx="${n.x}" cy="${n.y}" rx="${halfW}" ry="${halfH}" fill="${n.color}" stroke="#333" stroke-width="1" />\n`
        : `  <rect x="${n.x - halfW}" y="${n.y - halfH}" width="${n.w}" height="${n.h}" fill="${n.color}" stroke="#333" stroke-width="1" rx="4" />\n`;
    if (n.label) {
      svg += `  <text x="${n.x}" y="${n.y}" fill="#fff" font-size="10" text-anchor="middle" dominant-baseline="middle" style="pointer-events: none;">${escapeXml(n.label)}</text>\n`;
    }
  }
  return svg;
}

/**
 * Computes the legend position and updates the viewBox for SVG export.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Currently visible graph elements.
 * @param {boolean} includeLegend - Whether to include a legend.
 * @param {{ x: number; y: number; w: number; h: number }} vb - ViewBox object (will be modified if
 *   legend overflows).
 * @returns {{
 *   legendGraphPos: { x: number; y: number } | undefined;
 *   vb: { x: number; y: number; w: number; h: number };
 * }}
 *   Legend position and expanded viewBox.
 */
function computeSvgLegendLayout(cy, visibleElements, includeLegend, vb) {
  let legendGraphPos;
  if (includeLegend) {
    legendGraphPos = getLegendGraphPosition(cy);
    if (legendGraphPos) {
      const lines = buildLegendLines(visibleElements);
      if (lines.length) {
        const { width: lw, height: lh } = computeLegendSize(
          lines,
          (text, size) => text.length * size * 0.58,
          1,
        );
        const legX2 = legendGraphPos.x + lw,
          legY2 = legendGraphPos.y + lh;
        if (legendGraphPos.x < vb.x) {
          vb.w += vb.x - legendGraphPos.x;
          vb.x = legendGraphPos.x;
        }
        if (legendGraphPos.y < vb.y) {
          vb.h += vb.y - legendGraphPos.y;
          vb.y = legendGraphPos.y;
        }
        if (legX2 > vb.x + vb.w) {
          vb.w = legX2 - vb.x;
        }
        if (legY2 > vb.y + vb.h) {
          vb.h = legY2 - vb.y;
        }
      }
    }
  }
  return { legendGraphPos, vb };
}

/**
 * Exports the entire graph as an SVG image. Uses graph (model) coordinates so all visible elements
 * are included regardless of the current pan/zoom. The legend, when enabled, is placed at the same
 * position it occupies on screen at the time of export. The viewBox is expanded when necessary to
 * keep the legend fully visible.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Currently visible graph elements.
 * @param {string} filename - Suggested download filename.
 * @param {boolean} includeLegend - Whether to include a legend group.
 */
function exportSVG(cy, visibleElements, filename, includeLegend) {
  const bgColor =
    getComputedStyle(document.documentElement).getPropertyValue('--cy-bg').trim() || '#12172b';
  const nodes = collectSvgNodes(cy);
  const edges = collectSvgEdges(cy);
  const vb = computeSvgViewBox(nodes);
  const { legendGraphPos, vb: expandedVb } = computeSvgLegendLayout(
    cy,
    visibleElements,
    includeLegend,
    vb,
  );
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${expandedVb.w}" height="${expandedVb.h}" viewBox="${expandedVb.x} ${expandedVb.y} ${expandedVb.w} ${expandedVb.h}" style="background-color: ${bgColor}">\n`;
  svg += buildSvgEdgeMarkup(edges);
  svg += buildSvgNodeMarkup(nodes);
  if (includeLegend) {
    svg += generateSvgLegend(
      visibleElements,
      legendGraphPos ?? { x: expandedVb.x, y: expandedVb.y },
    );
  }
  svg += `</svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  triggerDownload(blob, filename);
}

/**
 * Generates an SVG <g> element containing legend information at the given position. Layout and
 * typography exactly match the #graph-legend DOM overlay defined in app.css.
 *
 * @param {{ nodes: { type: string }[]; edges: object[] }} elements - Visible graph elements.
 * @param {{ x: number; y: number } | null} pos - Legend top-left position. Falls back to top-left
 *   corner when null.
 * @returns {string} SVG group markup.
 */
function generateSvgLegend(elements, pos) {
  const docStyle = getComputedStyle(document.documentElement);
  const surfaceColor = docStyle.getPropertyValue('--surface').trim() || '#16213e';
  const borderColor = docStyle.getPropertyValue('--border').trim() || '#2a3a5c';
  const mutedColor = docStyle.getPropertyValue('--text-muted').trim() || '#9aa0b0';

  const lines = buildLegendLines(elements);
  if (!lines.length) {
    return '';
  }

  const L = LEGEND;
  // SVG uses unscaled px (scale = 1). Approximate text width: avg char width ≈ 0.58× font-size.
  const { width: bgW, height: bgH } = computeLegendSize(
    lines,
    (text, size) => text.length * size * 0.58,
    1,
  );
  const ox = pos ? pos.x : L.padH;
  const oy = pos ? pos.y : L.padV;

  let g = `<g>\n`;
  g += `  <rect x="${ox}" y="${oy}" width="${bgW}" height="${bgH}" fill="${escapeXml(surfaceColor)}" stroke="${escapeXml(borderColor)}" stroke-width="1" rx="${L.radius}" />\n`;

  let y = oy + L.padV;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.isHeader) {
      if (i > 0) {
        y += L.sectionGap;
      }
      const letterSpacing = (0.05 * L.headerFont).toFixed(2);
      g += `  <text x="${ox + L.padH}" y="${y + L.headerFont}" fill="${escapeXml(mutedColor)}" font-family="Segoe UI, system-ui, sans-serif" font-size="${L.headerFont}" letter-spacing="${letterSpacing}" style="pointer-events: none;">${escapeXml(line.text)}</text>\n`;
      y += L.headerH;
    } else {
      const midY = y + L.rowH / 2;
      g += `  <circle cx="${ox + L.padH + L.dotSize / 2}" cy="${midY}" r="${L.dotSize / 2}" fill="${escapeXml(line.color)}" />\n`;
      g += `  <text x="${ox + L.padH + L.dotSize + L.dotGap}" y="${midY}" fill="${escapeXml(mutedColor)}" font-family="Segoe UI, system-ui, sans-serif" font-size="${L.rowFont}" dominant-baseline="middle" style="pointer-events: none;">${escapeXml(line.text)}</text>\n`;
      y += L.rowH;
    }
  }
  g += `</g>`;
  return g;
}

/**
 * Triggers a browser download of the given blob with the specified filename.
 *
 * @param {Blob} blob - The data to download.
 * @param {string} filename - The suggested filename for the download.
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  // Remove anchor immediately but keep URL alive briefly to ensure download starts
  a.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Escapes XML special characters.
 *
 * @param {string} str - The string to escape.
 * @returns {string} The XML-safe string.
 */
function escapeXml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
