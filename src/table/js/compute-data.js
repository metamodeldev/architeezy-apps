import { nodeLabel } from './compute-helpers.js';
import { state } from './state.js';

export function resolveFromRelNode(parentNode, typeSet, hasTypes, relItems, found) {
  // RelNode leaf: the "foreign" endpoint is direction-dependent.
  //   _traverseDir="out" → we arrived by going OUT from source → foreign = target
  //   _traverseDir="in"  → we arrived by going IN  from target → foreign = source
  const foreignId = parentNode._traverseDir === 'out' ? parentNode.target : parentNode.source;
  const foreign = foreignId ? state.elemMap[foreignId] : undefined;
  if (foreign && !relItems.length && (!hasTypes || typeSet.has(foreign.type))) {
    // No relation items: the foreign element itself is the result
    found.set(foreign.id, foreign);
  }
  // Relation-of-relation navigation is not supported: when relItems is set on a
  // RelNode parent, return empty (consistent with countDataRelType returning 0).
}

export function resolveFromElement(parentNode, typeSet, hasTypes, relItems, found) {
  // Element leaf: navigate via configured relation items.
  for (const ri of relItems) {
    for (const rel of state.allRelations) {
      if (ri.type && rel.type !== ri.type) {
        continue;
      }
      const connId =
        ri.dir === 'out' && rel.source === parentNode.id
          ? rel.target
          : ri.dir === 'in' && rel.target === parentNode.id
            ? rel.source
            : undefined;
      if (connId) {
        const e = state.elemMap[connId];
        if (e && (!hasTypes || typeSet.has(e.type))) {
          found.set(e.id, e);
        }
      }
    }
  }
  // Containment fallback when no relation items
  if (!relItems.length && hasTypes) {
    for (const e of state.allElements) {
      if (typeSet.has(e.type) && e.parent === parentNode.id) {
        found.set(e.id, e);
      }
    }
  }
}

/**
 * Finds all elements reachable from parentNode via the data item's relationItems (navigating to the
 * connected element), then filtered by elementTypes and name filter.
 *
 * If no relationItems but elementTypes are set, returns direct containment children of parentNode
 * matching those types.
 *
 * @param {object} dataItem - The data item definition with elementTypes, relationItems, and filter.
 * @param {object} parentNode - The axis node (element or RelNode) to resolve from.
 * @returns {object[]} Array of matching element objects.
 */
export function resolveDataItemElements(dataItem, parentNode) {
  if (!parentNode || parentNode._isDataItem || parentNode._isEmptyLeaf) {
    return [];
  }

  const typeSet = new Set(dataItem.elementTypes);
  const hasTypes = typeSet.size > 0;
  const relItems = dataItem.relationItems ?? [];
  const found = new Map();

  if (parentNode._isRel) {
    resolveFromRelNode(parentNode, typeSet, hasTypes, relItems, found);
  } else {
    resolveFromElement(parentNode, typeSet, hasTypes, relItems, found);
  }

  const f = dataItem.filter?.trim().toLowerCase() ?? '';
  return [...found.values()].filter((e) => !f || (e.name || '').toLowerCase().includes(f));
}

/**
 * Finds all relations matching the data item's relationItems that directly connect rowElem →
 * colElem (dir="out") or colElem → rowElem (dir="in"). Used for Element×Element intersection when
 * the data item navigates via relations — returns the relation objects themselves (not connected
 * elements).
 *
 * @param {object} dataItem - The data item definition with relationItems and filter.
 * @param {object} rowElem - The row element to use as the relation source.
 * @param {object} colElem - The column element to use as the relation target.
 * @returns {object[]} Array of matching relation objects.
 */
export function resolveDataItemRelations(dataItem, rowElem, colElem) {
  const relItems = dataItem.relationItems ?? [];
  const found = [];
  for (const ri of relItems) {
    for (const rel of state.allRelations) {
      if (ri.type && rel.type !== ri.type) {
        continue;
      }
      if (ri.dir === 'out' && rel.source === rowElem.id && rel.target === colElem.id) {
        found.push(rel);
      } else if (ri.dir === 'in' && rel.target === rowElem.id && rel.source === colElem.id) {
        found.push(rel);
      }
    }
  }
  const f = dataItem.filter?.trim().toLowerCase() ?? '';
  if (f) {
    return found.filter((r) => (r.name || '').toLowerCase().includes(f));
  }
  return found;
}

/**
 * Formats a data item cell value from a resolved element set.
 *
 * @param {object} dataItem - The data item definition specifying mode and joinSep.
 * @param {object[]} elems - The resolved elements or relations for this cell.
 * @returns {string} The formatted cell value string.
 */
export function dataItemDisplay(dataItem, elems) {
  if (!elems.length) {
    return dataItem.emptyValue ?? '';
  }
  switch (dataItem.mode) {
    case 'count':
      return String(elems.length);
    case 'presence':
      return '✓';
    case 'names': {
      const names = [...new Set(elems.map((e) => nodeLabel(e)))];
      return names.join(dataItem.joinSep ?? ', ');
    }
    default:
      return String(elems.length);
  }
}

/**
 * Creates a virtual axis from an array of active data items.
 *
 * @param {object[]} activeCells - The active data item definitions to use as axis nodes.
 * @returns {{
 *   numGroupLevels: number;
 *   flatRows: object[];
 *   leafHidden: boolean;
 * }}
 *   The virtual axis result.
 */
export function makeDataItemAxis(activeCells) {
  return {
    numGroupLevels: 0,
    flatRows: activeCells.map((d) => ({
      groups: [],
      leafElem: { _isDataItem: true, ...d },
    })),
    leafHidden: false,
  };
}

function aggregateNames(vals, sep) {
  const allNames = new Set();
  for (const v of vals) {
    if (v !== '' && v !== undefined && v !== null) {
      for (const n of v.split(sep)) {
        const trimmed = n.trim();
        if (trimmed) {
          allNames.add(trimmed);
        }
      }
    }
  }
  return allNames.size ? [...allNames].join(sep) : '';
}

/**
 * Aggregates an array of cell values for subtotal and total cells.
 *
 * @param {string[]} vals - The cell value strings to aggregate.
 * @param {object} dataItem - The data item definition for mode-aware aggregation.
 * @returns {string} The aggregated cell value string.
 */
export function aggregateValues(vals, dataItem) {
  const mode = dataItem?.mode ?? 'count';

  if (mode === 'presence') {
    return vals.some((v) => v !== '' && v !== undefined && v !== null) ? '✓' : '';
  }

  if (mode === 'names') {
    return aggregateNames(vals, dataItem?.joinSep ?? ', ');
  }

  // Count (default)
  let sum = 0;
  let nonEmpty = 0;
  let hasNumeric = false;
  for (const v of vals) {
    if (v !== '' && v !== undefined && v !== null) {
      nonEmpty++;
      const n = Number(v);
      if (!Number.isNaN(n)) {
        sum += n;
        hasNumeric = true;
      }
    }
  }
  if (!nonEmpty) {
    return '';
  }
  return hasNumeric ? String(sum) : String(nonEmpty);
}
