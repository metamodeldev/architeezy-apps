/**
 * State management for highlight mode.
 *
 * @module highlight/state
 * @package
 */

let _highlightEnabled = false;
let _highlightNodeId;

export function getHighlightEnabled() {
  return _highlightEnabled;
}
export function setHighlightEnabled(enabled) {
  _highlightEnabled = enabled;
}
export function getHighlightNodeId() {
  return _highlightNodeId;
}
export function setHighlightNodeId(id) {
  _highlightNodeId = id;
}

/** Clears highlight node ID. Used when disabling highlight or entering drill. */
export function clearHighlightState() {
  _highlightNodeId = undefined;
}
