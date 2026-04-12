import {
  buildAxisItems,
  buildAxisItemsAllLevels,
  collectAllElems,
  getOrigRange,
  recomputeAxisSpans,
  recomputeFlatRowGroups,
} from './compute-axis.js';
import {
  aggregateValues,
  dataItemDisplay,
  makeDataItemAxis,
  resolveDataItemElements,
  resolveDataItemRelations,
} from './compute-data.js';
import { identifyGroups } from './compute-helpers.js';
import { buildAxis } from './compute-level.js';

/**
 * Computes the display value for a single (rowElem × colElem) cell. Mirrors the cell-computation
 * logic from the main computeMatrix grid loop so that the same rules apply when computing
 * group-level cells for subtotals/totals.
 *
 * @param {object} rowElem - The row element or RelNode.
 * @param {object} colElem - The column element or RelNode.
 * @param {object} firstDataItem - The first active data item definition.
 * @returns {string} The computed cell value string.
 */
function computeCellValue(rowElem, colElem, firstDataItem) {
  if (rowElem._isDataItem) {
    const quals = resolveDataItemElements(rowElem, colElem);
    return dataItemDisplay(rowElem, quals);
  }
  if (colElem._isDataItem) {
    const quals = resolveDataItemElements(colElem, rowElem);
    return dataItemDisplay(colElem, quals);
  }
  if (!firstDataItem) {
    return '';
  }
  if (!rowElem._isRel && !colElem._isRel) {
    const quals =
      (firstDataItem.relationItems ?? []).length > 0
        ? resolveDataItemRelations(firstDataItem, rowElem, colElem)
        : resolveDataItemElements(firstDataItem, rowElem).filter((e) => e.id === colElem.id);
    return dataItemDisplay(firstDataItem, quals);
  }
  if (rowElem._isRel && colElem._isRel) {
    const fromRow = resolveDataItemElements(firstDataItem, rowElem);
    const fromCol = resolveDataItemElements(firstDataItem, colElem);
    const colIds = new Set(fromCol.map((e) => e.id));
    const quals = fromRow.filter((e) => colIds.has(e.id));
    return dataItemDisplay(firstDataItem, quals);
  }
  return '';
}

function _buildNewFlatAxis(
  axisItems,
  origFlatItems,
  groups,
  groupLevel,
  axisTag,
  hasSubtotals,
  allLevels,
  numGroups,
) {
  const cloned = origFlatItems.map((r) => ({
    groups: r.groups.map((g) => ({ ...g })),
    leafElem: r.leafElem,
  }));
  const newItems = axisItems.map((item) => {
    if (item.type === 'leaf') {
      return cloned[item.origIdx];
    }
    if (item.type === 'subtotal') {
      const firstOrigIdx = item.origRange ? item.origRange[0] : groups[item.groupIdx].start;
      const groupElem =
        item._groupElem ??
        (item.origRange ? undefined : cloned[groups[item.groupIdx].start].groups[groupLevel]?.elem);
      const tmpl = cloned[firstOrigIdx];
      return {
        groups: tmpl.groups.map((g) => ({ ...g, first: false })),
        leafElem: {
          _isSubtotal: true,
          id: `sub_${axisTag}::${groupElem?.id ?? firstOrigIdx}`,
          _groupRef: groupElem,
          ...(item._groupLevel !== undefined ? { _groupLevel: item._groupLevel } : {}),
        },
      };
    }
    return { groups: [], leafElem: { _isGrandTotal: true, id: `__grand_total_${axisTag}__` } };
  });
  if (hasSubtotals && !allLevels) {
    recomputeAxisSpans(newItems, numGroups);
  }
  return newItems;
}

/**
 * Builds the augmented matrix with subtotals and totals. For aggregated cells (subtotal/total),
 * recomputes values for ALL elements in the range — both leaf elements AND their group-level
 * ancestor elements — so that the group element's own data is included in the aggregate.
 * firstDataItem is used for mode-aware aggregation (count/presence/names).
 *
 * @param {object[]} rowFlatRows - The flat row array from buildAxis.
 * @param {object[]} colFlatRows - The flat column array from buildAxis.
 * @param {string[][]} grid - The pre-computed leaf×leaf grid values.
 * @param {object} settings - The matrix settings object.
 * @param {number} rowNumGroups - Number of group levels in the row axis.
 * @param {number} colNumGroups - Number of group levels in the column axis.
 * @param {object} firstDataItem - The first active data item definition.
 * @param {{ rowAllLevels?: boolean; colAllLevels?: boolean }} [options] -
 *   Options for compact mode (all-levels subtotals).
 * @returns {{ flatRows: object[]; flatCols: object[]; grid: string[][] }} The augmented rows,
 *   columns, and grid.
 */
