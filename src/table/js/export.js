// ── EXPORT ──────────────────────────────────────────────────────────────────
//
// Converts a computeMatrix() result into a 2-D string array, then
// Downloads as CSV or copies as tab-separated text.
//
// Result shape:
//   { rowAxis: { numGroupLevels, flatRows },
//     ColAxis: { numGroupLevels, flatRows },
//     Grid }
//
// FlatRow = { groups: [{ elem, span, first }]*, leafElem }

/**
 * Builds a 2-D array of strings representing the full matrix.
 *
 * @param {object} result - ComputeMatrix() result.
 * @returns {string[][]} 2-D array of cell strings, with column headers in the
 * first rows.
 */
export function buildTable(result) {
  const { rowAxis, colAxis, grid } = result;
  const { numGroupLevels: rgLevels, flatRows } = rowAxis;
  const { numGroupLevels: cgLevels, flatRows: flatCols } = colAxis;

  const rowHdrCols = rgLevels + 1;
  const colHdrRows = cgLevels + 1;
  const rows = [];

  // Column header rows
  for (let g = 0; g < colHdrRows; g++) {
    const row = Array.from({ length: rowHdrCols }, () => '');
    if (g === cgLevels) {
      // Leaf row: column element names
      for (const col of flatCols) {
        row.push(col.leafElem.name);
      }
    } else {
      // Group row: group name for first occurrence, blank for rest
      for (let ci = 0; ci < flatCols.length; ci++) {
        const grp = flatCols[ci].groups[g];
        row.push(grp?.first ? (grp.elem?.name ?? '—') : '');
      }
    }
    rows.push(row);
  }

  // Data rows
  for (let ri = 0; ri < flatRows.length; ri++) {
    const flatRow = flatRows[ri];
    const dataRow = [];
    for (let g = 0; g < rgLevels; g++) {
      const grp = flatRow.groups[g];
      dataRow.push(grp?.first ? (grp.elem?.name ?? '—') : '');
    }
    dataRow.push(flatRow.leafElem.name);
    for (const val of grid[ri]) {
      dataRow.push(val ?? '');
    }
    rows.push(dataRow);
  }

  return rows;
}

export function exportCsv(result, name) {
  const table = buildTable(result);
  const csvRows = table.map((row) =>
    row
      .map((cell) => {
        const s = String(cell ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replaceAll('"', '""')}"`
          : s;
      })
      .join(','),
  );
  const blob = new Blob([`\uFEFF${csvRows.join('\r\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${(name || 'matrix').replaceAll(/[^a-zA-Z0-9_\-а-яА-Я ]/g, '_')}-${date}.csv`;
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

export async function copyToClipboard(result) {
  const table = buildTable(result);
  await navigator.clipboard.writeText(table.map((r) => r.join('\t')).join('\r\n'));
}
