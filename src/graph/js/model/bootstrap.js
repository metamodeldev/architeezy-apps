/**
 * Model module bootstrap — initialises the model and activates URL sync.
 *
 * @module model/bootstrap
 * @package
 */

import { loadInitialModel } from './loader.js';
import { subscribeModelToUrl } from './router.js';

/** Loads the initial model and activates URL sync. Must be awaited during app boot. */
export async function init() {
  await loadInitialModel();
  subscribeModelToUrl();
}
