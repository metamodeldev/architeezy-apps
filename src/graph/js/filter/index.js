/**
 * Filter module public API.
 *
 * @module filter
 */

export {
  applyUrlFilters,
  applyVisibility,
  buildFiltersUI,
  filterSearch,
  init,
  initFilter,
  loadFilterStateUI,
  renderFilterList,
  selectAll,
  updateElemFilterDim,
  updateRelFilterCounts,
  wireFilterEvents,
} from './component.js';
export { initFilterRouter, restoreFromUrl, subscribeFilterToUrl } from './router.js';
export {
  computeFilterCounts,
  computeVisRelCounts,
  getActiveElemTypes,
  getActiveRelTypes,
  getElemTypeTotals,
  getRelTypeTotals,
  initializeFilterService,
  loadFilterStateFromStorage,
  saveFilterStateToStorage,
  scopeElemCounts,
  setActiveElemTypes,
  setActiveRelTypes,
  setAllElemTypes,
  setAllRelTypes,
  setFilterTypes,
  setScopeElemCounts,
  setShowAllElem,
  setShowAllRel,
  setVisRelCounts,
  showAllElem,
  showAllRel,
  toggleElemType,
  toggleRelType,
  visRelCounts,
} from './service.js';
