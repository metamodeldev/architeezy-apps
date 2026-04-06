/**
 * Tooltip functionality for graph nodes.
 *
 * @module graph/tooltip
 * @package
 */

/**
 * Escapes HTML special characters in a string.
 *
 * @param {string} s - The input string.
 * @returns {string} The escaped string.
 */
function escHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

let _enabled = true;
let _lsKey = 'graphTooltips';
let _cy;

/**
 * Configures the tooltip module with app-specific settings and binds events. Now uses data directly
 * from Cytoscape elements - no getElem callback needed.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance to attach tooltip events to.
 * @param {string} [lsKey] - LocalStorage key for tooltip enabled state.
 */
export function initTooltips(cy, lsKey = 'graphTooltips') {
  _cy = cy;
  _lsKey = lsKey;
  _enabled = globalThis.localStorage?.getItem(lsKey) !== 'false';
  bindTooltipEvents(cy);
}

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
  globalThis.localStorage?.setItem(_lsKey, String(enabled));
  if (!enabled) {
    _hide();
  }
}

function _show(data, clientX, clientY) {
  if (!_enabled) {
    return;
  }
  const tooltip = document.getElementById('node-tooltip');
  const nsLabel = data.ns ? `${escHtml(data.ns)}:` : '';
  tooltip.innerHTML =
    `<div class="tooltip-name">${escHtml(data.label || data.type)}</div>` +
    `<div class="tooltip-type">${nsLabel}${escHtml(data.type)}</div>` +
    (data.doc ? `<div class="tooltip-doc">${escHtml(data.doc)}</div>` : '');
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
    _show(e.target.data(), clientX, clientY);
  });
  cy.on('mousemove', 'node', (e) => {
    const { clientX, clientY } = e.originalEvent;
    _move(clientX, clientY);
  });
  cy.on('mouseout', 'node', _hide);
  cy.on('tap', _hide);
}
