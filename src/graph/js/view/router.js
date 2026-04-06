/**
 * View URL router — restores view state from URL params on navigation.
 *
 * @module view/router
 * @package
 */

import { navParams } from '../router/index.js';
import { effect, untrack } from '../signals/index.js';
import { restoreFromUrl as restoreViewFromUrl } from './component.js';

/** Registers popstate handler that restores view state on back/forward navigation. */
export function init() {
  effect(() => {
    const nav = navParams.value;
    if (!nav) {
      return;
    }
    untrack(() => restoreViewFromUrl(nav.view));
  });
}
