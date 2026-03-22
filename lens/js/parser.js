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

import { ECORE_NS } from "./constants.js";
import { isUUID } from "./utils.js";
import { state } from "./state.js";

export function parseModel(raw) {
  state.allElements = [];
  state.allRelations = [];
  state.elemMap = {};
  state.currentModelNs = "";

  const roots = Array.isArray(raw.content) ? raw.content : [raw];
  const rootObj = roots[0] ?? {};

  // Store ns map for use in walkNode (prefix → full URI resolution for ECORE_NS check etc.)
  state.modelNsMap = raw.ns && typeof raw.ns === "object" ? raw.ns : {};

  // Resolve model namespace: extract root eClass prefix, look up full URI in ns map.
  // ns is an object at the top level of the JSON response: { [prefix]: fullURI, … }
  const rootEClass = rootObj.eClass ?? "";
  const nsMap = state.modelNsMap;
  const col = rootEClass.lastIndexOf(":");
  if (col > 0) {
    const prefix = rootEClass.slice(0, col);
    state.currentModelNs = nsMap[prefix] ?? prefix;
  }

  roots.forEach((root) => walkData(root?.data ?? {}, null));
}

function walkData(d, parentId) {
  if (!d || typeof d !== "object") return;
  for (const [key, val] of Object.entries(d)) {
    if (!Array.isArray(val)) continue;
    const edgeType = key;
    for (let i = 0; i < val.length; i++) {
      const item = val[i];
      if (item && typeof item === "object" && item.eClass) {
        walkNode(item, parentId);
      } else if (isUUID(item) && parentId) {
        state.allRelations.push({
          id: `${parentId}_${key}_${i}`,
          type: edgeType,
          source: parentId,
          target: item,
          name: "",
        });
      }
    }
  }
}

function walkNode(node, parentId) {
  const raw = node.eClass;
  const col = raw.lastIndexOf(":");
  const ns = col >= 0 ? raw.slice(0, col) : "";
  const type = col >= 0 ? raw.slice(col + 1) : raw;
  const fullNs = state.modelNsMap[ns] ?? ns; // resolve short prefix → full URI

  // Skip ecore internal key-value map entries — compare full namespace URI
  if (type === "EStringToStringMapEntry" && fullNs === ECORE_NS) return;

  const d = node.data ?? {};
  const id = node.id ?? `_${state.allElements.length + state.allRelations.length}`;

  // Rule 1: standalone edge
  if (d.source && d.target) {
    state.allRelations.push({ id, type, source: d.source, target: d.target, name: d.name || "" });
    walkData(d, id);
    return;
  }

  // Rule 2: embedded reference (target only, no source)
  if (d.target && !d.source && parentId) {
    state.allRelations.push({ id, type, source: parentId, target: d.target, name: d.name || "" });
    return;
  }

  // Rule 3: graph node — track containment parent
  const parentIsNode = parentId != null && state.elemMap[parentId] !== undefined;
  const elem = {
    id,
    type,
    ns,
    name: d.name || d.label || d.title || type,
    doc: d.documentation || d.description || d.doc || "",
    parent: parentIsNode ? parentId : null,
  };
  state.allElements.push(elem);
  state.elemMap[id] = elem;
  walkData(d, id);
}
