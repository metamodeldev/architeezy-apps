/**
 * ModelService - Reactive service for model data management.
 *
 * Centralizes all model-related state and operations using signals. Provides parsing, loading, and
 * querying capabilities for graph models.
 *
 * @module model/service
 * @package
 */

import { apiFetch } from '../api.js';
import { BASE_URL } from '../constants.js';
import { t } from '../i18n.js';
import { initColorMaps } from '../palette.js';
import { signal, computed } from '../signals/index.js';

// ── PRIVATE SIGNALS ─────────────────────────────────────────────────────────────

/** @type {import('../signals').Signal<string | undefined>} */
const _id = signal();

/** @type {import('../signals').Signal<string>} */
const _ns = signal('');

/** @type {import('../signals').Signal<object[]>} */
const _elements = signal([]);

/** @type {import('../signals').Signal<object[]>} */
const _relations = signal([]);

/** @type {import('../signals').Signal<Map<string, object>>} */
const _elemMap = signal(new Map());

/** @type {import('../signals').Signal<'idle' | 'loading' | 'loaded' | 'error' | 'empty'>} */
const _status = signal('idle');

/** @type {import('../signals').Signal<string>} */
const _errorMessage = signal('');

/** @type {import('../signals').Signal<object[]>} */
const _modelList = signal([]);

/** @type {import('../signals').Signal<string | undefined>} */
const _modelName = signal();

// ── COMPUTED EXPORTS ────────────────────────────────────────────────────────────

/**
 * Computed: element type → count map.
 *
 * @type {import('../signals').ReadonlySignal<Record<string, number>>}
 */
export const elementTypeCounts = computed(() => {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const e of _elements.value) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return counts;
});

/**
 * Computed: relationship type → count map (only for relationships with both endpoints as nodes).
 *
 * @type {import('../signals').ReadonlySignal<Record<string, number>>}
 */
export const relationTypeCounts = computed(() => {
  const elemIds = new Set(_elements.value.map((e) => e.id));
  /** @type {Record<string, number>} */
  const counts = {};
  for (const r of _relations.value) {
    if (elemIds.has(r.source) && elemIds.has(r.target)) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    }
  }
  return counts;
});

/**
 * Computed: true if any elements are loaded.
 *
 * @type {import('../signals').ReadonlySignal<boolean>}
 */
export const hasElements = computed(() => _elements.value.length > 0);

// ── READER FUNCTIONS (getters) ───────────────────────────────────────────────────

/**
 * Returns the current model ID.
 *
 * @returns {string | undefined} The model identifier.
 */
export function getId() {
  return _id.value;
}

/**
 * Returns the current model namespace.
 *
 * @returns {string} The namespace URI of the loaded model.
 */
export function getNs() {
  return _ns.value;
}

/**
 * Returns all loaded elements.
 *
 * @returns {object[]} Array of all element objects.
 */
export function getElements() {
  return _elements.value;
}

/**
 * Returns all loaded relationships.
 *
 * @returns {object[]} Array of all relationship objects.
 */
export function getRelations() {
  return _relations.value;
}

/**
 * Returns the element map (id → element).
 *
 * @returns {Map<string, object>} Map for fast element lookup by ID.
 */
export function getElemMap() {
  return _elemMap.value;
}

/**
 * Returns the cached model list.
 *
 * @returns {object[]} Array of cached model objects from the API.
 */
export function getModelList() {
  return _modelList.value;
}

/**
 * Returns the current status.
 *
 * @returns {'idle' | 'loading' | 'loaded' | 'error' | 'empty'} Current loading status.
 */
export function getStatus() {
  return _status.value;
}

/**
 * Returns the current error message (if any).
 *
 * @returns {string} Error message text.
 */
export function getErrorMessage() {
  return _errorMessage.value;
}

// ── MUTATION FUNCTIONS (setters) ────────────────────────────────────────────────

/**
 * Sets the current model ID.
 *
 * @param {string | undefined} id - The model identifier.
 */
export function setId(id) {
  _id.value = id;
}

/**
 * Sets the current model namespace.
 *
 * @param {string} ns - The namespace URI.
 */
export function setNs(ns) {
  _ns.value = ns;
}

/**
 * Sets the loaded elements array.
 *
 * @param {object[]} elements - Array of element objects.
 */
export function setElements(elements) {
  _elements.value = elements;
}

/**
 * Sets the loaded relationships array.
 *
 * @param {object[]} relations - Array of relationship objects.
 */
export function setRelations(relations) {
  _relations.value = relations;
}

/**
 * Sets the element map.
 *
 * @param {Map<string, object>} elemMap - Map from element ID to element object.
 */
export function setElemMap(elemMap) {
  _elemMap.value = elemMap;
}

/**
 * Sets the cached model list.
 *
 * @param {object[]} modelList - Array of model objects from the API.
 */
export function setModelList(modelList) {
  _modelList.value = modelList;
}

/**
 * Sets the current status.
 *
 * @param {'idle' | 'loading' | 'loaded' | 'error' | 'empty'} status - The status value.
 */
export function setStatus(status) {
  _status.value = status;
}

