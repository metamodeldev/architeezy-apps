/**
 * PNG export functionality.
 *
 * @module graph-export/png
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

  function measureText(text, size) {
    ctx.font = `${size}px "Segoe UI", system-ui, sans-serif`;
    return ctx.measureText(text).width || 0;
  }

  const { width: bgW, height: bgH } = computeLegendSize(lines, measureText, scale);
  const ox = pos ? pos.x : L.padH * scale;
  const oy = pos ? pos.y : L.padV * scale;

  ctx.fillStyle = surfaceColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = scale;
  ctx.beginPath();
  ctx.roundRect(ox, oy, bgW, bgH, L.radius * scale);
  ctx.fill();
  ctx.stroke();

  renderLegendLines(ctx, lines, L, ox, oy, scale, headerLetterSpacing, mutedColor);
}

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

/**
 * Exports the entire graph as a PNG image with optional legend overlay.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {{ nodes: object[]; edges: object[] }} visibleElements - Currently visible graph elements.
 * @param {boolean} includeLegend - Whether to draw a legend overlay.
 * @param {string} filename - Suggested download filename.
 */
export async function exportPNG(cy, visibleElements, includeLegend, filename) {
  const bgColor =
    getComputedStyle(document.documentElement).getPropertyValue('--cy-bg').trim() || '#12172b';
  const scale = 2;
  const bb = cy.elements().boundingBox();
  const pngBlob = await cy.png({ scale, full: true, bg: bgColor, output: 'blob' });
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
