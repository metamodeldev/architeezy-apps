// ── TABLE RENDERING ───────────────────────────────────────────────────
//
// Renders a computeMatrix() result into #table-wrap.
//
// Supports arbitrary depth:
//   NumGroupLevels group header columns (rows) / rows (columns),
//   Each sticky-positioned at a fixed width offset.
//
// Result shape (from compute.js):
//   { rowAxis: { numGroupLevels, flatRows }, colAxis: { numGroupLevels, flatRows },
//     Grid, qualIdx, stats }
//
// FlatRow = { groups: [{ elem, span, first }]*, leafElem }
// Grid[ri][ci] = display string for cell (ri, ci)
// QualIdx: Map `${ri}::${ci}` → qualifying Relation[]

import { buildCompactDisplayRows } from './compact.js';
import { nodeLabel } from './compute.js';
import { t } from './i18n.js';
import { isDefReady } from './matrix.js';
import { computeGroupRowSpan } from './tabular.js';
import { escHtml } from './utils.js';

// Width per group-header column/row in pixels (CSS must match)
const GRP_W = 120;
const LEAF_W = 160;

// ── POPOVER ──────────────────────────────────────────────────────────────────

function closePopover() {
  document.getElementById('cell-popover')?.remove();
}

function showPopover(anchorEl, quals, rowElem, colElem) {
  closePopover();
  const pop = document.createElement('div');
  pop.id = 'cell-popover';
  pop.className = 'cell-popover';

  const title = `${escHtml(nodeLabel(rowElem))} × ${escHtml(nodeLabel(colElem))}`;

  // Quals can be Element[] (from data items) or Relation[] (legacy)
  const areElements = quals.length > 0 && !quals[0].source && !quals[0]._isRel;
  const body = !quals.length
    ? `<div class="pop-empty">${t('noRelationships')}</div>`
    : quals
        .map((item) => {
          const label = nodeLabel(item);
          const showName = label && label !== item.type;
          return areElements
            ? `<div class="pop-rel">
            <span class="pop-type">${escHtml(item.type)}</span>
            ${showName ? `<span class="pop-name">${escHtml(label)}</span>` : ''}
           </div>`
            : `<div class="pop-rel">
            <span class="pop-dir">→</span>
            <span class="pop-type">${escHtml(item.type)}</span>
            ${showName ? `<span class="pop-name">${escHtml(label)}</span>` : ''}
           </div>`;
        })
        .join('');

  pop.innerHTML = `
    <div class="pop-header">
      <span class="pop-title">${title}</span>
      <button class="pop-close" onclick="document.getElementById('cell-popover').remove()">✕</button>
    </div>
    <div class="pop-body">${body}</div>`;

  document.body.append(pop);

  const rect = anchorEl.getBoundingClientRect();
  const pw = 280;
  const left = Math.min(rect.left + rect.width / 2 - pw / 2, window.innerWidth - pw - 8);
  pop.style.left = `${Math.max(8, left)}px`;
  pop.style.top = `${rect.bottom + 6}px`;

  setTimeout(() => document.addEventListener('click', closePopover, { once: true }), 0);
}

// ── EXPAND / COLLAPSE HELPERS ────────────────────────────────────────────────

function hideRowAnimated(tr, onComplete) {
  tr.style.transition = 'opacity 0.15s ease';
  tr.style.opacity = '0';
  setTimeout(() => {
    tr.style.display = 'none';
    tr.style.opacity = '';
    tr.style.transition = '';
    onComplete?.();
  }, 150);
}

function showRowAnimated(tr) {
  tr.style.opacity = '0';
  tr.style.display = '';
  // Two rAF so the initial opacity:0 is rendered before the transition starts.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      tr.style.transition = 'opacity 0.15s ease';
      tr.style.opacity = '';
      setTimeout(() => (tr.style.transition = ''), 160);
    }),
  );
}

