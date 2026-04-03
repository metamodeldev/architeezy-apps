// ── STORAGE ─────────────────────────────────────────────────────────────────
//
// Saved matrices: per model namespace URI → array of MatrixDefinition
// Templates:      per model contentType URI → array of MatrixDefinition
//
// Keys:
//   ArchiteezyTableMatrices   → { [nsUri]: MatrixDefinition[] }
//   ArchiteezyTableTemplates  → { [contentType]: MatrixDefinition[] }
//   ArchiteezyTableLastDef    → { [nsUri]: MatrixDefinition }
//   ArchiteezyTableModelUrl   → string (last loaded model content URL)

import { MAX_TEMPLATES } from './constants.js';
import { state } from './state.js';

// ── SAVED MATRICES ──────────────────────────────────────────────────────────

function readMatrices() {
  try {
    return JSON.parse(localStorage.getItem('architeezyTableMatrices') ?? '{}');
  } catch {
    return {};
  }
}

function writeMatrices(data) {
  localStorage.setItem('architeezyTableMatrices', JSON.stringify(data));
}

/**
 * Returns saved matrices for the current model namespace.
 *
 * @returns {Array} Array of saved MatrixDefinition objects, or empty array if
 * no namespace is set.
 */
export function getSavedMatrices() {
  if (!state.currentModelNs) {
    return [];
  }
  return readMatrices()[state.currentModelNs] ?? [];
}

/**
 * Saves or updates a matrix definition. Returns "ok" or "limit_reached".
 *
 * @param {object} def - The matrix definition to save or update.
 * @returns {'ok' | 'limit_reached'} "ok" on success, "limit_reached" when the per-namespace limit
 *   is exceeded.
 */
export function saveMatrix(def) {
  const ns = state.currentModelNs;
  if (!ns) {
    return 'ok';
  }
  const data = readMatrices();
  const list = data[ns] ?? [];
  const idx = list.findIndex((d) => d.id === def.id);
  if (idx >= 0) {
    list[idx] = def;
  } else {
    if (list.length >= MAX_TEMPLATES) {
      return 'limit_reached';
    }
    list.push(def);
  }
  data[ns] = list;
  writeMatrices(data);
  return 'ok';
}

/**
 * Deletes a saved matrix by id.
 *
 * @param {string} id - The UUID of the matrix to delete.
 */
export function deleteMatrix(id) {
  const ns = state.currentModelNs;
  if (!ns) {
    return;
  }
  const data = readMatrices();
  data[ns] = (data[ns] ?? []).filter((d) => d.id !== id);
  writeMatrices(data);
}

// ── TEMPLATES ───────────────────────────────────────────────────────────────

function readTemplates() {
  try {
    return JSON.parse(localStorage.getItem('architeezyTableTemplates') ?? '{}');
  } catch {
    return {};
  }
}

function writeTemplates(data) {
  localStorage.setItem('architeezyTableTemplates', JSON.stringify(data));
}

/**
 * Returns templates for the current model contentType.
 *
 * @returns {Array} Array of template MatrixDefinition objects, or empty array if no contentType is
 *   set.
 */
export function getTemplates() {
  if (!state.currentModelContentType) {
    return [];
  }
  return readTemplates()[state.currentModelContentType] ?? [];
}

/**
 * Saves a definition as a template for the current model contentType. Returns "ok" or
 * "limit_reached".
 *
 * @param {object} def - The matrix definition to save as a template.
 * @returns {'ok' | 'limit_reached'} "ok" on success, "limit_reached" when the per-contentType limit
 *   is exceeded.
 */
export function saveTemplate(def) {
  const ct = state.currentModelContentType;
  if (!ct) {
    return 'ok';
  }
  const data = readTemplates();
  const list = data[ct] ?? [];
  const idx = list.findIndex((d) => d.id === def.id);
  if (idx >= 0) {
    list[idx] = def;
  } else {
    if (list.length >= MAX_TEMPLATES) {
      return 'limit_reached';
    }
    list.push(def);
  }
  data[ct] = list;
  writeTemplates(data);
  return 'ok';
}

/**
 * Deletes a template by id.
 *
 * @param {string} id - The UUID of the template to delete.
 */
export function deleteTemplate(id) {
  const ct = state.currentModelContentType;
  if (!ct) {
    return;
  }
  const data = readTemplates();
  data[ct] = (data[ct] ?? []).filter((d) => d.id !== id);
  writeTemplates(data);
}

// ── LAST DEFINITION ─────────────────────────────────────────────────────────

/**
 * Saves the last-used definition for the current model namespace. Used to restore state on next
 * visit.
 *
 * @param {object} def - The matrix definition to persist as the last-used definition.
 */
export function saveLastDef(def) {
  const ns = state.currentModelNs;
  if (!ns) {
    return;
  }
  try {
    const data = JSON.parse(localStorage.getItem('architeezyTableLastDef') ?? '{}');
    data[ns] = def;
    localStorage.setItem('architeezyTableLastDef', JSON.stringify(data));
  } catch {
    /* Ignore */
  }
}

/**
 * Returns the last-used definition for the current model namespace, or undefined.
 *
 * @returns {object | undefined} The last-used MatrixDefinition, or undefined if
 * none is stored.
 */
export function getLastDef() {
  const ns = state.currentModelNs;
  if (!ns) {
    return;
  }
  try {
    const data = JSON.parse(localStorage.getItem('architeezyTableLastDef') ?? '{}');
    return data[ns] ?? undefined;
  } catch {
    // Ignore parse errors
  }
}
