/**
 * Builds an ordered list of items (leaf/subtotal/total) for one axis.
 *
 * @param {number} N - Total number of leaf rows or columns.
 * @param {{ start: number; end: number; elemId: string }[]} groups - Group descriptors from
 *   identifyGroups.
 * @param {boolean} includeSubtotals - Whether to include subtotal items.
 * @param {boolean} includeTotal - Whether to include a grand total item.
 * @returns {object[]} Ordered list of axis items with type, origIdx, or
 * groupIdx.
 */
export function buildAxisItems(N, groups, includeSubtotals, includeTotal) {
  const items = [];
  if (includeSubtotals && groups.length > 0) {
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      for (let i = g.start; i < g.end; i++) {
        items.push({ type: 'leaf', origIdx: i });
      }
      items.push({ type: 'subtotal', groupIdx: gi });
    }
  } else {
    for (let i = 0; i < N; i++) {
      items.push({ type: 'leaf', origIdx: i });
    }
  }
  if (includeTotal) {
    items.push({ type: 'total' });
  }
  return items;
}

/**
 * Returns the original indices that a given item aggregates over.
 *
 * @param {object} item - The axis item (leaf, subtotal, or total).
 * @param {{ start: number; end: number }[]} groups - Group descriptors from identifyGroups.
 * @param {number} N - Total number of leaf items.
 * @returns {number[]} Array of original leaf indices that this item covers.
 */
export function getOrigRange(item, groups, N) {
  if (item.type === 'leaf') {
    return [item.origIdx];
  }
  if (item.type === 'subtotal') {
    if (item.origRange) {
      return item.origRange;
    } // Multi-level items
    const g = groups[item.groupIdx];
    return Array.from({ length: g.end - g.start }, (_, k) => g.start + k);
  }
  // Total
  return Array.from({ length: N }, (_, k) => k);
}

/**
 * Builds an ordered list of items for one axis that includes subtotals at ALL group levels (not
 * just the deepest). Used for compact mode where group headers appear at every depth.
 *
 * The resulting items are in tabular order (leaves first, then their subtotal), so that the grid
 * values can be computed correctly. table.js reorders them into display order.
 *
 * @param {object[]} flatRows - The flat row array from buildAxis.
 * @param {number} numGroupLevels - The number of grouping levels.
 * @param {boolean} [includeTotal] - Whether to include a grand total item.
 * @returns {object[]} Ordered list of axis items with type, origIdx, origRange, _groupElem, and
 *   _groupLevel.
 */
export function buildAxisItemsAllLevels(flatRows, numGroupLevels, includeTotal = false) {
  const items = [];
  function recurse(from, to, depth) {
    if (depth >= numGroupLevels) {
      for (let i = from; i < to; i++) {
        items.push({ type: 'leaf', origIdx: i });
      }
      return;
    }
    let i = from;
    while (i < to) {
      const groupElem = flatRows[i].groups[depth]?.elem;
      let j = i + 1;
      while (j < to && flatRows[j].groups[depth]?.elem?.id === groupElem?.id) {
        j++;
      }
      recurse(i, j, depth + 1);
      const rangeStart = i;
      items.push({
        type: 'subtotal',
        origRange: Array.from({ length: j - rangeStart }, (_, k) => rangeStart + k),
        _groupElem: groupElem,
        _groupLevel: depth,
      });
      i = j;
    }
  }
  recurse(0, flatRows.length, 0);
  if (includeTotal) {
    items.push({ type: 'total' });
  }
  return items;
}

/**
 * Recomputes rowspan/colspan values for all groups after augmentation.
 *
 * @param {object[]} flatItems - The augmented flat items (rows or cols) to update.
 * @param {number} numGroupLevels - The number of group levels to recompute spans for.
 */
export function recomputeAxisSpans(flatItems, numGroupLevels) {
  for (let g = 0; g < numGroupLevels; g++) {
    let spanStart = -1;
    let firstItemIdx = -1;
    for (let i = 0; i <= flatItems.length; i++) {
      const isEnd = i === flatItems.length;
      const grp = isEnd ? undefined : flatItems[i].groups[g];
      if (grp?.first) {
        if (firstItemIdx >= 0) {
          flatItems[firstItemIdx].groups[g].span = i - spanStart;
        }
        spanStart = i;
        firstItemIdx = i;
      } else if (!isEnd && !grp) {
        if (firstItemIdx >= 0) {
          flatItems[firstItemIdx].groups[g].span = i - spanStart;
        }
        spanStart = -1;
        firstItemIdx = -1;
      }
    }
    if (firstItemIdx >= 0) {
      flatItems[firstItemIdx].groups[g].span = flatItems.length - spanStart;
    }
  }
}

/**
 * Collects all unique non-virtual elements from a set of flatRow indices: both the leaf elements
 * and any group elements at each group level. Virtual nodes (_isEmptyLeaf, _isSubtotal,
 * _isGrandTotal) are excluded.
 *
 * @param {object[]} flatRows - The flat row array from buildAxis.
 * @param {number[]} indices - The row indices to collect elements from.
 * @param {number} numGroupLevels - Number of group levels in the axis.
 * @returns {object[]} Unique non-virtual element objects.
 */
export function collectAllElems(flatRows, indices, numGroupLevels) {
  const seen = new Set();
  const elems = [];
  for (const i of indices) {
    const fr = flatRows[i];
    const leaf = fr.leafElem;
    if (
      leaf &&
      !leaf._isEmptyLeaf &&
      !leaf._isSubtotal &&
      !leaf._isGrandTotal &&
      !seen.has(leaf.id)
    ) {
      seen.add(leaf.id);
      elems.push(leaf);
    }
    for (let g = 0; g < numGroupLevels; g++) {
      const grpElem = fr.groups[g]?.elem;
      if (grpElem && !seen.has(grpElem.id)) {
        seen.add(grpElem.id);
        elems.push(grpElem);
      }
    }
  }
  return elems;
}

/**
 * After rows/cols are removed by filtering, the `first` and `span` values in every group cell may
 * be stale (the original first row of a group could have been deleted). This function re-identifies
 * group boundaries by comparing consecutive `groups[g].elem.id` values and rewrites `first` /
 * `span` in-place.
 *
 * @param {object[]} flatItems - The flat row or column items to update in place.
 * @param {number} numGroupLevels - Number of group levels to process.
 */
export function recomputeFlatRowGroups(flatItems, numGroupLevels) {
  for (let g = 0; g < numGroupLevels; g++) {
    let i = 0;
    while (i < flatItems.length) {
      const grp = flatItems[i].groups[g];
      if (!grp) {
        // oxlint-disable-next-line no-useless-assignment
        i++;
        continue;
      } // Grand-total or promoted-empty row — no group at this level
      const elemId = grp.elem?.id;
      let j = i + 1;
      while (j < flatItems.length) {
        const next = flatItems[j].groups[g];
        if (!next || next.elem?.id !== elemId) {
          break;
        }
        j++;
      }
      const span = j - i;
      for (let k = i; k < j; k++) {
        flatItems[k].groups[g] = {
          ...flatItems[k].groups[g],
          first: k === i,
          span,
        };
      }
      i = j;
    }
  }
}