function _snapshotFirstRow(rows) {
  const leafTh0 = rows[0].querySelector('th.table-row-leaf');
  const tds0 = [...rows[0].querySelectorAll('td.table-cell')];
  const savedLeaf = leafTh0
    ? { text: leafTh0.textContent, title: leafTh0.title, cls: leafTh0.className }
    : undefined;
  const savedTds = tds0.map((td) => ({ text: td.textContent, cls: td.className }));
  return { leafTh0, tds0, savedLeaf, savedTds };
}

/**
 * Attaches expand/collapse toggle to a tabular group header cell. Clicking anywhere on the cell
 * toggles the group.
 *
 * When collapsing: rows[0] is kept visible but its leaf th + data tds are replaced with subtotal
 * row content (if subtotals exist) or blanked out. rowSpan is reduced to 1 only after the hide
 * animation completes, which prevents layout jitter during the transition.
 *
 * @param {HTMLElement} th — the group header <th> with rowSpan > 1
 * @param {HTMLElement[]} rows — all <tr> elements belonging to this group
 */
function attachTabularToggle(th, rows) {
  const btn = document.createElement('button');
  btn.className = 'table-toggle';
  btn.setAttribute('aria-label', 'collapse');
  btn.textContent = '▼';
  th.prepend(btn);
  th.classList.add('table-expandable');

  // Store the rows on the th so ancestor toggles can recompute their own rowSpan.
  th._toggleRows = rows;

  let collapsed = false;
  // Saved spans of inner group headers (deeper levels) in rows[0] — populated at
  // Collapse time to preserve their own collapsed state when the outer group expands.
  let savedInnerThs = [];
  let savedInnerSpans = [];

  // Depth level of this group header from its CSS class (table-row-group-{g}).
  const thLevelMatch = th.className.match(/table-row-group-(\d+)/);
  const thLevel = thLevelMatch ? Number.parseInt(thLevelMatch[1], 10) : 0;

  // Find subtotal row: last row if it contains any .table-subtotal or .table-total cell.
  const lastRow = rows[rows.length - 1];
  const subtotalRow =
    rows.length > 1 && lastRow.querySelector('.table-subtotal, .table-total') ? lastRow : undefined;

  // Snapshot content cells of rows[0] for restoration on expand.
  const { leafTh0, tds0, savedLeaf, savedTds } = _snapshotFirstRow(rows);

  /** Updates rowSpans for every ancestor group header (shallower levels) in rows[0]. */
  function updateAncestorRowSpans() {
    for (const grpTh of rows[0].querySelectorAll('th.table-row-group')) {
      const m = grpTh.className.match(/table-row-group-(\d+)/);
      if (m && Number.parseInt(m[1], 10) < thLevel && grpTh._toggleRows) {
        grpTh.rowSpan = computeGroupRowSpan(grpTh._toggleRows);
      }
    }
  }

  function collapseGroup() {
    // Snapshot inner group headers in rows[0] at DEEPER levels only, then set them to
    // RowSpan=1. Without this, cells with rowSpan>1 overflow into rows below the group.
    savedInnerThs = [...rows[0].querySelectorAll('th.table-row-group')].filter((el) => {
      const m = el.className.match(/table-row-group-(\d+)/);
      return m ? Number.parseInt(m[1], 10) > thLevel : false;
    });
    savedInnerSpans = savedInnerThs.map((el) => el.rowSpan);

    // Update rows[0] content: subtotal values or blank.
    if (subtotalRow) {
      const subLeafTh = subtotalRow.querySelector('th.table-row-leaf');
      const subTds = [...subtotalRow.querySelectorAll('td.table-cell')];
      if (leafTh0 && subLeafTh) {
        leafTh0.textContent = subLeafTh.textContent;
        leafTh0.title = subLeafTh.title;
        leafTh0.className = subLeafTh.className;
      }
      for (let i = 0; i < tds0.length; i++) {
        const s = subTds[i];
        if (s) {
          tds0[i].textContent = s.textContent;
          tds0[i].className = s.className;
        }
      }
    } else {
      if (leafTh0) {
        leafTh0.textContent = '';
        leafTh0.title = '';
      }
      for (const td of tds0) {
        td.textContent = '';
        td.className = 'table-cell';
      }
    }

    // Animate hide rows[1..n]; update rowSpans only after all rows are hidden.
    let pending = rows.length - 1;
    // eslint-disable-next-line func-style
    const finalize = () => {
      th.rowSpan = computeGroupRowSpan(rows);
      for (const el of savedInnerThs) {
        el.rowSpan = 1;
      }
      updateAncestorRowSpans();
    };
    if (pending === 0) {
      finalize();
    } else {
      for (const row of rows.slice(1)) {
        // oxlint-disable-next-line no-loop-func
        hideRowAnimated(row, () => {
          if (--pending === 0) {
            finalize();
          }
        });
      }
    }
  }

  function expandGroup() {
    // Make rows visible in the layout (opacity:0, not yet painted) so that
    // ComputeGroupRowSpan counts them correctly when updating ancestor rowSpans.
    for (let i = 1; i < rows.length; i++) {
      rows[i].style.opacity = '0';
      rows[i].style.display = '';
    }

    th.rowSpan = computeGroupRowSpan(rows);
    // Restore inner group rowSpans to their saved values (preserving their own
    // Collapsed/expanded state rather than just using their current row visibility).
    for (let i = 0; i < savedInnerThs.length; i++) {
      savedInnerThs[i].rowSpan = savedInnerSpans[i];
    }
    updateAncestorRowSpans();

    // Restore rows[0] original content.
    if (leafTh0 && savedLeaf) {
      leafTh0.textContent = savedLeaf.text;
      leafTh0.title = savedLeaf.title;
      leafTh0.className = savedLeaf.cls;
    }
    for (let i = 0; i < tds0.length; i++) {
      const s = savedTds[i];
      if (s) {
        tds0[i].textContent = s.text;
        tds0[i].className = s.cls;
      }
    }

    for (let i = 1; i < rows.length; i++) {
      showRowAnimated(rows[i]);
    }
  }

  th.addEventListener('click', () => {
    collapsed = !collapsed;
    btn.textContent = collapsed ? '▶' : '▼';
    btn.setAttribute('aria-label', collapsed ? 'expand' : 'collapse');
    if (collapsed) {
      collapseGroup();
    } else {
      expandGroup();
    }
  });
}

