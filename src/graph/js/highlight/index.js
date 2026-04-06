/**
 * Highlight module public API.
 *
 * @module highlight
 */

export {
  clearHighlightState,
  getHighlightEnabled,
  getHighlightNodeId,
  setHighlightEnabled,
  setHighlightNodeId,
} from './state.js';
export { applyHighlight } from './apply.js';
export { bindHighlightEvents, init, wireHighlightEvents } from './ui.js';
