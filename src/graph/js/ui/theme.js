/**
 * Theme management and persistence.
 *
 * @module ui/theme
 * @package
 */

import { cyBg, refreshEdgeLabelBg } from '../graph/index.js';
import { setStoredTheme } from './state.js';

// ============ THEME =============================================================

/**
 * Applies a colour theme globally and persists the choice to localStorage. Also refreshes the
 * Cytoscape edge label background to match the new canvas colour.
 *
 * @param {'dark' | 'light' | 'system'} theme - Theme name.
 */
export function setTheme(theme) {
  // Validate theme: fall back to 'system' for any unrecognized value
  const validThemes = ['dark', 'light', 'system'];
  const resolvedTheme = validThemes.includes(theme) ? theme : 'system';

  document.documentElement.dataset.theme = resolvedTheme;
  setStoredTheme(resolvedTheme);
  for (const b of document.querySelectorAll('.theme-btn')) {
    b.classList.toggle('active', b.id === `theme-btn-${resolvedTheme}`);
  }
  refreshEdgeLabelBg(cyBg);
}