/**
 * Attaches expand/collapse toggle to a compact group row. Clicking anywhere on the header cell
 * collapses/expands children.
 *
 * @param {HTMLElement} groupTr — the <tr> for this compact group
 * @param {HTMLElement} th — the header <th> inside groupTr
 */
function attachCompactToggle(groupTr, th) {
  const btn = th.querySelector('.table-toggle');
  let collapsed = false;
  th.classList.add('table-expandable');
  th.addEventListener('click', () => {
    collapsed = !collapsed;
    if (btn) {
      btn.textContent = collapsed ? '▶' : '▼';
      btn.setAttribute('aria-label', collapsed ? 'expand' : 'collapse');
    }
    const indent = Number.parseInt(groupTr.dataset.compactIndent, 10);
    let sibling = groupTr.nextElementSibling;
    while (sibling) {
      const sibIndent = Number.parseInt(sibling.dataset.compactIndent, 10);
      if (!Number.isNaN(sibIndent) && sibIndent <= indent) {
        break;
      }
      if (collapsed) {
        hideRowAnimated(sibling);
      } else {
        showRowAnimated(sibling);
      }
      sibling = sibling.nextElementSibling;
    }
  });
}

// ── MAIN RENDER ──────────────────────────────────────────────────────────────

export function renderTable(result, def) {
  try {
    return _renderTable(result, def);
  } catch (error) {
    console.error('[table] renderTable error:', error);
    const wrap = document.getElementById('table-wrap');
    if (wrap) {
      wrap.innerHTML = `<div class="table-empty table-error">${error.message ?? String(error)}</div>`;
    }
    throw error;
  }
}