export function buildAugmentedMatrix(
  rowFlatRows,
  colFlatRows,
  grid,
  settings,
  rowNumGroups,
  colNumGroups,
  firstDataItem,
  { rowAllLevels = false, colAllLevels = false } = {},
) {
  const R = rowFlatRows.length;
  const C = colFlatRows.length;

  const rowGroupLevel = rowNumGroups - 1;
  const colGroupLevel = colNumGroups - 1;

  const rowGroups =
    settings.rowSubtotals && !rowAllLevels ? identifyGroups(rowFlatRows, rowGroupLevel) : [];
  const colGroups =
    settings.colSubtotals && !colAllLevels ? identifyGroups(colFlatRows, colGroupLevel) : [];

  const rowItems =
    rowAllLevels && settings.rowSubtotals
      ? buildAxisItemsAllLevels(rowFlatRows, rowNumGroups, settings.rowTotals)
      : buildAxisItems(R, rowGroups, settings.rowSubtotals, settings.rowTotals);
  const colItems =
    colAllLevels && settings.colSubtotals
      ? buildAxisItemsAllLevels(colFlatRows, colNumGroups, settings.colTotals)
      : buildAxisItems(C, colGroups, settings.colSubtotals, settings.colTotals);

  // Build new flatRows and flatCols — clone to allow mutation
  const newFlatRows = _buildNewFlatAxis(
    rowItems,
    rowFlatRows,
    rowGroups,
    rowGroupLevel,
    'row',
    settings.rowSubtotals,
    rowAllLevels,
    rowNumGroups,
  );
  const newFlatCols = _buildNewFlatAxis(
    colItems,
    colFlatRows,
    colGroups,
    colGroupLevel,
    'col',
    settings.colSubtotals,
    colAllLevels,
    colNumGroups,
  );

  // Build new grid.
  // Leaf×leaf: pre-computed grid value used directly (fast path).
  // Subtotal/total × anything: collectAllElems gathers leaf + group-ancestor elements
  //   So that a group element's own data is included in the aggregate.
  // Leaf × subtotal/total: only the leaf element is used (not its group ancestors);
  //   Ancestor data belongs to the ancestor's own subtotal row, not the leaf row.
  const newGrid = rowItems.map((rItem) => {
    // Resolve data item from the row leaf if it is a DataItemNode (cols_data mode)
    const rowLeafItem =
      rItem.type === 'leaf' && rowFlatRows[rItem.origIdx].leafElem._isDataItem
        ? rowFlatRows[rItem.origIdx].leafElem
        : undefined;
    const origRows = getOrigRange(rItem, rowGroups, R);
    return colItems.map((cItem) => {
      const origCols = getOrigRange(cItem, colGroups, C);
      // Only use the pre-computed grid value for true leaf×leaf cells.
      // Subtotal/total items must go through collectAllElems so that the group
      // Element's own data is included even when the group has only one leaf.
      if (rItem.type === 'leaf' && cItem.type === 'leaf') {
        return grid[rItem.origIdx][cItem.origIdx];
      }
      // Resolve data item from the col leaf if it is a DataItemNode (rows_data mode)
      const colLeafItem =
        cItem.type === 'leaf' && colFlatRows[cItem.origIdx].leafElem._isDataItem
          ? colFlatRows[cItem.origIdx].leafElem
          : undefined;
      const dataItem = rowLeafItem ?? colLeafItem ?? firstDataItem;
      // For leaf items, only use the leaf element itself — not group ancestors.
      // Ancestors belong to their own subtotal rows and must not inflate leaf row cells.
      const rowElems =
        rItem.type === 'leaf'
          ? (() => {
              const lf = rowFlatRows[rItem.origIdx].leafElem;
              return lf && !lf._isEmptyLeaf && !lf._isSubtotal && !lf._isGrandTotal ? [lf] : [];
            })()
          : collectAllElems(rowFlatRows, origRows, rowNumGroups);
      const colElems =
        cItem.type === 'leaf'
          ? (() => {
              const lf = colFlatRows[cItem.origIdx].leafElem;
              return lf && !lf._isEmptyLeaf && !lf._isSubtotal && !lf._isGrandTotal ? [lf] : [];
            })()
          : collectAllElems(colFlatRows, origCols, colNumGroups);
      const vals = [];
      for (const re of rowElems) {
        for (const ce of colElems) {
          vals.push(computeCellValue(re, ce, dataItem));
        }
      }
      return aggregateValues(vals, dataItem);
    });
  });

  return { flatRows: newFlatRows, flatCols: newFlatCols, grid: newGrid };
}

