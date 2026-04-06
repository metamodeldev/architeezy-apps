/**
 * Graph module bootstrap — initializes all graph sub-systems at app boot.
 *
 * @module graph/bootstrap
 * @package
 */

import { mountGraphComponent } from './component.js';
import { wireContainmentEvents, getContainmentMode } from './containment.js';
import { wireGraphControlEvents, wireKeyboardEvents } from './controls.js';
import { initLegend } from './legend.js';
import { initSearchIntegration } from './search.js';
import { initializeGraphService } from './service.js';
import { isTooltipsEnabled, setTooltipsEnabled } from './tooltip.js';

/**
 * Initializes the graph module: service reactive effects, component display, search integration,
 * legend, and all graph control event wiring. Safe to call at app boot before a model is loaded.
 */
export function init() {
  initializeGraphService();
  mountGraphComponent();
  initSearchIntegration();
  initLegend();
  wireContainmentEvents();
  wireGraphControlEvents();
  wireKeyboardEvents();

  const containmentSelect = document.getElementById('containment-select');
  if (containmentSelect) {
    containmentSelect.value = getContainmentMode();
  }

  const tooltipsToggle = document.getElementById('tooltips-toggle');
  if (tooltipsToggle) {
    tooltipsToggle.checked = isTooltipsEnabled();
    tooltipsToggle.addEventListener('change', (e) => setTooltipsEnabled(e.target.checked));
  }

  const layoutSelect = document.getElementById('layout-select');
  if (layoutSelect) {
    const savedLayout = localStorage.getItem('architeezyGraphLayout');
    const validLayouts = ['fcose', 'dagre', 'cose', 'breadthfirst', 'grid', 'circle'];
    if (savedLayout && validLayouts.includes(savedLayout)) {
      layoutSelect.value = savedLayout;
    }
  }
}
