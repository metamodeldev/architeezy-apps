/**
 * Sidebar collapse and panel toggle management.
 *
 * @module ui/sidebar
 * @package
 */

import {
  getPanelCollapsed,
  setPanelCollapsed,
  getSidebarCollapsed,
  setSidebarCollapsed,
} from './state.js';

// ============ SIDEBAR PANELS ====================================================

/**
 * Toggles the collapsed state of a sidebar section with animation and rotates its chevron icon.
 *
 * @param {string} id - The `id` attribute of the section element to toggle.
 */
export function toggleSection(id) {
  const section = document.getElementById(id);
  const collapsed = section.classList.toggle('collapsed');
  // Update button's aria-expanded attribute
  const toggleBtn = document.querySelector(`.sidebar-toggle-btn[data-section="${id}"]`);
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', !collapsed);
  }
  const icon = document.getElementById(`icon-${id}`);
  if (icon) {
    icon.classList.toggle('rotated', collapsed);
  }
  // Persist panel collapsed state
  setPanelCollapsed(id, collapsed);
}

/** Toggles the collapsed state of the entire left sidebar. */
export function toggleSidebar() {
  const sidebar = document.getElementById('graph-sidebar');
  const btn = document.getElementById('sidebar-collapse-btn');
  const collapsed = sidebar.classList.toggle('collapsed');
  btn.textContent = collapsed ? '›' : '‹';
  btn.title = collapsed ? 'Show sidebar' : 'Hide sidebar';
  btn.setAttribute('aria-expanded', !collapsed);
  // Persist sidebar collapsed state
  setSidebarCollapsed(collapsed);
}

/** Restores sidebar collapsed state from localStorage (state module). */
export function restoreSidebarState() {
  const collapsed = getSidebarCollapsed();
  const sidebar = document.getElementById('graph-sidebar');
  const btn = document.getElementById('sidebar-collapse-btn');
  if (collapsed) {
    sidebar.classList.add('collapsed');
    btn.textContent = '›';
    btn.title = 'Show sidebar';
    btn.setAttribute('aria-expanded', 'false');
  } else {
    sidebar.classList.remove('collapsed');
    btn.textContent = '‹';
    btn.title = 'Hide sidebar';
    btn.setAttribute('aria-expanded', 'true');
  }
}

/** Restores individual panel collapsed states from localStorage (state module). */
export function restorePanelStates() {
  const panels = ['sec-elem', 'sec-rel', 'sec-detail', 'sec-settings'];
  for (const id of panels) {
    const collapsed = getPanelCollapsed(id);
    const section = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    const toggleBtn = document.querySelector(`.sidebar-toggle-btn[data-section="${id}"]`);
    if (collapsed) {
      section.classList.add('collapsed');
      if (icon) {
        icon.classList.add('rotated');
      }
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    } else {
      section.classList.remove('collapsed');
      if (icon) {
        icon.classList.remove('rotated');
      }
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    }
  }
}

/** Restores both sidebar and panel states. */
export function restoreSidebarAndPanelState() {
  restoreSidebarState();
  restorePanelStates();
}