function _renderCompactColHeaderRow(tr, flatCols, displayCols) {
  for (let di = 0; di < displayCols.length; di++) {
    const drow = displayCols[di];
    const col = flatCols[drow.origIdx];
    const leaf = col.leafElem;
    const isGroup = drow.isGroupHeader;
    const indent = drow.indent;
    const th = document.createElement('th');
    const isTotal = leaf._isGrandTotal;
    th.className =
      'table-col-compact' +
      (isGroup ? ' table-compact-group-col' : '') +
      (leaf._isSubtotal && !isGroup ? ' table-subtotal' : '') +
      (isTotal ? ' table-total' : '');
    th.dataset.compactIndent = String(indent);

    const label = isGroup ? nodeLabel(leaf._groupRef) : nodeLabel(leaf);
    if (isGroup && !drow.noChildren) {
      const btn = document.createElement('button');
      btn.className = 'table-toggle table-toggle-col';
      btn.textContent = '▼';
      btn.setAttribute('aria-label', 'collapse');
      th.append(btn);
      th.dataset.colDisplayIdx = String(di);
    }
    const span = document.createElement('span');
    span.textContent = label;
    span.title = label;
    span.style.paddingLeft = `${indent * 16}px`;
    th.append(span);
    tr.append(th);
  }
}

function _renderTabularColHeaderRow(tr, flatCols, colGroupMap, g, cgLevels, colLeafHidden) {
  const isLeafRow = g === cgLevels; // Last header row = leaf

  if (isLeafRow && !colLeafHidden) {
    // Leaf column headers
    for (let ci = 0; ci < flatCols.length; ci++) {
      const th = document.createElement('th');
      th.className =
        'table-col-leaf' +
        (flatCols[ci].leafElem._isSubtotal ? ' table-subtotal' : '') +
        (flatCols[ci].leafElem._isGrandTotal ? ' table-total' : '');
      th.textContent = nodeLabel(flatCols[ci].leafElem);
      th.title = nodeLabel(flatCols[ci].leafElem);
      tr.append(th);
    }
  } else if (!isLeafRow) {
    // Group header row g – emit <th colspan=span> for each group's first appearance
    for (let ci = 0; ci < flatCols.length; ci++) {
      const grp = flatCols[ci].groups[g];
      if (!grp) {
        if (flatCols[ci].leafElem._isGrandTotal) {
          const th = document.createElement('th');
          th.className = 'table-col-group table-total';
          tr.append(th);
        }
        continue;
      }
      if (grp.first) {
        const th = document.createElement('th');
        th.colSpan = grp.span;
        th.className = `table-col-group table-col-group-${g}`;
        th.textContent = nodeLabel(grp.elem);
        th.title = nodeLabel(grp.elem);
        // Track for tabular toggle (only outer group level g=0)
        if (g === 0 && grp.span > 1) {
          colGroupMap.set(`${grp.elem.id}::${g}`, { th, colIndices: [] });
        }
        tr.append(th);
      }
      // Accumulate col indices for tabular group toggle
      colGroupMap.get(`${flatCols[ci].groups[0]?.elem?.id}::0`)?.colIndices.push(ci);
    }
  }
}

function _renderColumnHeaders(
  thead,
  flatCols,
  displayCols,
  colCompact,
  colHdrRows,
  rowHdrCols,
  rgLevels,
  rowCompact,
  rowLeafHidden,
  colLeafHidden,
  cgLevels,
) {
  // Map: colGroupKey → { th, colIndices } for tabular group toggle attachment
  const colGroupMap = new Map();

  for (let g = 0; g < colHdrRows; g++) {
    const tr = document.createElement('tr');

    if (g === 0) {
      // Corner cell spanning all header rows and all row-header columns
      const corner = document.createElement('th');
      corner.rowSpan = colHdrRows;
      corner.colSpan = rowHdrCols;
      corner.className = 'table-corner';
      corner.style.minWidth = rowCompact
        ? `${LEAF_W}px`
        : `${rgLevels * GRP_W + (rowLeafHidden ? 0 : LEAF_W)}px`;
      tr.append(corner);
    }

    if (colCompact) {
      // Single compact header row — one <th> per display col showing label with indent
      if (g === 0) {
        _renderCompactColHeaderRow(tr, flatCols, displayCols);
      }
    } else {
      _renderTabularColHeaderRow(tr, flatCols, colGroupMap, g, cgLevels, colLeafHidden);
    }

    thead.append(tr);
  }
}

