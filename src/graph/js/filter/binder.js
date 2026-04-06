/**
 * Filter module initialization.
 *
 * Called on model:contentLoaded event to set up filter state and UI.
 *
 * @module filter/binder
 * @package
 */

import { initializeFilterState } from './state.js';
import { buildFiltersUI, loadFilterStateUI } from './ui.js';
import { getAllElements, getAllRelations } from '../model/index.js';

/**
 * Initializes filter module: sets up state and builds UI.
 */
export function initializeFilters() {
  const elements = getAllElements();
  const relations = getAllRelations();

  initializeFilterState(elements, relations);
  buildFiltersUI();
  loadFilterStateUI();
}