function _buildAxes(def, activeCells, showEmptyRows, showEmptyCols) {
  const hasRows = (def.rowAxis?.levels ?? []).some(
    (l) => l.elementTypes?.length || l.relationItems?.length,
  );
  const hasCols = (def.colAxis?.levels ?? []).some(
    (l) => l.elementTypes?.length || l.relationItems?.length,
  );
  const hasCells = activeCells.length > 0;
  let rowAxisResult, colAxisResult;
  if (hasRows && hasCols) {
    rowAxisResult = buildAxis(def.rowAxis, def.rowSort, showEmptyRows);
    colAxisResult = buildAxis(def.colAxis, def.colSort, showEmptyCols);
  } else if (hasRows && hasCells) {
    rowAxisResult = buildAxis(def.rowAxis, def.rowSort, showEmptyRows);
    colAxisResult = makeDataItemAxis(activeCells);
  } else if (hasCols && hasCells) {
    rowAxisResult = makeDataItemAxis(activeCells);
    colAxisResult = buildAxis(def.colAxis, def.colSort, showEmptyCols);
  } else if (hasRows) {
    rowAxisResult = buildAxis(def.rowAxis, def.rowSort, showEmptyRows);
    colAxisResult = { numGroupLevels: 0, flatRows: [], leafHidden: false };
  } else {
    rowAxisResult = { numGroupLevels: 0, flatRows: [], leafHidden: false };
    colAxisResult = hasCols
      ? buildAxis(def.colAxis, def.colSort, showEmptyCols)
      : { numGroupLevels: 0, flatRows: [], leafHidden: false };
  }
  return { rowAxisResult, colAxisResult };
}

function _computeCell(rowLeaf, colLeaf, firstDataItem) {
  let val = '';
  let quals = [];
  if (rowLeaf._isDataItem) {
    // Cols_data mode: data item as row, real element as col
    quals = resolveDataItemElements(rowLeaf, colLeaf);
    val = dataItemDisplay(rowLeaf, quals);
  } else if (colLeaf._isDataItem) {
    // Rows_data mode: data item as col, real element as row
    quals = resolveDataItemElements(colLeaf, rowLeaf);
    val = dataItemDisplay(colLeaf, quals);
  } else if (firstDataItem && !rowLeaf._isDataItem && !colLeaf._isDataItem) {
    if (!rowLeaf._isRel && !colLeaf._isRel) {
      // Element × Element with data item.
      // When the data item navigates via relations, collect the actual
      // Relation objects connecting rowLeaf ↔ colLeaf so that count,
      // Presence, and names all refer to the relations themselves.
      // When the data item uses only elementTypes (containment), fall back
      // To checking whether colLeaf is reachable from rowLeaf.
      if ((firstDataItem.relationItems ?? []).length > 0) {
        quals = resolveDataItemRelations(firstDataItem, rowLeaf, colLeaf);
      } else {
        const fromRow = resolveDataItemElements(firstDataItem, rowLeaf);
        quals = fromRow.filter((e) => e.id === colLeaf.id);
      }
    } else if (rowLeaf._isRel && colLeaf._isRel) {
      // RelNode × RelNode: elements common to both leaves' resolved sets
      const fromRow = resolveDataItemElements(firstDataItem, rowLeaf);
      const fromCol = resolveDataItemElements(firstDataItem, colLeaf);
      const colIds = new Set(fromCol.map((e) => e.id));
      quals = fromRow.filter((e) => colIds.has(e.id));
    }
    val = dataItemDisplay(firstDataItem, quals);
  }
  return { val, quals };
}

function _buildInitialGrid(rowAxisResult, colAxisResult, firstDataItem) {
  const rowLeaves = rowAxisResult.flatRows.map((r) => r.leafElem);
  const colLeaves = colAxisResult.flatRows.map((r) => r.leafElem);
  const grid = [];
  const qualIdx = new Map();
  for (let ri = 0; ri < rowLeaves.length; ri++) {
    const rowLeaf = rowLeaves[ri];
    const row = [];
    for (let ci = 0; ci < colLeaves.length; ci++) {
      const colLeaf = colLeaves[ci];
      const { val, quals } = _computeCell(rowLeaf, colLeaf, firstDataItem);
      row.push(val);
      if (val && val !== '' && quals.length) {
        const rowKey = rowLeaf.id ?? `__idx_${ri}__`;
        const colKey = colLeaf.id ?? `__idx_${ci}__`;
        qualIdx.set(`${rowKey}::${colKey}`, quals);
      }
    }
    grid.push(row);
  }
  return { grid, qualIdx };
}