function _makeCompactRowHeader(flatRow, drow, tr) {
  const leaf = flatRow.leafElem;
  const isGroup = drow.isGroupHeader;
  const indent = drow.indent;
  const isSubtotal = leaf._isSubtotal && !isGroup;
  const isTotal = leaf._isGrandTotal;

  tr.dataset.compactIndent = String(indent);

  const th = document.createElement('th');
  th.className =
    'table-row-compact' +
    (isGroup ? ' table-compact-group-row' : '') +
    (isSubtotal ? ' table-subtotal' : '') +
    (isTotal ? ' table-total' : '');
  th.style.left = '0px';
  th.style.paddingLeft = `${8 + indent * 20}px`;

  if (isGroup && !drow.noChildren) {
    const btn = document.createElement('button');
    btn.className = 'table-toggle';
    btn.setAttribute('aria-label', 'collapse');
    btn.textContent = '▼';
    th.append(btn);
    attachCompactToggle(tr, th);
  }

  const label = isGroup ? nodeLabel(leaf._groupRef) : nodeLabel(leaf);
  const span = document.createElement('span');
  span.textContent = label;
  span.title = label;
  th.append(span);
  tr.append(th);
}

function _makeTabularRowHeader(flatRow, tr, rgLevels, rowLeafHidden, rowGroupMap) {
  // Group header cells (one per group level)
  for (let g = 0; g < rgLevels; g++) {
    const grp = flatRow.groups[g];
    if (grp?.first) {
      const th = document.createElement('th');
      th.rowSpan = grp.span;
      th.className = `table-row-group table-row-group-${g}`;
      th.style.left = `${g * GRP_W}px`;
      th.textContent = nodeLabel(grp.elem);
      th.title = nodeLabel(grp.elem);
      tr.append(th);
      // Register group for toggle attachment
      const key = `${grp.elem.id}::${g}`;
      rowGroupMap.set(key, { th, rows: [tr] });
    } else if (grp) {
      // Add this tr to the existing group's row list
      const key = `${grp.elem.id}::${g}`;
      rowGroupMap.get(key)?.rows.push(tr);
    } else {
      // Promoted empty node or grand total — placeholder
      const th = document.createElement('th');
      th.className = `table-row-group table-row-group-${g}`;
      th.style.left = `${g * GRP_W}px`;
      tr.append(th);
    }
  }

  // Leaf row header (omitted when leaf level is hidden)
  if (!rowLeafHidden) {
    const leafTh = document.createElement('th');
    leafTh.className =
      'table-row-leaf' +
      (flatRow.leafElem._isSubtotal ? ' table-subtotal' : '') +
      (flatRow.leafElem._isGrandTotal ? ' table-total' : '');
    leafTh.style.left = `${rgLevels * GRP_W}px`;
    leafTh.textContent = nodeLabel(flatRow.leafElem);
    leafTh.title = nodeLabel(flatRow.leafElem);
    tr.append(leafTh);
  }
}

