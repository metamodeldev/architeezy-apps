/**
 * UI module public API.
 *
 * Central exports for UI functionality. Import from here, not internal files.
 *
 * @module ui
 */

// ── UI MODULE PUBLIC API ───────────────────────────────────────────────────────

export {
  getLegendEnabled,
  initLegend,
  init as initLegendModule,
  setLegendEnabled,
  updateLegend,
} from './legend.js';

export { getCurrentView, switchView } from './view.js';

export { hideLoading, hideToast, showError, showLoading, showToast } from './notifications.js';

export { restoreSidebarAndPanelState, toggleSection, toggleSidebar } from './sidebar.js';

export { setTheme } from './theme.js';

export { registerViewUrlParams } from './url.js';

export { clearDetail, init as initDetail, showDetail } from './detail.js';
export { init as initEvents } from './events.js';
