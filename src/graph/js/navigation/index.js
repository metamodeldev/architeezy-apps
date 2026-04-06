/**
 * Navigation module entry point.
 *
 * Re-exports navigation-related functions for use by other modules.
 *
 * @module navigation
 */

export { prepareLoadContext, trySwitchModel } from './model-switcher.js';
export { restoreStateFromUrl, buildAfterLoadHandler, restoreCurrentModelState } from './state-restore.js';
