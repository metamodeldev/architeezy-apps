// ── MODEL DATA ───────────────────────────────────────────────────────────────
//
// Stores parsed model data and exposes read-only access to all modules.
// Written once per model load via loadModelData(); everything else is read-only.
//
// Also owns model identity (_currentModelId / _currentModelNs) and the
// Universal JSON parser (formerly parser.js).

import { isUUID } from './utils.js';

// ── ECORE / UUID ─────────────────────────────────────────────────────────────

/** Full URI of the ecore namespace used in EMF models. */
export const ECORE_NS = 'http://www.eclipse.org/emf/2002/Ecore';

// ── MODEL IDENTITY ────────────────────────────────────────────────────────────

/** @type {string | undefined} UUID of the currently loaded model */
let _currentModelId;

/** @type {string} Full namespace URI of the model; used as filter-state localStorage key. */
let _currentModelNs = '';

export function getCurrentModelId() {
  return _currentModelId;
}

export function getCurrentModelNs() {
  return _currentModelNs;
}

/**
 * Records the identity of the loaded model. Called by app.js after a successful load.
 *
 * @param {string | undefined} id UUID of the model, or undefined to clear
 * @param {string} ns Full namespace URI of the model
 */
export function setCurrentModel(id, ns) {
  _currentModelId = id;
  _currentModelNs = ns;
}

// ── MODEL DATA ────────────────────────────────────────────────────────────────

/**
 * @type {{
 *   id: string;
 *   type: string;
 *   ns: string;
 *   name: string;
 *   doc: string;
 *   parent: string | null;
 * }[]}
 */
let _allElements = [];

/** @type {{ id: string; type: string; source: string; target: string; name: string }[]} */
let _allRelations = [];

/**
 * @type {Object<
 *   string,
 *   { id: string; type: string; ns: string; name: string; doc: string; parent: string | null }
 * >}
 *   id → element lookup
 */
let _elemMap = {};

export function getAllElements() {
  return _allElements;
}

export function getAllRelations() {
  return _allRelations;
}

export function getElemMap() {
  return _elemMap;
}

/**
 * Parses a raw model JSON response, stores the resulting elements, relations, and element map, and
 * returns the model namespace URI (for setCurrentModel).
 *
 * @param {object} raw - Raw JSON body of a model content API response.
 * @returns {string} CurrentModelNs — full namespace URI of the loaded model.
 */
export function loadModelData(raw) {
  const { allElements, allRelations, elemMap, currentModelNs } = parseModel(raw);
  _allElements = allElements;
  _allRelations = allRelations;
  _elemMap = elemMap;
  return currentModelNs;
}

// ── PARSER ────────────────────────────────────────────────────────────────────
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
// Content[0] is always the model root — only its data is walked (root itself skipped).

function parseEClass(eClassStr, nsMap) {
  const sep = eClassStr.lastIndexOf(':');
  const ns = sep >= 0 ? eClassStr.slice(0, sep) : '';
  const type = sep >= 0 ? eClassStr.slice(sep + 1) : eClassStr;
  return { ns, type, fullNs: nsMap[ns] ?? ns };
}

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
 *   The parsed graph elements and relations.
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
    const { ns, type, fullNs } = parseEClass(node.eClass, modelNsMap);

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

  for (const root of roots) {
    walkData(root?.data ?? {});
  }

  return { allElements, allRelations, elemMap, currentModelNs, modelNsMap };
}
