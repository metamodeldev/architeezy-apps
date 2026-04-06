/**
 * Theme management and persistence.
 *
 * @module view/theme
 */

import { cyBg, refreshEdgeLabelBg } from '../graph/index.js';
import { getStoredTheme, setStoredTheme } from './service.js';

/** Restores theme from localStorage and wires theme toggle buttons. */
export function init() {
  setTheme(getStoredTheme());
  wireThemeEvents();
}

/**
 * Applies a colour theme globally and persists the choice to localStorage. Also refreshes the
 * Cytoscape edge label background to match the new canvas colour.
 *
 * @param {'dark' | 'light' | 'system'} theme - Theme name.
 */
/** Wires theme toggle buttons. */
export function wireThemeEvents() {
  for (const btn of document.querySelectorAll('.theme-btn')) {
    const theme = btn.id.replace('theme-btn-', '');
    if (['dark', 'light', 'system'].includes(theme)) {
      btn.addEventListener('click', () => setTheme(theme));
    }
  }
}

export function setTheme(theme) {
  const validThemes = ['dark', 'light', 'system'];
  const resolvedTheme = validThemes.includes(theme) ? theme : 'system';

  document.documentElement.dataset.theme = resolvedTheme;
  setStoredTheme(resolvedTheme);
  for (const b of document.querySelectorAll('.theme-btn')) {
    b.classList.toggle('active', b.id === `theme-btn-${resolvedTheme}`);
  }
  refreshEdgeLabelBg(cyBg);
}
