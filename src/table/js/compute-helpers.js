import { t } from './i18n.js';

export function sortNodes(nodes, sort) {
  const dir = sort?.dir ?? 'asc';
  return [...nodes].toSorted((a, b) => {
    const la = (a.name || a.type || a.id || '').toLowerCase();
    const lb = (b.name || b.type || b.id || '').toLowerCase();
    return dir === 'asc' ? la.localeCompare(lb) : lb.localeCompare(la);
  });
}

/**
 * Returns the display label of an element, relation node, or data item node.
 *
 * @param {object} node - The node object to derive a label from.
 * @returns {string} Human-readable label for the node.
 */
export function nodeLabel(node) {
  if (!node) {
    return '—';
  }
  if (node._isSubtotal) {
    return t('subtotal');
  }
  if (node._isGrandTotal) {
    return t('grandTotal');
  }
  if (node._isEmptyLeaf) {
    return '';
  }
  if (node._isDataItem) {
    if (node.name?.trim()) {
      return node.name.trim();
    }
    const parts = [];
    for (const elemType of node.elementTypes ?? []) {
      parts.push(elemType);
    }
    for (const ri of node.relationItems ?? []) {
      parts.push(`${ri.dir === 'out' ? '→' : '←'} ${ri.type}`);
    }
    return parts.join(', ') || '…';
  }
  return node.name || node.type || node.id || '?';
}

/**
 * Identifies contiguous groups in flatItems by their groupLevel group element id.
 *
 * @param {object[]} flatItems - The flat row or column items to group.
 * @param {number} groupLevel - The group level index to identify groups at.
 * @returns {{ start: number; end: number; elemId: string }[]} Array of group
 * range descriptors.
 */
export function identifyGroups(flatItems, groupLevel) {
  const groups = [];
  let i = 0;
  while (i < flatItems.length) {
    const elemId = flatItems[i].groups[groupLevel]?.elem?.id ?? '__ungrouped__';
    let j = i + 1;
    while (
      j < flatItems.length &&
      (flatItems[j].groups[groupLevel]?.elem?.id ?? '__ungrouped__') === elemId
    ) {
      j++;
    }
    groups.push({ start: i, end: j, elemId });
    i = j;
  }
  return groups;
}
