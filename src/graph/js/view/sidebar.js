/**
 * Sidebar collapse and panel toggle management.
 *
 * @module view/sidebar
 */

import {
  getPanelCollapsed,
  setPanelCollapsed,
  getSidebarCollapsed,
  setSidebarCollapsed,
} from './service.js';

/**
 * Toggles the collapsed state of a sidebar section with animation and rotates its chevron icon.
 *
 * @param {string} id - The `id` attribute of the section element to toggle.
 */
export function toggleSection(id) {
  const section = document.getElementById(id);
  const collapsed = section.classList.toggle('collapsed');
  const toggleBtn = document.querySelector(`.sidebar-toggle-btn[data-section="${id}"]`);
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', !collapsed);
  }
  const icon = document.getElementById(`icon-${id}`);
  if (icon) {
    icon.classList.toggle('rotated', collapsed);
  }
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
  setSidebarCollapsed(collapsed);
}

/** Restores sidebar collapsed state from localStorage. */
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

/** Restores individual panel collapsed states from localStorage. */
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

/** Restores sidebar state from localStorage and wires sidebar toggle buttons. */
export function init() {
  restoreSidebarAndPanelState();
  wireSidebarEvents();
}

/** Wires sidebar toggle buttons. */
export function wireSidebarEvents() {
  document.querySelector('aside').addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.sidebar-toggle-btn[data-section]');
    if (toggleBtn) {
      toggleSection(toggleBtn.dataset.section);
    }
  });

  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleSidebar);
  }
}
