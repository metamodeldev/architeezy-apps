/**
 * Notification module public API.
 *
 * @module notification
 */

import { init as initComponent } from './component.js';

export { clearToast, hideLoading, showLoading, showToast } from './service.js';

/** Initializes the notification component (loading overlay + toast). */
export function init() {
  initComponent();
}
