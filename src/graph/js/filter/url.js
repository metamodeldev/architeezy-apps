/**
 * URL parameter handling for filter state.
 *
 * @module filter/url
 * @package
 */

import { getAllElements, getAllRelations } from '../model/index.js';
import { registerUrlParams } from '../routing/index.js';
import { getActiveElemTypes, getActiveRelTypes } from './state.js';

export function registerFilterUrlParams() {
  registerUrlParams(
    () => {
      const parts = [];
      const allETypes = [...new Set(getAllElements().map((e) => e.type))];
      const activeE = allETypes.filter((t) => getActiveElemTypes().has(t));
      if (activeE.length < allETypes.length) {
        parts.push(`entities=${activeE.map((e) => encodeURIComponent(e)).join(',')}`);
      }
      const allRTypes = [...new Set(getAllRelations().map((r) => r.type))];
      const activeR = allRTypes.filter((t) => getActiveRelTypes().has(t));
      if (activeR.length < allRTypes.length) {
        parts.push(`relationships=${activeR.map((r) => encodeURIComponent(r)).join(',')}`);
      }
      return parts;
    },
    { priority: 30 },
  );
}
