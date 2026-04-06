/**
 * Graph export module public API.
 *
 * @module graph-export
 */

import { wireExportEvents } from './exporter.js';

export { exportGraphImage, wireExportEvents } from './exporter.js';

export function init() {
  wireExportEvents();
}
