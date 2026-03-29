// ── IMAGE EXPORT ─────────────────────────────────────────────────────────────
//
// Provides PNG and SVG export of the current graph view with optional legend.
// Follows the same pattern as table.js for CSV export.

import { getCy, getVisibleElements, getViewportBounds } from './graph.js';
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
 * Main entry point for graph image export.
 *
 * @param {'png' | 'svg'} format - Image format.
 * @param {boolean} includeLegend - Whether to include a legend overlay.
 */
export async function exportGraphImage(format, includeLegend) {
  if (_isExporting) {
    return;
  }
  _isExporting = true;
  globalThis.updateExportButtonState?.(); // Disable button immediately

  const loadingEl = document.getElementById('export-loading');
  if (loadingEl) {
    loadingEl.classList.remove('hidden');
  }

  try {
    const cy = getCy();
    if (!cy) {
      showToast('Graph not ready');
      return;
    }

    const visibleElements = getVisibleElements();
    const modelNameEl = document.getElementById('current-model-name');
    const rawName = modelNameEl?.textContent.trim() || 'model';
    const sanitizedName = rawName.replaceAll(/[^\w\s-]/g, '').trim() || 'model';
    const timestamp = new Date().toISOString().replaceAll(/[:]/g, '-').slice(0, 19);
    const filename = `architeezy-${sanitizedName}-graph-${timestamp}.${format}`;

    if (format === 'png') {
      await exportPNG(cy, visibleElements, includeLegend, filename);
    } else if (format === 'svg') {
      exportSVG(cy, visibleElements, filename, includeLegend);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    showToast(`Graph exported as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Export failed', error);
    showToast('Export failed: ' + error.message);
  } finally {
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
    _isExporting = false;
    globalThis.updateExportButtonState?.();
  }
}

// ── PNG EXPORT ───────────────────────────────────────────────────────────────

/**
 * Exports the graph as a PNG image with optional legend overlay.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Currently visible graph elements.
 * @param {boolean} includeLegend - Whether to draw a legend overlay.
 * @param {string} filename - Suggested download filename.
 */
async function exportPNG(cy, visibleElements, includeLegend, filename) {
  const container = cy.container();
  const rect = container.getBoundingClientRect();
  const scale = 2;
  const width = Math.max(1, Math.floor(rect.width * scale));
  const height = Math.max(1, Math.floor(rect.height * scale));

  // Memory limit check (approx 100MB)
  if (width * height * 4 > 100 * 1024 * 1024) {
    throw new Error('Canvas too large for PNG export');
  }

  const bgColor =
    getComputedStyle(document.documentElement).getPropertyValue('--cy-bg').trim() || '#12172b';

  // Get PNG blob from Cytoscape
  const pngBlob = cy.png({
    scale,
    full: true, // Viewport only
    bg: bgColor,
    output: 'blob',
  });

  const img = await createImageBitmap(pngBlob);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Draw background and graph image
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // Overlay legend if requested
  if (includeLegend) {
    drawLegend(ctx, visibleElements, width, height, scale);
  }

  // oxlint-disable-next-line promise/avoid-new
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  triggerDownload(blob, filename);
}

/**
 * Builds the list of legend line descriptors for the given visible elements.
 *
 * @param {{ nodes: { type: string }[]; edges: object[] }} elements - Visible graph elements.
 * @returns {{
 *   text: string;
 *   bold?: boolean;
 *   small?: boolean;
 *   color?: string;
 *   isSwatch?: boolean;
 * }[]}
 *   Legend lines.
 */
function buildLegendLines(elements) {
  const lines = [];
  const modelNameEl = document.getElementById('current-model-name');
  lines.push({ text: modelNameEl?.textContent.trim() || '', bold: true });
  lines.push({ text: new Date().toLocaleString(), small: true });
  lines.push({
    text: `Visible: ${elements.nodes.length} nodes, ${elements.edges.length} edges`,
    small: true,
  });
  const nodeTypeCounts = {};
  for (const n of elements.nodes) {
    const t = n.type;
    nodeTypeCounts[t] = (nodeTypeCounts[t] || 0) + 1;
  }
  for (const [type, count] of Object.entries(nodeTypeCounts)) {
    lines.push({ text: `${type}: ${count}`, color: elemColor(type), isSwatch: true });
  }
  return lines;
}

/**
 * Draws a legend overlay in the bottom-left corner of the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context.
 * @param {{ nodes: { type: string }[]; edges: object[] }} elements - Visible graph elements.
 * @param {number} width - Canvas width in pixels.
 * @param {number} height - Canvas height in pixels.
 * @param {number} scale - Device pixel ratio scale factor.
 */
function drawLegend(ctx, elements, width, height, scale) {
  const padding = 12 * scale;
  const lineHeight = 16 * scale;
  const fontSize = 12 * scale;
  const boxSize = 10 * scale;
  const legendX = padding;
  const legendY = height - padding - lineHeight * 2;

  const lines = buildLegendLines(elements);

  // Measure approximate width
  ctx.font = `${fontSize}px "Segoe UI", system-ui, sans-serif`;
  let maxWidth = 0;
  for (const line of lines) {
    const metrics = ctx.measureText(line.text);
    const lineWidth = (metrics.width || 0) + (line.isSwatch ? boxSize + 6 : 0);
    if (lineWidth > maxWidth) {
      maxWidth = lineWidth;
    }
  }

  const bgWidth = maxWidth + padding * 2;
  const bgHeight = lines.length * lineHeight + padding * 2;

  // Draw semi-transparent background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(legendX - padding, legendY - padding, bgWidth, bgHeight);

  // Draw each line
  let y = legendY;
  for (const line of lines) {
    let x = legendX;
    if (line.isSwatch) {
      ctx.fillStyle = line.color;
      ctx.fillRect(x, y, boxSize, lineHeight - 4);
      x += boxSize + 6;
    }
    ctx.fillStyle = line.bold ? '#fff' : line.small ? '#ccc' : '#fff';
    ctx.font = line.bold
      ? `bold ${fontSize}px "Segoe UI", system-ui, sans-serif`
      : `${fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(line.text, x, y + (lineHeight - fontSize) / 2);
    y += lineHeight;
  }
}

// ── SVG EXPORT ───────────────────────────────────────────────────────────────

/**
 * Collects rendered node data from the Cytoscape instance.
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
 *   Node descriptors.
 */
function collectSvgNodes(cy) {
  const nodes = [];
  for (const node of cy.nodes(':visible')) {
    const pos = node.renderedPosition();
    const type = node.data('type');
    nodes.push({
      x: pos.x,
      y: pos.y,
      w: node.outerWidth(),
      h: node.outerHeight(),
      type,
      label: node.data('label') || node.data('name') || '',
      color: elemColor(type),
      shape: node.style('shape') || 'ellipse',
    });
  }
  return nodes;
}

/**
 * Collects rendered edge data from the Cytoscape instance.
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
 *   Edge descriptors.
 */
function collectSvgEdges(cy) {
  const edges = [];
  for (const edge of cy.edges(':visible')) {
    const src = edge.source();
    const tgt = edge.target();
    if (!src.length || !tgt.length) {
      continue;
    }
    const srcPos = src.renderedPosition();
    const tgtPos = tgt.renderedPosition();
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
 * Exports the graph as an SVG image (vector). Generates SVG manually by iterating visible elements.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Currently visible graph elements.
 * @param {string} filename - Suggested download filename.
 * @param {boolean} includeLegend - Whether to include a legend group.
 */
function exportSVG(cy, visibleElements, filename, includeLegend) {
  const bounds = getViewportBounds();
  if (bounds.width === 0 || bounds.height === 0) {
    throw new Error('Cannot determine viewport size for SVG export');
  }

  const { width, height } = bounds;
  const bgColor =
    getComputedStyle(document.documentElement).getPropertyValue('--cy-bg').trim() || '#12172b';

  const nodes = collectSvgNodes(cy);
  const edges = collectSvgEdges(cy);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: ${bgColor}">\n`;

  // Edges first (under nodes)
  svg += buildSvgEdgeMarkup(edges);

  // Nodes
  for (const n of nodes) {
    const x = n.x;
    const y = n.y;
    const halfW = n.w / 2;
    const halfH = n.h / 2;
    if (n.shape === 'ellipse' || n.shape === 'roundrectangle') {
      svg += `  <ellipse cx="${x}" cy="${y}" rx="${halfW}" ry="${halfH}" fill="${n.color}" stroke="#333" stroke-width="1" />\n`;
    } else {
      const rx = 4;
      const rectX = x - halfW;
      const rectY = y - halfH;
      svg += `  <rect x="${rectX}" y="${rectY}" width="${n.w}" height="${n.h}" fill="${n.color}" stroke="#333" stroke-width="1" rx="${rx}" />\n`;
    }
    if (n.label) {
      svg += `  <text x="${x}" y="${y}" fill="#fff" font-size="10" text-anchor="middle" dominant-baseline="middle" style="pointer-events: none;">${escapeXml(n.label)}</text>\n`;
    }
  }

  if (includeLegend) {
    svg += generateSvgLegend(visibleElements, width, height);
  }

  svg += `</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  triggerDownload(blob, filename);
}

/**
 * Generates an SVG <g> element containing legend information.
 *
 * @param {{ nodes: { type: string }[]; edges: object[] }} elements - Visible graph elements.
 * @param {number} width - SVG canvas width in pixels.
 * @param {number} height - SVG canvas height in pixels.
 * @returns {string} SVG group markup.
 */
function generateSvgLegend(elements, width, height) {
  const padding = 12;
  const lineHeight = 16;
  const fontSize = 12;
  const boxSize = 10;
  const legendX = padding;
  const legendY = height - padding - lineHeight * 2;

  const lines = buildLegendLines(elements);

  // Approximate max width (simple monospace estimate)
  let maxWidth = 0;
  for (const line of lines) {
    const approx = line.text.length * (fontSize * 0.6) + (line.isSwatch ? boxSize + 6 : 0);
    if (approx > maxWidth) {
      maxWidth = approx;
    }
  }

  const bgWidth = maxWidth + padding * 2;
  const bgHeight = lines.length * lineHeight + padding * 2;

  let g = `<g transform="translate(${legendX}, ${legendY})">\n`;
  g += `  <rect x="0" y="0" width="${bgWidth}" height="${bgHeight}" fill="rgba(0,0,0,0.6)" rx="4" />\n`;

  let y = padding;
  for (const line of lines) {
    let x = padding;
    if (line.isSwatch) {
      g += `  <rect x="${x}" y="${y}" width="${boxSize}" height="${lineHeight - 4}" fill="${line.color}" />\n`;
      x += boxSize + 6;
    }
    const fill = line.bold ? '#fff' : line.small ? '#ccc' : '#fff';
    const fontWeight = line.bold ? 'bold' : 'normal';
    const size = line.small ? fontSize - 2 : fontSize;
    g += `  <text x="${x}" y="${y + (lineHeight - size) / 2}" fill="${fill}" font-family="Segoe UI, system-ui, sans-serif" font-size="${size}" font-weight="${fontWeight}" style="pointer-events: none;">${escapeXml(line.text)}</text>\n`;
    y += lineHeight;
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
