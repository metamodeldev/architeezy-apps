/**
 * Highlight module — public API.
 *
 * @module highlight
 */

export { init, initHighlightComponent, wireHighlightEvents } from './component.js';
export {
  getHighlightEnabled,
  saveHighlightStateToStorage,
  setHighlightEnabled,
} from './service.js';
