/**
 * View switching between graph and table.
 *
 * @module ui/view
 * @package
 */

import { getLegendEnabled, setLegendEnabled } from './legend.js';
import { _setCurrentView, getCurrentView } from './state.js';

// ============ VIEW SWITCHING ====================================================

/**
 * Switches between the graph and table views. Updates tab button active states and element
 * visibility. The legend is only visible in graph view.
 *
 * @param {'graph' | 'table'} view - Target view.
 * @param {Function | null} afterSwitch - Optional callback invoked after switching to table view.
 */
export function switchView(view, afterSwitch) {
  _setCurrentView(view);
  const g = view === 'graph';
  document.getElementById('tab-graph').classList.toggle('active', g);
  document.getElementById('tab-table').classList.toggle('active', !g);
  document.getElementById('cy').classList.toggle('hidden', !g);
  document.getElementById('cy-controls').classList.toggle('hidden', !g);
  // Ensure table-view is not hidden and set visible appropriately
  const tableView = document.getElementById('table-view');
  if (tableView) {
    tableView.classList.remove('hidden');
    tableView.classList.toggle('visible', !g);
  }

  // Legend: only visible in graph view and only if legend is enabled
  const legendEl = document.getElementById('graph-legend');
  if (!legendEl) {
    // No legend element in DOM - skip
  } else if (g) {
    // Switching to graph: restore legend to its enabled state (and rebuild content if needed)
    const enabled = getLegendEnabled();
    setLegendEnabled(enabled);
  } else {
    // Switching to table: hide legend (but don't change the enabled state)
    legendEl.classList.add('hidden');
  }

  if (!g && afterSwitch) {
    afterSwitch();
  }

  // Notify view change
  document.dispatchEvent(new CustomEvent('view:changed'));
}

export { getCurrentView };
