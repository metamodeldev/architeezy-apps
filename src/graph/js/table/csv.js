/**
 * CSV export for table data.
 *
 * @module table/csv
 * @package
 */

import { t } from '../i18n.js';
import { getAllElements } from '../model/index.js';
import { getCurrentView, showToast } from '../ui/index.js';

/**
 * Escapes a CSV field according to RFC 4180.
 *
 * @param {string} field - The value to escape.
 * @returns {string} The escaped CSV field string.
 */
function escapeCsvField(field) {
  if (field === undefined) {
    return '';
  }
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

/** Updates the disabled state of the Export CSV button based on current view and model presence. */
export function updateExportButtonState() {
  const btn = document.getElementById('export-csv-btn');
  if (!btn) {
    return;
  }
  const inTableView = getCurrentView() === 'table';
  const hasModel = getAllElements().length > 0;
  btn.disabled = !(inTableView && hasModel);
}

/**
 * Builds a CSV blob from the given headers and rows and triggers a browser download.
 *
 * @param {string[]} headers - Column header labels.
 * @param {string[][]} rows - Table row data.
 * @param {string} type - Export type label used in the filename.
 */
function buildAndDownloadCsv(headers, rows, type) {
  const csvContent = [
    headers.map((h) => escapeCsvField(h)).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvField(cell)).join(',')),
  ].join('\n');
  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const modelName =
    document.getElementById('current-model-name').textContent.replaceAll(/[^\w\s-]/g, '') ||
    'model';
  // Format timestamp as YYYYMMDD-HHMMSS
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '');
  const timePart = now.toTimeString().slice(0, 8).replaceAll(':', '');
  const timestamp = `${datePart}-${timePart}`;
  a.download = `${modelName}-${type}-${timestamp}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Exports the currently visible table data as a CSV file. */
export async function exportCSV() {
  const btn = document.getElementById('export-csv-btn');
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

  try {
    // Verify we are in table view
    if (getCurrentView() !== 'table') {
      showToast(t('switchToTableView'));
      return;
    }

    // Determine active tab (elements or relationships) for filename
    const activeTabBtn = document.querySelector('.table-tab-btn.active');
    const activeTab = activeTabBtn?.dataset.tab || 'elements';
    const type = activeTab === 'elements' ? 'entities' : 'relationships';

    // Get headers from table head (exclude sort icons)
    const headerCells = document.querySelectorAll('#table-head th');
    const headers = [...headerCells].map((th) => {
      // Clone the element to avoid mutating the DOM, then remove any sort icon
      const clone = th.cloneNode(true);
      const icon = clone.querySelector('.sort-icon');
      if (icon) {
        icon.remove();
      }
      return clone.textContent.trim();
    });

    // Get data rows from table body
    const rows = [];
    for (const tr of document.querySelectorAll('#table-body tr')) {
      const cells = [...tr.querySelectorAll('td')].map((td) => td.textContent.trim());
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    buildAndDownloadCsv(headers, rows, type);
  } catch (error) {
    console.error('Export failed', error);
    showToast(t('exportFailed') + ': ' + error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }
}
