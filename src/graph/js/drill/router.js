/**
 * Drill URL router — restores drill state from URL params on navigation.
 *
 * @module drill/router
 */

import { navParams } from '../router/index.js';
import { effect, untrack } from '../signals/index.js';
import { restoreFromUrl } from './service.js';

/** Registers a reactive effect that restores drill state from URL params on popstate navigation. */
export function initDrillRouter() {
  effect(() => {
    const nav = navParams.value;
    if (!nav) {
      return;
    }
    untrack(() => restoreFromUrl(nav.entity, nav.depth ? Number(nav.depth) : undefined));
  });
}
