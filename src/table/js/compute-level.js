import { sortNodes } from './compute-helpers.js';
import { state } from './state.js';

function _resolveRootLevel(level, result) {
  if (level.elementTypes?.length) {
    const typeSet = new Set(level.elementTypes);
    for (const e of state.allElements) {
      if (typeSet.has(e.type)) {
        result.set(e.id, e);
      }
    }
  }
  for (const ri of level.relationItems ?? []) {
    for (const rel of state.allRelations) {
      if (ri.type && rel.type !== ri.type) {
        continue;
      }
      const key = `${rel.id}::${ri.dir}`;
      if (!result.has(key)) {
        result.set(key, { ...rel, _isRel: true, _traverseDir: ri.dir });
      }
    }
  }
}

function _resolveFromElemParents(level, elemParents, result) {
  const parentIdSet = new Set(elemParents.map((p) => p.id));
  if (level.elementTypes?.length) {
    const typeSet = new Set(level.elementTypes);
    for (const e of state.allElements) {
      if (typeSet.has(e.type) && parentIdSet.has(e.parent)) {
        result.set(e.id, e);
      }
    }
  }
  for (const ri of level.relationItems ?? []) {
    for (const rel of state.allRelations) {
      if (ri.type && rel.type !== ri.type) {
        continue;
      }
      const matches =
        (ri.dir === 'out' && parentIdSet.has(rel.source)) ||
        (ri.dir === 'in' && parentIdSet.has(rel.target));
      if (matches) {
        const key = `${rel.id}::${ri.dir}`;
        if (!result.has(key)) {
          result.set(key, { ...rel, _isRel: true, _traverseDir: ri.dir });
        }
      }
    }
  }
}

/**
 * Resolves the nodes for a single axis level given the parent nodes from the previous level.
 *
 * @param {object} level - The level descriptor with elementTypes, relationItems, and filter.
 * @param {object[] | undefined} parentNodes - The parent nodes from the previous level, or
 *   undefined for the root level.
 * @param {{ by?: string; dir?: string }} sort - Sort configuration.
 * @returns {object[]} The resolved and sorted node array for this level.
 */

export function resolveLevel(level, parentNodes, sort) {
  const result = new Map();

  if (parentNodes === undefined) {
    _resolveRootLevel(level, result);
  } else {
    const elemParents = parentNodes.filter((p) => !p._isRel);
    const relParents = parentNodes.filter((p) => p._isRel);

    if (elemParents.length) {
      _resolveFromElemParents(level, elemParents, result);
    }

    if (relParents.length && level.elementTypes?.length) {
      const typeSet = new Set(level.elementTypes);
      for (const rel of relParents) {
        const connId = rel._traverseDir === 'out' ? rel.target : rel.source;
        const e = connId && state.elemMap[connId];
        if (e && typeSet.has(e.type)) {
          result.set(e.id, e);
        }
      }
    }
  }

  let nodes = [...result.values()];
  if (level.filter) {
    const f = level.filter.toLowerCase();
    nodes = nodes.filter((n) => (n.name || n.type || '').toLowerCase().includes(f));
  }
  return sortNodes(nodes, sort);
}

/**
 * Returns all nodes (elements AND RelNodes) across all active levels of an axis, following the same
 * empty-level-skip logic as buildTree.
 *
 * Used by the builder to compute contextual data item counts.
 *
 * @param {{ levels: Array }} axis - The axis definition containing level descriptors.
 * @returns {Array} All resolved nodes across all active levels of the axis.
 */
export function getAxisElements(axis) {
  const allLevels = axis?.levels ?? [];
  const found = new Map();
  let parentNodes;
  for (const level of allLevels) {
    const isEmpty = !level.elementTypes?.length && !level.relationItems?.length;
    if (isEmpty) {
      continue;
    }
    const nodes = resolveLevel(level, parentNodes, { dir: 'asc' });
    for (const n of nodes) {
      const key = n._isRel ? `${n.id}::${n._traverseDir ?? ''}` : n.id;
      found.set(key, n);
    }
    parentNodes = nodes;
  }
  return [...found.values()];
}

