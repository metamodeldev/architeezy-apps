/**
 * URL parameter handling for UI state.
 *
 * @module ui/url
 * @package
 */

import { registerUrlParams } from '../routing/index.js';
import { getCurrentView } from './state.js';

export function registerViewUrlParams() {
  registerUrlParams(
    () => {
      const view = getCurrentView();
      return view !== 'graph' ? [`view=${view}`] : [];
    },
    { priority: 40 },
  );
}
