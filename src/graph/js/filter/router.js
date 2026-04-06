/**
 * Filter URL router — URL sync and restore for filter state.
 *
 * @module filter/router
 * @package
 */

import { elementTypeCounts, relationTypeCounts } from '../model/index.js';
import { navParams, replaceParams } from '../router/index.js';
import { effect, untrack } from '../signals/index.js';
import { applyUrlFilters } from './component.js';
import { getActiveElemTypes, getActiveRelTypes } from './service.js';

// ── URL SYNC ──────────────────────────────────────────────────────────────────

/**
 * Registers a reactive effect that keeps URL `entities` and `relationships` params in sync with
 * filter state.
 */
export function subscribeFilterToUrl() {
  effect(() => {
    const elemTypes = getActiveElemTypes();
    const relTypes = getActiveRelTypes();
    const allElemTypes = Object.keys(elementTypeCounts.value);
    const allRelTypes = Object.keys(relationTypeCounts.value);
    if (allElemTypes.length === 0 && allRelTypes.length === 0) {
      return;
    }
    const entitiesParam =
      allElemTypes.length > 0 && elemTypes.size < allElemTypes.length
        ? [...elemTypes].join(',')
        : undefined;
    const relationshipsParam =
      allRelTypes.length > 0 && relTypes.size < allRelTypes.length
        ? [...relTypes].join(',')
        : undefined;
    replaceParams({ entities: entitiesParam, relationships: relationshipsParam });
  });
}

// ── URL RESTORE ───────────────────────────────────────────────────────────────

/**
 * Applies filter state from URL parameters.
 *
 * @param {string | undefined} entities - Comma-separated entity type names, or undefined for all.
 * @param {string | undefined} relationships - Comma-separated relationship type names, or undefined
 *   for all.
 */
export function restoreFromUrl(entities, relationships) {
  const allETypes = Object.keys(elementTypeCounts.value);
  const allRTypes = Object.keys(relationTypeCounts.value);
  applyUrlFilters(
    entities === undefined ? allETypes : entities.split(',').filter(Boolean),
    relationships === undefined ? allRTypes : relationships.split(',').filter(Boolean),
  );
}

// ── POPSTATE HANDLER ──────────────────────────────────────────────────────────

/** Registers a reactive effect that restores filter state from URL params on popstate navigation. */
export function initFilterRouter() {
  effect(() => {
    const nav = navParams.value;
    if (!nav) {
      return;
    }
    untrack(() => restoreFromUrl(nav.entities, nav.relationships));
  });
}