/**
 * Returns the parent-node context for each level of an axis, used for contextual count computation
 * in the builder.
 *
 * @param {{ levels: Array }} axis - The axis definition containing level descriptors.
 * @returns {(object[] | undefined)[]} Array of parent-node contexts, one per
 * level.
 */
export function buildAxisContexts(axis) {
  const levels = axis?.levels ?? [];
  const contexts = [];
  let parentNodes;
  for (let i = 0; i < levels.length; i++) {
    contexts.push(parentNodes);
    if (i < levels.length - 1) {
      const level = levels[i];
      const isEmpty = !level.elementTypes?.length && !level.relationItems?.length;
      if (!isEmpty) {
        parentNodes = resolveLevel(level, parentNodes, {
          by: 'label',
          dir: 'asc',
        });
      }
    }
  }
  return contexts;
}

function buildTree(levels, levelIdx, parentNodes, sort, showEmpty) {
  if (levelIdx >= levels.length) {
    return [];
  }
  const level = levels[levelIdx];
  const isLeaf = levelIdx === levels.length - 1;
  const isEmpty = !level.elementTypes?.length && !level.relationItems?.length;

  // Empty (unconfigured) level: skip transparently — next level sees same parents.
  if (isEmpty && !isLeaf) {
    return buildTree(levels, levelIdx + 1, parentNodes, sort, showEmpty);
  }

  const nodes = resolveLevel(level, parentNodes, sort);
  if (!nodes.length) {
    return [];
  }
  if (isLeaf) {
    return nodes.map((n) => ({ node: n, levelIdx, children: undefined }));
  }
  return nodes.flatMap((n) => {
    const children = buildTree(levels, levelIdx + 1, [n], sort, showEmpty);
    if (children.length) {
      return [{ node: n, levelIdx, children }];
    }
    if (showEmpty) {
      // Give the node a virtual empty-leaf child at the deepest level so that
      // FlattenTree correctly places all ancestor group cells in their proper
      // Columns — instead of collapsing the node directly into the leaf column.
      const emptyLeaf = {
        node: { _isEmptyLeaf: true, id: `empty::${n.id ?? levelIdx}` },
        levelIdx: levels.length - 1,
        children: undefined,
      };
      return [{ node: n, levelIdx, children: [emptyLeaf] }];
    }
    return [];
  });
}

function flattenTree(treeNodes, levels) {
  const rows = [];
  for (const tn of treeNodes) {
    if (tn.children === undefined) {
      rows.push({ groups: [], leafElem: tn.node });
    } else {
      const subRows = flattenTree(tn.children, levels);
      const span = subRows.length;
      const hidden = levels[tn.levelIdx]?.hidden;
      if (!hidden) {
        for (let i = 0; i < subRows.length; i++) {
          subRows[i].groups.unshift({ elem: tn.node, span, first: i === 0 });
        }
      }
      rows.push(...subRows);
    }
  }
  return rows;
}

export function buildAxis(axis, sort, showEmpty) {
  const allLevels = axis?.levels ?? [];
  const activeLevels = allLevels.filter(
    (l) => l.elementTypes?.length > 0 || l.relationItems?.length > 0,
  );
  if (!activeLevels.length) {
    return { numGroupLevels: 0, flatRows: [], leafHidden: false };
  }

  const tree = buildTree(activeLevels, 0, undefined, sort, showEmpty);
  const flatRows = flattenTree(tree, activeLevels);
  const numGroupLevels = activeLevels.slice(0, -1).filter((l) => !l.hidden).length;
  const leafHidden = activeLevels[activeLevels.length - 1]?.hidden ?? false;

  return { numGroupLevels, flatRows, leafHidden };
}
