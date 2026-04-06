/**
 * Core URL routing utilities.
 *
 * No imports to avoid cyclic dependencies.
 *
 * @module routing
 */

// ── URL ROUTING ─────────────────────────────────────────────────────────────

// ============ CONTRIBUTOR REGISTRY ============

/** @type {{ getParams: () => string[]; priority: number }[]} */
const _contributors = [];

// ============ PUBLIC API ============

/**
 * Registers a URL parameter contributor. Each contributor returns an array of `"key=value"` strings
 * to append to the query string. Lower priority values appear earlier in the URL.
 *
 * Call this once at module-load time from any module that owns URL-reflected state (model, drill,
 * filters, view, …).
 *
 * @param {() => string[]} getParams - Returns encoded `"key=value"` strings.
 * @param {{ priority?: number }} [options] - `priority` controls param order (default 50).
 */
export function registerUrlParams(getParams, { priority = 50 } = {}) {
  _contributors.push({ getParams, priority });
  _contributors.sort((a, b) => a.priority - b.priority);
}

/**
 * Reads and returns the recognised URL query parameters.
 *
 * @returns {{
 *   modelId: string | undefined;
 *   entityId: string | undefined;
 *   depth: number | undefined;
 *   entities: string | undefined;
 *   relationships: string | undefined;
 *   view: string | undefined;
 * }}
 *   The parsed URL parameters.
 */
export function readUrlParams() {
  const sp = new URLSearchParams(location.search);
  return {
    modelId: sp.get('model'),
    entityId: sp.get('entity'),
    depth: sp.has('depth') ? Number(sp.get('depth')) : undefined,
    entities: sp.get('entities') ?? undefined,
    relationships: sp.get('relationships') ?? undefined,
    view: sp.get('view'),
  };
}

/**
 * Serialises the current application state into the URL query string and updates the address bar
 * via `history.replaceState` or `history.pushState` depending on options. Called whenever any
 * URL-reflected state changes.
 *
 * @param {{ push?: boolean }} [options] - Optional. Set `push: true` to use `pushState` instead of
 *   `replaceState`.
 */
export function syncUrl({ push = false } = {}) {
  const parts = _contributors.flatMap(({ getParams }) => getParams());
  const q = parts.join('&');
  const url = location.pathname + (q ? '?' + q : '');
  if (push) {
    // oxlint-disable-next-line unicorn/no-null
    history.pushState(null, '', url);
  } else {
    // oxlint-disable-next-line unicorn/no-null
    history.replaceState(null, '', url);
  }
}

// ============ EVENT WIRING ============

/** Wires the routing:sync event to update the URL. */
export function wireSyncUrlListener() {
  document.addEventListener('routing:sync', (e) => {
    syncUrl({ push: e.detail?.push ?? false });
  });
}
