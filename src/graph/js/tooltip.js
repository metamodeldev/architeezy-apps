// ── NODE TOOLTIPS ─────────────────────────────────────────────────────────────

import { getElemMap } from './model.js';

// Inlined to avoid a circular dependency (graph.js → tooltip.js → ui.js → graph.js).
function escHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const LS_KEY = 'architeezyGraphTooltips';

let _enabled = globalThis.localStorage?.getItem(LS_KEY) !== 'false';

/**
 * Returns whether node tooltips are currently enabled.
 *
 * @returns {boolean} True if node tooltips are enabled.
 */
export function isTooltipsEnabled() {
  return _enabled;
}

/**
 * Enables or disables node tooltips and persists the choice to localStorage.
 *
 * @param {boolean} enabled - True to show tooltips on node hover, false to hide them.
 */
export function setTooltipsEnabled(enabled) {
  _enabled = enabled;
  globalThis.localStorage?.setItem(LS_KEY, String(enabled));
  if (!enabled) {
    _hide();
  }
}

function _show(id, clientX, clientY) {
  if (!_enabled) {
    return;
  }
  const elem = getElemMap()[id];
  if (!elem) {
    return;
  }
  const tooltip = document.getElementById('node-tooltip');
  const nsLabel = elem.ns ? `${escHtml(elem.ns)}:` : '';
  tooltip.innerHTML =
    `<div class="tooltip-name">${escHtml(elem.name || elem.type)}</div>` +
    `<div class="tooltip-type">${nsLabel}${escHtml(elem.type)}</div>` +
    (elem.doc ? `<div class="tooltip-doc">${escHtml(elem.doc)}</div>` : '');
  tooltip.style.left = `${clientX + 14}px`;
  tooltip.style.top = `${clientY + 14}px`;
  tooltip.classList.add('visible');
}

function _move(clientX, clientY) {
  if (!_enabled) {
    return;
  }
  const tooltip = document.getElementById('node-tooltip');
  tooltip.style.left = `${clientX + 14}px`;
  tooltip.style.top = `${clientY + 14}px`;
}

function _hide() {
  document.getElementById('node-tooltip').classList.remove('visible');
}

/**
 * Binds mouseover, mousemove, mouseout, and tap handlers on the Cytoscape instance to show and hide
 * node tooltips.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance to attach tooltip events to.
 */
export function bindTooltipEvents(cy) {
  cy.on('mouseover', 'node', (e) => {
    const { clientX, clientY } = e.originalEvent;
    _show(e.target.id(), clientX, clientY);
  });
  cy.on('mousemove', 'node', (e) => {
    const { clientX, clientY } = e.originalEvent;
    _move(clientX, clientY);
  });
  cy.on('mouseout', 'node', _hide);
  cy.on('tap', _hide);
}