// Filter empty rows and columns when data items are active.
// A row/column with all empty cells carries no information and is hidden.
// Skipped per-axis when showEmptyRows / showEmptyCols is on — the user
// Explicitly requested all structural nodes to be visible.
// Applied before augmentation so subtotals/totals reflect only visible data.
//
// Subtotal exception: when subtotals are enabled for an axis, a group whose
// Leaf rows are all empty must still be kept if the group element itself has
// Data — it will appear in the subtotal row after augmentation. The same
// Logic is applied cross-axis: columns (rows) are kept when a row (col) group
// Element has data with them, even if every leaf×leaf cell is empty.
// Compact mode implicitly forces subtotals (group rows carry aggregate data).
function _filterEmptyRows(
  rowAxisResult,
  colAxisResult,
  grid,
  firstDataItem,
  willHaveRowSubtotals,
  willHaveColSubtotals,
) {
  const innerColLeaves = colAxisResult.flatRows.map((fr) => fr.leafElem);
  const keepRows = [];
  for (let ri = 0; ri < grid.length; ri++) {
    const row = grid[ri];
    if (row.some((v) => v !== '')) {
      keepRows.push(ri);
      continue;
    }
    // When row subtotals are active, also keep rows where a grouping
    // Ancestor has non-empty data with at least one column leaf.
    if (willHaveRowSubtotals) {
      const fr = rowAxisResult.flatRows[ri];
      if (
        fr.groups.some(
          (g) =>
            g?.elem &&
            innerColLeaves.some((cl) => computeCellValue(g.elem, cl, firstDataItem) !== ''),
        )
      ) {
        keepRows.push(ri);
        continue;
      }
    }
    // When col subtotals are active, keep rows that have data with any col group element.
    if (willHaveColSubtotals) {
      const rowLeaf = rowAxisResult.flatRows[ri].leafElem;
      const colGroupElems = colAxisResult.flatRows.flatMap((cf) =>
        cf.groups.map((g) => g?.elem).filter(Boolean),
      );
      if (colGroupElems.some((ge) => computeCellValue(rowLeaf, ge, firstDataItem) !== '')) {
        keepRows.push(ri);
      }
    }
  }
  if (keepRows.length < rowAxisResult.flatRows.length) {
    rowAxisResult.flatRows = keepRows.map((i) => rowAxisResult.flatRows[i]);
    recomputeFlatRowGroups(rowAxisResult.flatRows, rowAxisResult.numGroupLevels);
    return keepRows.map((i) => grid[i]);
  }
  return grid;
}

function _filterEmptyCols(
  rowAxisResult,
  colAxisResult,
  grid,
  firstDataItem,
  willHaveRowSubtotals,
  willHaveColSubtotals,
) {
  const colCount = colAxisResult.flatRows.length;
  const rowGroupElems = willHaveRowSubtotals
    ? [
        ...new Map(
          rowAxisResult.flatRows
            .flatMap((fr) => fr.groups.map((g) => g?.elem).filter(Boolean))
            .map((e) => [e.id, e]),
        ).values(),
      ]
    : [];
  const innerRowLeaves = rowAxisResult.flatRows.map((fr) => fr.leafElem);
  const keepCols = [];
  for (let ci = 0; ci < colCount; ci++) {
    if (grid.some((row) => row[ci] !== '')) {
      keepCols.push(ci);
      continue;
    }
    const cf = colAxisResult.flatRows[ci];
    // When col subtotals are active, also keep cols where a grouping ancestor has non-empty data.
    if (
      willHaveColSubtotals &&
      cf.groups.some(
        (g) =>
          g?.elem &&
          innerRowLeaves.some((rl) => computeCellValue(rl, g.elem, firstDataItem) !== ''),
      )
    ) {
      keepCols.push(ci);
      continue;
    }
    // When row subtotals are active, keep columns that have data with any row group element.
    if (
      willHaveRowSubtotals &&
      rowGroupElems.some((ge) => computeCellValue(ge, cf.leafElem, firstDataItem) !== '')
    ) {
      keepCols.push(ci);
    }
  }
  if (keepCols.length < colCount) {
    colAxisResult.flatRows = keepCols.map((i) => colAxisResult.flatRows[i]);
    recomputeFlatRowGroups(colAxisResult.flatRows, colAxisResult.numGroupLevels);
    return grid.map((row) => keepCols.map((ci) => row[ci]));
  }
  return grid;
}

