// ── URL ROUTING ─────────────────────────────────────────────────────────────

import { state } from './state.js';

/**
 * Serialises current state to URL. Params: model (UUID), matrix (base64url encoded JSON of current
 * def)
 */
export function syncUrl() {
  const parts = [];
  if (state.currentModelId) {
    parts.push(`model=${encodeURIComponent(state.currentModelId)}`);
  }
  if (state.currentDef) {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(state.currentDef)));
      parts.push(`matrix=${encoded}`);
    } catch {
      /* Ignore encode errors */
    }
  }
  const q = parts.join('&');
  // eslint-disable-next-line unicorn/no-null
  history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
}

/**
 * Reads URL params and returns { modelId, def }. def is decoded MatrixDefinition or null.
 *
 * @param {string} search - The URL search string to parse (defaults to location.search).
 * @returns {{ modelId: string | null; def: object | undefined }} The parsed model ID and matrix
 *   definition.
 */
export function readUrlParams(search = location.search) {
  const sp = new URLSearchParams(search);
  let def;
  const matrixParam = sp.get('matrix');
  if (matrixParam) {
    try {
      def = JSON.parse(decodeURIComponent(atob(matrixParam)));
    } catch {
      /* Malformed — ignore */
    }
  }
  return {
    modelId: sp.get('model'),
    def,
  };
}