function _appendDataCells(tr, ri, flatRow, flatCols, displayCols, colCompact, drow, grid, qualIdx) {
  for (let di = 0; di < (colCompact ? displayCols.length : flatCols.length); di++) {
    const ci = colCompact ? displayCols[di].origIdx : di;
    const val = grid[ri][ci];
    const td = document.createElement('td');
    const leafElem = flatRow.leafElem;
    const isRowSubtotal = leafElem._isSubtotal && !drow.isGroupHeader;
    const isRowGroupHeader = drow.isGroupHeader;
    const isRowTotal = leafElem._isGrandTotal;
    const colLeaf = flatCols[ci].leafElem;
    const colDrow = colCompact ? displayCols[di] : undefined;
    const isColSubtotal = colLeaf._isSubtotal && !colDrow?.isGroupHeader;
    const isColGroupHeader = colDrow?.isGroupHeader ?? false;
    const isColTotal = colLeaf._isGrandTotal;
    if (colCompact) {
      td.dataset.compactColDisplayIdx = String(di);
    }
    td.className =
      'table-cell' +
      (val ? ' has-value' : '') +
      (isRowSubtotal || isColSubtotal || isRowGroupHeader || isColGroupHeader
        ? ' table-subtotal'
        : '') +
      (isRowTotal || isColTotal ? ' table-total' : '');
    td.textContent = val;

    const capturedRi = ri;
    const capturedCi = ci;
    const rowElem = flatRow.leafElem;
    const colElem = flatCols[capturedCi].leafElem;
    td.addEventListener('click', (e) => {
      e.stopPropagation();
      const rowKey = rowElem.id ?? capturedRi;
      const colKey = colElem.id ?? capturedCi;
      const rels = qualIdx.get(`${rowKey}::${colKey}`) ?? [];
      showPopover(td, rels, rowElem, colElem);
    });

    tr.append(td);
  }
}

function _renderDataRows(
  tbody,
  flatRows,
  flatCols,
  rowDisplayList,
  displayCols,
  rowCompact,
  colCompact,
  rgLevels,
  rowLeafHidden,
  grid,
  qualIdx,
) {
  // Map: rowGroupKey → { th, rows: tr[] } for tabular toggle attachment
  const rowGroupMap = new Map();

  for (const drow of rowDisplayList) {
    const ri = drow.origIdx;
    const flatRow = flatRows[ri];
    const tr = document.createElement('tr');

    if (rowCompact) {
      _makeCompactRowHeader(flatRow, drow, tr);
    } else {
      _makeTabularRowHeader(flatRow, tr, rgLevels, rowLeafHidden, rowGroupMap);
    }

    _appendDataCells(tr, ri, flatRow, flatCols, displayCols, colCompact, drow, grid, qualIdx);
    tbody.append(tr);
  }

  return rowGroupMap;
}

function _attachCompactColToggles(thead, tbody, displayCols) {
  const headerThs = [...thead.querySelectorAll('th[data-col-display-idx]')];
  const allTrs = [...tbody.querySelectorAll('tr')];

  for (const th of headerThs) {
    const di = Number.parseInt(th.dataset.colDisplayIdx, 10);
    const indent = Number.parseInt(th.dataset.compactIndent, 10);
    const btn = th.querySelector('.table-toggle-col');

    let collapsed = false;
    th.classList.add('table-expandable');
    th.addEventListener('click', () => {
      collapsed = !collapsed;
      if (btn) {
        btn.textContent = collapsed ? '▶' : '▼';
        btn.setAttribute('aria-label', collapsed ? 'expand' : 'collapse');
      }

      // Find subsequent display columns with deeper indent.
      const hideDisplayIdxs = [];
      for (let j = di + 1; j < displayCols.length; j++) {
        if (displayCols[j].indent <= indent) {
          break;
        }
        hideDisplayIdxs.push(j);
      }

      // All header ths for the affected display indices.
      for (const hTh of headerThs) {
        const hdi = Number.parseInt(hTh.dataset.colDisplayIdx, 10);
        if (hideDisplayIdxs.includes(hdi)) {
          hTh.style.display = collapsed ? 'none' : '';
        }
      }

      // In each data row, hide/show <td> cells by data-compact-col-display-idx.
      for (const tr of allTrs) {
        const tds = [...tr.querySelectorAll('td[data-compact-col-display-idx]')];
        for (const td of tds) {
          const tdi = Number.parseInt(td.dataset.compactColDisplayIdx, 10);
          if (hideDisplayIdxs.includes(tdi)) {
            td.style.display = collapsed ? 'none' : '';
          }
        }
      }
    });
  }
}

