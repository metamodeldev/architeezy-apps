/**
 * Table module public API.
 *
 * Exports reactive service and component from feature-sliced architecture.
 *
 * @module table
 * @package
 */

export { focusNode, initTableComponent, renderTable, switchTableTab } from './component.js';
export {
  clearSort,
  elementRowHtml,
  exportCsv,
  filteredElements,
  filteredRelations,
  getCurrentTab,
  getSortAsc,
  getSortCol,
  handleSortClick,
  initTableService,
  isElementsTab,
  relationRowHtml,
  setCurrentTab,
} from './service.js';
