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
import { state } from './state.js';

/**
 * Parses a raw Architeezy model JSON response into `state.allElements`,
 * `state.allRelations`, and `state.elemMap`.
 * Also resolves the model namespace URI into `state.currentModelNs`.
 *
 * @param {object} raw - The parsed JSON body of a model content API response.
 */
// Monotonically incrementing counter for synthetic IDs assigned to nodes that
// have no `id` field in the model JSON.  Reset at the start of each parse so
// IDs are stable within a session but never collide across two different nodes.
let _idCounter = 0;

export function parseModel(raw) {
  state.allElements = [];
  state.allRelations = [];
  state.elemMap = {};
  state.currentModelNs = '';
  _idCounter = 0;

  const roots = Array.isArray(raw.content) ? raw.content : [raw];
  const rootObj = roots[0] ?? {};

  // Store ns map for use in walkNode (prefix → full URI resolution for ECORE_NS check etc.)
  state.modelNsMap = raw.ns && typeof raw.ns === 'object' ? raw.ns : {};

  // Resolve model namespace: extract root eClass prefix, look up full URI in ns map.
  // ns is an object at the top level of the JSON response: { [prefix]: fullURI, … }
  const rootEClass = rootObj.eClass ?? '';
  const nsMap = state.modelNsMap;
  const col = rootEClass.lastIndexOf(':');
  if (col > 0) {
    const prefix = rootEClass.slice(0, col);
    state.currentModelNs = nsMap[prefix] ?? prefix;
  }

  roots.forEach((root) => walkData(root?.data ?? {}, undefined));
}

/**
 * Recursively walks all array-valued properties of a data object.
 * Objects with `eClass` are dispatched to `walkNode`; plain UUID strings
 * produce implicit edges from `parentId` to the referenced UUID.
 *
 * @param {object} d - The `data` object of a model node.
 * @param {string|undefined} parentId - ID of the containing element, or undefined at root level.
 */
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
        state.allRelations.push({
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

/**
 * Classifies a single eClass node as a standalone edge, embedded reference edge,
 * or graph element, then recurses into its data.
 *
 * @param {object} node - Raw eClass node from the model JSON.
 * @param {string|undefined} parentId - ID of the containing element, or undefined at root level.
 */
function walkNode(node, parentId) {
  const raw = node.eClass;
  const col = raw.lastIndexOf(':');
  const ns = col >= 0 ? raw.slice(0, col) : '';
  const type = col >= 0 ? raw.slice(col + 1) : raw;
  const fullNs = state.modelNsMap[ns] ?? ns; // resolve short prefix → full URI

  // Skip ecore internal key-value map entries — compare full namespace URI
  if (type === 'EStringToStringMapEntry' && fullNs === ECORE_NS) {
    return;
  }

  const d = node.data ?? {};
  const id = node.id ?? `_${_idCounter++}`;

  // Rule 1: standalone edge
  if (d.source && d.target) {
    state.allRelations.push({
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
    state.allRelations.push({
      id,
      type,
      source: parentId,
      target: d.target,
      name: d.name || '',
    });
    return;
  }

  // Rule 3: graph node — track containment parent
  const parentIsNode = parentId !== undefined && state.elemMap[parentId] !== undefined;
  const elem = {
    id,
    type,
    ns,
    name: d.name || d.label || d.title || type,
    doc: d.documentation || d.description || d.doc || '',
    parent: parentIsNode ? parentId : undefined,
  };
  state.allElements.push(elem);
  state.elemMap[id] = elem;
  walkData(d, id);
}
