/**
 * URL parameter handling for drill-down state.
 *
 * @module drill-down/url
 * @package
 */

import { registerUrlParams } from '../routing/index.js';
import { getDrillDepth, getDrillNodeId } from './state.js';

export function registerDrillUrlParams() {
  registerUrlParams(
    () => {
      const nodeId = getDrillNodeId();
      return nodeId ? [`entity=${encodeURIComponent(nodeId)}`, `depth=${getDrillDepth()}`] : [];
    },
    { priority: 20 },
  );
}