function _filterEmptyRowsAndCols(
  rowAxisResult,
  colAxisResult,
  grid,
  firstDataItem,
  settings,
  rowCompact,
  colCompact,
) {
  const showEmptyRows = Boolean(settings.showEmptyRows);
  const showEmptyCols = Boolean(settings.showEmptyCols);
  const willHaveRowSubtotals =
    (Boolean(settings.rowSubtotals) || rowCompact) && rowAxisResult.numGroupLevels > 0;
  const willHaveColSubtotals =
    (Boolean(settings.colSubtotals) || colCompact) && colAxisResult.numGroupLevels > 0;

  let filteredGrid = grid;
  if (!showEmptyRows) {
    filteredGrid = _filterEmptyRows(
      rowAxisResult,
      colAxisResult,
      filteredGrid,
      firstDataItem,
      willHaveRowSubtotals,
      willHaveColSubtotals,
    );
  }
  if (!showEmptyCols) {
    filteredGrid = _filterEmptyCols(
      rowAxisResult,
      colAxisResult,
      filteredGrid,
      firstDataItem,
      willHaveRowSubtotals,
      willHaveColSubtotals,
    );
  }
  return filteredGrid;
}

function _computeMatrix(def) {
  const activeCells = (def.cells ?? []).filter(
    (d) => d.elementTypes?.length > 0 || d.relationItems?.length > 0,
  );
  const hasCells = activeCells.length > 0;
  const settings = def.settings ?? {};
  const showEmptyRows = Boolean(settings.showEmptyRows);
  const showEmptyCols = Boolean(settings.showEmptyCols);

  const { rowAxisResult, colAxisResult } = _buildAxes(
    def,
    activeCells,
    showEmptyRows,
    showEmptyCols,
  );
  const firstDataItem = activeCells[0];
  const { grid: initialGrid, qualIdx } = _buildInitialGrid(
    rowAxisResult,
    colAxisResult,
    firstDataItem,
  );
  let grid = initialGrid;

  // Compact mode implicitly forces subtotals (group rows carry aggregate data).
  const rowCompact = settings.rowTabular === false && rowAxisResult.numGroupLevels > 0;
  const colCompact = settings.colTabular === false && colAxisResult.numGroupLevels > 0;

  if (hasCells) {
    grid = _filterEmptyRowsAndCols(
      rowAxisResult,
      colAxisResult,
      grid,
      firstDataItem,
      settings,
      rowCompact,
      colCompact,
    );
  }

  // Post-process: subtotals and totals.
  // Compact mode forces subtotals on so that group rows have aggregate data.
  const augSettings = {
    rowSubtotals:
      (Boolean(settings.rowSubtotals) || rowCompact) && rowAxisResult.numGroupLevels > 0,
    colSubtotals:
      (Boolean(settings.colSubtotals) || colCompact) && colAxisResult.numGroupLevels > 0,
    rowTotals: Boolean(settings.rowTotals),
    colTotals: Boolean(settings.colTotals),
  };
  if (
    augSettings.rowSubtotals ||
    augSettings.colSubtotals ||
    augSettings.rowTotals ||
    augSettings.colTotals
  ) {
    const aug = buildAugmentedMatrix(
      rowAxisResult.flatRows,
      colAxisResult.flatRows,
      grid,
      augSettings,
      rowAxisResult.numGroupLevels,
      colAxisResult.numGroupLevels,
      firstDataItem,
      { rowAllLevels: rowCompact, colAllLevels: colCompact },
    );
    rowAxisResult.flatRows = aug.flatRows;
    colAxisResult.flatRows = aug.flatCols;
    grid = aug.grid;
  }

  let finalNonEmpty = 0;
  for (const row of grid) {
    for (const val of row) {
      if (val && val !== '') {
        finalNonEmpty++;
      }
    }
  }

  return {
    rowAxis: rowAxisResult,
    colAxis: colAxisResult,
    grid,
    qualIdx,
    stats: {
      rows: rowAxisResult.flatRows.length,
      cols: colAxisResult.flatRows.length,
      nonEmpty: finalNonEmpty,
    },
  };
}

export function computeMatrix(def) {
  try {
    return _computeMatrix(def);
  } catch (error) {
    console.error('[table] computeMatrix error:', error);
    throw error;
  }
}