/**
 * Sets the error message.
 *
 * @param {string} message - Error message text.
 */
export function setErrorMessage(message) {
  _errorMessage.value = message;
}

// ── ACTIONS ─────────────────────────────────────────────────────────────────────

/**
 * Constant: ecore namespace URI.
 *
 * @type {string}
 */
const ECORE_NS = 'http://www.eclipse.org/emf/2002/Ecore';

/**
 * Helper: check if a string is a UUID.
 *
 * @param {string} s - String to test.
 * @returns {boolean} True if the string is a UUID.
 */
function isUUID(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/**
 * Parses a raw model JSON response, extracts graph elements and relations.
 *
 * @param {object} raw - Raw JSON body of a model content API response.
 * @returns {{
 *   allElements: object[];
 *   allRelations: object[];
 *   elemMap: Map<string, object>;
 *   currentModelNs: string;
 * }}
 *   Parsed graph data including elements, relations, element map, and namespace.
 */
export function parseModel(raw) {
  const allElements = [];
  const allRelations = [];
  const elemMap = new Map();
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

  /**
   * Walks the data object to extract edges and nested objects.
   *
   * @param {object} d - Data object to walk.
   * @param {string} parentId - Parent element ID.
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

  /**
   * Processes a single node (element or relationship).
   *
   * @param {object} node - The node object.
   * @param {string | undefined} parentId - Parent element ID if any.
   */
  // eslint-disable-next-line complexity
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
    const parentIsNode = parentId !== undefined && elemMap.has(parentId);

    // Collect model-specific scalar properties as extras (excluding structural/reserved keys)
    const EXCLUDED_KEYS = new Set([
      'name',
      'label',
      'source',
      'target',
      'children',
      'elements',
      'relations',
    ]);
    const extras = {};
    for (const [key, val] of Object.entries(d)) {
      if (!EXCLUDED_KEYS.has(key) && val !== null && typeof val !== 'object') {
        extras[key] = val;
      }
    }

    const elem = {
      id,
      type,
      ns,
      name: d.name || d.label || d.title || type,
      doc: d.documentation || d.description || d.doc || '',
      parent: parentIsNode ? parentId : undefined,
      extras,
    };
    allElements.push(elem);
    elemMap.set(id, elem);
    walkData(d, id);
  }

  for (const root of roots) {
    walkData(root?.data ?? {});
  }

  return { allElements, allRelations, elemMap, currentModelNs, modelNsMap };
}

/**
 * Parses an eClass string into namespace prefix, type name, and full namespace URI.
 *
 * @param {string} eClassStr - The eClass string (e.g., "myNs:MyClass").
 * @param {object} nsMap - Namespace prefix → full URI mapping.
 * @returns {{ ns: string; type: string; fullNs: string }} Parsed eClass components.
 */
function parseEClass(eClassStr, nsMap) {
  const sep = eClassStr.lastIndexOf(':');
  const ns = sep >= 0 ? eClassStr.slice(0, sep) : '';
  const type = sep >= 0 ? eClassStr.slice(sep + 1) : eClassStr;
  return { ns, type, fullNs: nsMap[ns] ?? ns };
}

/**
 * Loads a model from the given URL, parses it, and updates service state. Manages status
 * transitions, notifications, and localStorage persistence.
 *
 * @param {string} modelId - Optional model ID for tracking.
 * @param {string} url - The content URL to fetch.
 * @throws {Error} On load failure.
 */
