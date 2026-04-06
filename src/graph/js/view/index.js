/**
 * View module public API.
 *
 * @module view
 */

import { wireTabGroupEvents } from './component.js';
import { init as initDetailPanel } from './detail-panel.js';
import { init as initViewRouter } from './router.js';
import { init as initSidebar } from './sidebar.js';
import { init as initTheme } from './theme.js';

export { currentView } from './service.js';
export {
  handleModelEmpty,
  handleModelLoaded,
  restoreFromUrl as restoreViewFromUrl,
  switchView,
  wireTabGroupEvents,
} from './component.js';
export { showDetail } from './detail-panel.js';

/** Initializes the view module: theme, sidebar, detail panel, tab group, and URL router. */
export function init() {
  initTheme();
  initSidebar();
  initDetailPanel();
  wireTabGroupEvents();
  initViewRouter();
}
