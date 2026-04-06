/**
 * Graph export functionality.
 *
 * Coordinates PNG and SVG exports.
 *
 * @module graph-export/exporter
 * @package
 */

import { getCy, getLegendEnabled, getVisibleElements, isGraphBuilt } from '../graph/index.js';
import { t } from '../i18n.js';
import { showToast } from '../notification/index.js';
import { signal, effect } from '../signals/index.js';
import { exportPNG } from './png.js';
import { exportSVG } from './svg.js';

const _isExporting = signal(false);

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
 * Prepares the export button by setting loading state.
 *
 * @param {HTMLButtonElement} btn - Export button element.
 * @returns {Promise<void>}
 */
async function prepareExportButton(btn) {
  btn.classList.add('loading');
  // eslint-disable-next-line promise/avoid-new
  await new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
  btn.disabled = true;
  // eslint-disable-next-line promise/avoid-new
  await new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

/**
 * Performs the actual graph export.
 *
 * @param {import('cytoscape').Core} cy - Cytoscape instance.
 * @param {Array} visibleElements - Visible graph elements.
 * @param {'png' | 'svg'} format - Export format.
 * @param {string} filename - Output filename.
 * @param {boolean} includeLegend - Whether to include legend.
 */
async function performExport(cy, visibleElements, format, filename, includeLegend) {
  if (format === 'png') {
    await exportPNG(cy, visibleElements, includeLegend, filename);
  } else if (format === 'svg') {
    exportSVG(cy, visibleElements, filename, includeLegend);
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Main entry point for graph image export.
 *
 * @param {'png' | 'svg'} format - Image format.
 */
export async function exportGraphImage(format) {
  const includeLegend = getLegendEnabled();
  if (_isExporting.value) {
    return;
  }
  _isExporting.value = true;

  const btn = document.getElementById('export-image-btn');
  if (btn) {
    await prepareExportButton(btn);
  }

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

    await performExport(cy, visibleElements, format, filename, includeLegend);
  } catch (error) {
    console.error('Export failed', error);
    showToast(t('exportFailed') + ': ' + error.message);
  } finally {
    _isExporting.value = false;
    if (btn) {
      btn.classList.remove('loading');
    }
  }
}

// ── EXPORT EVENTS ───────────────────────────────────────────────────────────

/** Wires image export button events. */
export function wireExportEvents() {
  const exportImageBtn = document.getElementById('export-image-btn');
  const exportDropdown = document.getElementById('export-dropdown');

  if (exportImageBtn && exportDropdown) {
    exportImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportDropdown.classList.toggle('hidden');
    });
  }

  document.getElementById('export-png-btn')?.addEventListener('click', async () => {
    exportDropdown?.classList.add('hidden');
    await exportGraphImage('png');
  });

  document.getElementById('export-svg-btn')?.addEventListener('click', async () => {
    exportDropdown?.classList.add('hidden');
    await exportGraphImage('svg');
  });

  document.addEventListener('click', () => {
    if (exportDropdown) {
      exportDropdown.classList.add('hidden');
    }
  });
}

// Reactively update the export button when graph-built state or exporting flag changes.
// The button is visually hidden by view/ when not in graph view, so no view check is needed here.
effect(() => {
  const btn = document.getElementById('export-image-btn');
  if (!btn) {
    return;
  }
  btn.disabled = !(isGraphBuilt() && !_isExporting.value);
});
