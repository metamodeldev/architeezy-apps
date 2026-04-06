/**
 * SVG export functionality.
 *
 * @module graph-export/svg
 * @package
 */

import { elemColor, relColor } from '../palette.js';
import { triggerDownload } from './common.js';
import { getLegendGraphPosition } from './legend-utils.js';

// CSS-matched legend layout constants (values in CSS px; multiply by scale for HiDPI).
// Source: #graph-legend, .legend-section-label, .legend-row, .legend-dot in app.css.
const LEGEND = {
  padH: 10,
  padV: 8,
  headerFont: 10.4,
  headerH: 13,
  sectionGap: 6,
  rowFont: 12,
  rowH: 16,
  dotSize: 10,
  dotGap: 6,
  radius: 6,
};

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

function collectSvgNodes(cy) {
  const nodes = [];
  for (const node of cy.nodes(':visible')) {
    const pos = node.position();
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

function collectSvgEdges(cy) {
  const edges = [];
  for (const edge of cy.edges(':visible')) {
    const src = edge.source();
    const tgt = edge.target();
    if (!src.length || !tgt.length) {
      continue;
    }
    const srcPos = src.position();
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

function escapeXml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Exports the entire graph as an SVG image.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Currently visible graph elements.
 * @param {string} filename - Suggested download filename.
 * @param {boolean} includeLegend - Whether to include a legend group.
 */
export function exportSVG(cy, visibleElements, filename, includeLegend) {
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