export async function load(modelId, url) {
  setStatus('loading');
  setErrorMessage('');

  try {
    const r = await apiFetch(url);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status} — ${r.statusText}`);
    }

    const raw = await r.json();
    const { allElements, allRelations, elemMap, currentModelNs } = parseModel(raw);

    setElements(allElements);
    setRelations(allRelations);
    setElemMap(elemMap);
    setNs(currentModelNs);
    setId(modelId);

    initColorMaps(allElements, allRelations);

    if (allElements.length === 0) {
      setStatus('empty');
    } else {
      setStatus('loaded');
      localStorage.setItem('architeezyGraphModelUrl', url);
    }
  } catch (error) {
    setStatus('error');
    setErrorMessage(error.message);
    localStorage.removeItem('architeezyGraphModelUrl');
    throw error;
  }
}

/**
 * Selects a model by calling load with its content URL. Also updates the UI model name via
 * setCurrentModelName.
 *
 * @param {object} model - Model object from the API (must have id, contentUrl, name).
 */
export async function selectModel(model) {
  const url = modelContentUrl(model);
  if (!url) {
    throw new Error(t('invalidModelUrl'));
  }

  // Try to get the model name (may be undefined)
  const modelName = model.name;

  // Load the model
  await load(model.id, url);

  // Update the UI with the model name (if available)
  if (modelName) {
    setCurrentModelName(modelName);
  }
}

/**
 * Clears all service state (signals and derived data). Resets status to 'idle' and empties all
 * collections.
 */
export function clear() {
  _elements.value = [];
  _relations.value = [];
  _elemMap.value = new Map();
  _ns.value = '';
  _id.value = undefined;
  _status.value = 'idle';
  _errorMessage.value = '';
  _modelList.value = [];
}

// ── HELPER UTILITIES ────────────────────────────────────────────────────────────

/**
 * Retrieves an element by ID (fast lookup from the element map).
 *
 * @param {string} id - Element ID.
 * @returns {object | undefined} The element object if found, undefined otherwise.
 */
export function getElementById(id) {
  return _elemMap.value.get(id);
}

/**
 * Returns all elements of a specific type.
 *
 * @param {string} type - Element type name.
 * @returns {object[]} Elements matching the given type.
 */
export function getElementsByType(type) {
  return _elements.value.filter((e) => e.type === type);
}

/**
 * Returns elements whose type is in the provided set.
 *
 * @param {Set<string> | string[]} types - Set or array of allowed element types.
 * @returns {object[]} Elements with active types.
 */
export function getElementsByTypes(types) {
  const typeSet = types instanceof Set ? types : new Set(types);
  return _elements.value.filter((e) => typeSet.has(e.type));
}

/**
 * Returns all relationships connected to a specific element (as source or target).
 *
 * @param {string} elementId - ID of the element.
 * @returns {object[]} Relationships involving the element.
 */
export function getRelationshipsForElement(elementId) {
  return _relations.value.filter((r) => r.source === elementId || r.target === elementId);
}

/**
 * Returns relationships where the element is the source.
 *
 * @param {string} elementId - ID of the element.
 * @returns {object[]} Outgoing relationships.
 */
export function getOutgoingRelations(elementId) {
  return _relations.value.filter((r) => r.source === elementId);
}

/**
 * Returns relationships where the element is the target.
 *
 * @param {string} elementId - ID of the element.
 * @returns {object[]} Incoming relationships.
 */
export function getIncomingRelations(elementId) {
  return _relations.value.filter((r) => r.target === elementId);
}

/**
 * Checks if an element with the given ID exists.
 *
 * @param {string} id - Element ID.
 * @returns {boolean} True if element exists.
 */
export function hasElement(id) {
  return _elemMap.value.has(id);
}

// ── ADDITIONAL UTILITY EXPORTS ──────────────────────────────────────────────────

/**
 * Derives a short human-readable label from a model's `contentType` string.
 *
 * @param {string | undefined} contentType - The model's MIME-type-like content type.
 * @returns {string} Short label, or "?" when no recognisable pattern is found.
 */
export function modelTypeLabel(contentType) {
  if (!contentType) {
    return '?';
  }
  const m = contentType.match(/\/metamodel\/([^/]+)\//);
  if (m) {
    return m[1].toUpperCase();
  }
  const hash = contentType.split('#')[1];
  return hash ? hash.replace(/Model$/, '') : '?';
}

/**
 * Resolves the content fetch URL for a model object returned by the API. Prefers the
 * `_links.content` HAL link; falls back to constructing the canonical API path.
 *
 * @param {object} model - A model object from the API model list.
 * @returns {string | undefined} The content URL, or undefined if it cannot be resolved.
 */
export function modelContentUrl(model) {
  const links = model._links?.content;
  if (Array.isArray(links) && links[0]?.href) {
    return links[0].href.replaceAll(/\{[^}]*\}/g, '');
  }
  if (links?.href) {
    return links.href.replaceAll(/\{[^}]*\}/g, '');
  }
  const { scopeSlug, projectSlug, projectVersion, slug } = model;
  if (scopeSlug && projectSlug && projectVersion && slug) {
    return `${BASE_URL}/api/models/${scopeSlug}/${projectSlug}/${projectVersion}/${slug}/content?format=json`;
  }
}

// Need to import BASE_URL for the fallback URL construction - already imported at top

/**
 * Fetches the full paginated model list from the API. Follows `_links.next` until all pages are
 * consumed.
 *
 * @returns {Promise<Array>} Resolved list of model objects.
 * @throws {Error} If any page request fails or the list is empty.
 */
export async function fetchModelList() {
  const models = [];
  let url = `${BASE_URL}/api/models?size=100`;
  while (url) {
    // eslint-disable-next-line no-await-in-loop
    const r = await apiFetch(url);
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }
    // eslint-disable-next-line no-await-in-loop
    const data = await r.json();
    models.push(...(data._embedded?.models ?? []));
    const next = data._links?.next?.href;
    url = next && next !== url ? next : undefined;
  }
  // Empty repository is a valid state; return empty array
  return models;
}

/**
 * Returns the current model display name.
 *
 * @returns {string | undefined} The current model display name.
 */
export function getModelName() {
  return _modelName.value;
}

export { _modelName as modelNameSignal };

/**
 * Sets the current model display name. Updates reactive signal, document title, and localStorage.
 * DOM rendering reacts via effect in model/selector.js.
 *
 * @param {string} name - The model display name.
 */
export function setCurrentModelName(name) {
  _modelName.value = name;
  document.title = `${name} — Architeezy Graph`;
  try {
    localStorage.setItem('architeezyGraphModelName', name);
  } catch {
    // Ignore storage errors
  }
}
