/**
 * URL-based navigation routing.
 *
 * Pure URL interpretation and parsing.
 *
 * @module navigation/router
 */

import { readUrlParams } from '../routing/index.js';

export { readUrlParams };

/**
 * Parses URL parameters into a normalized navigation state object.
 *
 * @param {URLSearchParams} params - URL search parameters.
 * @returns {{
 *   modelId: string | undefined;
 *   drill: { nodeId: string; depth: number } | undefined;
 *   filter: { entities: string | undefined; relationships: string | undefined };
 *   view: string | undefined;
 * }}
 *   Normalized navigation state.
 */
export function parseNavigationState(params) {
  return {
    modelId: params.get('model'),
    drill: params.get('entity')
      ? {
          nodeId: params.get('entity'),
          depth: params.has('depth') ? Number(params.get('depth')) : undefined,
        }
      : undefined,
    filter: {
      entities: params.get('entities') ?? undefined,
      relationships: params.get('relationships') ?? undefined,
    },
    view: params.get('view'),
  };
}
