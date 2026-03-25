// ── UNIVERSAL PARSER ───────────────────────────────────────────────────────
//
// Fully structural — no hardcoded type names or property keys.
//
// Rules applied in order to each object with eClass:
//   1. data.source + data.target  → standalone edge
//   2. data.target only + parentId → embedded reference edge (parent → target)
//   3. otherwise                  → graph node
//
// All array-valued properties of data are walked recursively.
//   • Object items with eClass → walkNode(item, currentId)
//   • UUID string items        → edge from currentId to that UUID
//
// content[0] is always the model root — only its data is walked (root itself skipped).

import { ECORE_NS } from './constants.js';
import { isUUID } from './utils.js';

/**
 * Parses a raw Architeezy model JSON response into graph elements and relations.
 *
 * @param {object} raw - The parsed JSON body of a model content API response.
 * @returns {{
 *   allElements: object[];
 *   allRelations: object[];
 *   elemMap: object;
 *   currentModelNs: string;
 *   modelNsMap: object;
 * }}
 */
export function parseModel(raw) {
  const allElements = [];
  const allRelations = [];
  const elemMap = {};
  const modelNsMap = raw.ns && typeof raw.ns === 'object' ? raw.ns : {};
  let currentModelNs = '';
  let idCounter = 0;

  const roots = Array.isArray(raw.content) ? raw.content : [raw];
  const rootObj = roots[0] ?? {};

  // Resolve model namespace: extract root eClass prefix, look up full URI in ns map.
  const rootEClass = rootObj.eClass ?? '';
  const col = rootEClass.lastIndexOf(':');
  if (col > 0) {
    const prefix = rootEClass.slice(0, col);
    currentModelNs = modelNsMap[prefix] ?? prefix;
  }

  function walkData(d, parentId) {
    if (!d || typeof d !== 'object') {
      return;
    }
    for (const [key, val] of Object.entries(d)) {
      if (!Array.isArray(val)) {
        continue;
      }
      const edgeType = key;
      for (let i = 0; i < val.length; i++) {
        const item = val[i];
        if (item && typeof item === 'object' && item.eClass) {
          walkNode(item, parentId);
        } else if (isUUID(item) && parentId) {
          allRelations.push({
            id: `${parentId}_${key}_${i}`,
            type: edgeType,
            source: parentId,
            target: item,
            name: '',
          });
        }
      }
    }
  }

  function walkNode(node, parentId) {
    const eClass = node.eClass;
    const sep = eClass.lastIndexOf(':');
    const ns = sep >= 0 ? eClass.slice(0, sep) : '';
    const type = sep >= 0 ? eClass.slice(sep + 1) : eClass;
    const fullNs = modelNsMap[ns] ?? ns;

    // Skip ecore internal key-value map entries — compare full namespace URI
    if (type === 'EStringToStringMapEntry' && fullNs === ECORE_NS) {
      return;
    }

    const d = node.data ?? {};
    const id = node.id ?? `_${idCounter++}`;

    // Rule 1: standalone edge
    if (d.source && d.target) {
      allRelations.push({
        id,
        type,
        source: d.source,
        target: d.target,
        name: d.name || '',
      });
      walkData(d, id);
      return;
    }

    // Rule 2: embedded reference (target only, no source)
    if (d.target && !d.source && parentId) {
      allRelations.push({
        id,
        type,
        source: parentId,
        target: d.target,
        name: d.name || '',
      });
      return;
    }

    // Rule 3: graph node — track containment parent
    const parentIsNode = parentId !== undefined && elemMap[parentId] !== undefined;
    const elem = {
      id,
      type,
      ns,
      name: d.name || d.label || d.title || type,
      doc: d.documentation || d.description || d.doc || '',
      parent: parentIsNode ? parentId : undefined,
    };
    allElements.push(elem);
    elemMap[id] = elem;
    walkData(d, id);
  }

  roots.forEach((root) => walkData(root?.data ?? {}, undefined));

  return { allElements, allRelations, elemMap, currentModelNs, modelNsMap };
}
