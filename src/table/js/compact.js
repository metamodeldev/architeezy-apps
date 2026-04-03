// ── COMPACT DISPLAY ROW BUILDER ──────────────────────────────────────────────
//
// Converts augmented flatRows (with multi-level subtotals via _groupLevel) into
// Compact display order: group headers (subtotal rows) appear BEFORE their children.

function scanGroupEnd(flatRows, i, to, depth, groupElem) {
  let j = i + 1;
  while (j < to) {
    const jleaf = flatRows[j].leafElem;
    if (jleaf._isGrandTotal) {
      break;
    }
    if (jleaf._isSubtotal && jleaf._groupLevel !== undefined && jleaf._groupLevel <= depth) {
      if (jleaf._groupLevel === depth && jleaf._groupRef?.id === groupElem.id) {
        j++;
      }
      break;
    }
    if (!jleaf._isSubtotal && flatRows[j].groups[depth]?.elem?.id !== groupElem.id) {
      break;
    }
    j++;
  }
  return j;
}

function findSubIdx(flatRows, i, j, depth, groupElem) {
  if (j > i) {
    const last = flatRows[j - 1].leafElem;
    if (last._isSubtotal && last._groupLevel === depth && last._groupRef?.id === groupElem.id) {
      return j - 1;
    }
  }
  return -1;
}

function hasVisibleChildren(flatRows, i, childEnd, isEmpty) {
  for (let k = i; k < childEnd; k++) {
    const kleaf = flatRows[k].leafElem;
    if (!kleaf._isSubtotal && !kleaf._isGrandTotal && !isEmpty(k)) {
      return true;
    }
  }
  return false;
}

/**
 * Converts augmented flatRows (with multi-level subtotals via _groupLevel) into compact display
 * order: group headers (subtotal rows) appear BEFORE their children.
 *
 * @param {Array} flatRows - The augmented flat row array produced by compute, each entry containing
 *   a leafElem and groups.
 * @param {number} numGroupLevels - The number of grouping levels (depth of the row axis).
 * @param {Function} isEmpty - Predicate `(origIdx) => boolean` — true if the row at origIdx has no
 *   displayable data.
 * @returns {{
 *   origIdx: number;
 *   indent: number;
 *   isGroupHeader: boolean;
 *   noChildren: boolean;
 * }[]}
 *   Ordered display rows with indentation metadata.
 */
export function buildCompactDisplayRows(flatRows, numGroupLevels, isEmpty) {
  const result = [];

  function pushLeafRow(i, depth) {
    if (!flatRows[i].leafElem._isSubtotal && !isEmpty(i)) {
      result.push({ origIdx: i, indent: depth, isGroupHeader: false, noChildren: false });
    }
  }

  function processRange(from, to, depth) {
    let i = from;
    while (i < to) {
      const { leafElem: leaf, groups } = flatRows[i];

      if (leaf._isGrandTotal) {
        result.push({ origIdx: i, indent: 0, isGroupHeader: false, noChildren: false });
        i++;
        continue;
      }

      // Subtotals belonging to a level shallower than current depth are outer group
      // Boundaries emitted by the parent processRange call — skip here.
      if (leaf._isSubtotal && leaf._groupLevel !== undefined && leaf._groupLevel < depth) {
        i++;
        continue;
      }

      if (depth >= numGroupLevels) {
        // Leaf level: emit non-virtual, non-empty rows.
        pushLeafRow(i, depth);
        i++;
        continue;
      }

      // Group level: locate extent of the current group at `depth`.
      const groupElem = groups[depth]?.elem;
      if (!groupElem) {
        pushLeafRow(i, depth);
        i++;
        continue;
      }

      const j = scanGroupEnd(flatRows, i, to, depth, groupElem);
      const subIdx = findSubIdx(flatRows, i, j, depth, groupElem);
      const childEnd = subIdx >= 0 ? j - 1 : j;

      // Emit group header using the subtotal row's data.
      if (subIdx >= 0) {
        result.push({
          origIdx: subIdx,
          indent: depth,
          isGroupHeader: true,
          noChildren: !hasVisibleChildren(flatRows, i, childEnd, isEmpty),
        });
      }

      // Recurse into children.
      processRange(i, childEnd, depth + 1);

      i = j;
    }
  }

  processRange(0, flatRows.length, 0);
  return result;
}