function _attachTableToggles(rowCompact, rowGroupMap, colCompact, thead, tbody, displayCols) {
  if (!rowCompact) {
    for (const { th, rows } of rowGroupMap.values()) {
      if (rows.length > 1) {
        attachTabularToggle(th, rows);
      }
    }
  }
  if (colCompact) {
    _attachCompactColToggles(thead, tbody, displayCols);
  }
}

function _renderTable(result, def) {
  const wrap = document.getElementById('table-wrap');

  if (!result) {
    wrap.innerHTML =
      !def || !isDefReady(def) ? `<div class="table-empty">${t('emptyState')}</div>` : '';
    updateStats();
    return;
  }

  const { rowAxis, colAxis, grid, qualIdx } = result;
  const { numGroupLevels: rgLevels, flatRows, leafHidden: rowLeafHidden } = rowAxis;
  const { numGroupLevels: cgLevels, flatRows: flatCols, leafHidden: colLeafHidden } = colAxis;

  const settings = (def ?? {}).settings ?? {};
  const rowCompact = settings.rowTabular === false,
    colCompact = settings.colTabular === false;

  // Build compact display order for rows (if compact mode).
  // IsEmpty is always false: computeMatrix already filters empty rows before augmentation,
  // So a second pass here would hide rows that tabular mode shows (causing inconsistency).
  const displayRows = rowCompact
    ? buildCompactDisplayRows(flatRows, rgLevels, () => false)
    : undefined;

  // Build compact display order for cols (if compact mode).
  const displayCols = colCompact
    ? buildCompactDisplayRows(flatCols, cgLevels, () => false)
    : undefined;

  // Both axes empty → nothing to show
  if (!flatRows.length && !flatCols.length) {
    wrap.innerHTML = `<div class="table-empty">${t('emptyState')}</div>`;
    updateStats();
    return;
  }

  // Row header columns: compact → 1; tabular → one per group level + leaf column
  // Column header rows: compact → 1; tabular → one per group level + leaf row
  const rowHdrCols = rowCompact ? 1 : rgLevels + (rowLeafHidden ? 0 : 1),
    colHdrRows = colCompact ? 1 : cgLevels + (colLeafHidden ? 0 : 1);

  const table = Object.assign(document.createElement('table'), { className: 'table-table' });
  const thead = document.createElement('thead'),
    tbody = document.createElement('tbody');

  // ── COLUMN HEADERS ─────────────────────────────────────────────────────────

  _renderColumnHeaders(
    thead,
    flatCols,
    displayCols,
    colCompact,
    colHdrRows,
    rowHdrCols,
    rgLevels,
    rowCompact,
    rowLeafHidden,
    colLeafHidden,
    cgLevels,
  );

  // ── DATA ROWS ──────────────────────────────────────────────────────────────

  const rowDisplayList = rowCompact
    ? displayRows
    : flatRows.map((_, ri) => ({
        origIdx: ri,
        indent: 0,
        isGroupHeader: false,
        noChildren: false,
      }));

  const rowGroupMap = _renderDataRows(
    tbody,
    flatRows,
    flatCols,
    rowDisplayList,
    displayCols,
    rowCompact,
    colCompact,
    rgLevels,
    rowLeafHidden,
    grid,
    qualIdx,
  );

  table.append(thead, tbody);
  wrap.replaceChildren(table);

  // ── ATTACH EXPAND/COLLAPSE ─────────────────────────────────────────────────

  _attachTableToggles(rowCompact, rowGroupMap, colCompact, thead, tbody, displayCols);

  updateStats(result.stats);
}

// ── STATS BAR ─────────────────────────────────────────────────────────────────

function updateStats(stats) {
  const bar = document.getElementById('stats-bar');
  if (!stats) {
    bar.textContent = '';
    return;
  }
  bar.textContent = [
    t('statsRows', stats.rows),
    t('statsCols', stats.cols),
    t('statsNonEmpty', stats.nonEmpty),
  ].join(' · ');
}
