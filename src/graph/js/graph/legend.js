/**
 * Draggable legend overlay for the graph.
 *
 * Manages #graph-legend DOM element.
 *
 * @module graph/legend
 */

import { elemColor, relColor } from '../palette.js';
import { escHtml } from '../utils.js';
import { getVisibleElements } from './display.js';

const STORAGE_KEY_VISIBLE = 'architeezyGraphLegend';
const STORAGE_KEY_POS = 'architeezyGraphLegendPos';

let _enabled = false;

/**
 * Returns whether the legend is currently enabled.
 *
 * @returns {boolean} True if legend is visible.
 */
export function isLegendEnabled() {
  return _enabled;
}

/**
 * Returns whether the legend is currently enabled. Alias for view-switching use.
 *
 * @returns {boolean} True if legend is visible.
 */
export function getLegendEnabled() {
  return _enabled;
}

// ── POSITION ──────────────────────────────────────────────────────────────────

const CLAMP_MARGIN = 5;

function savePosition(x, y) {
  try {
    localStorage.setItem(STORAGE_KEY_POS, JSON.stringify({ x, y }));
  } catch {
    // Ignore storage errors
  }
}

function loadPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Default on parse errors
  }
  return { x: 16, y: 16 };
}

/**
 * Clamps `x` and `y` so the legend stays within its parent bounds with margin.
 *
 * @param {HTMLElement} el - The legend element.
 * @param {number} x - Proposed left offset.
 * @param {number} y - Proposed top offset.
 * @returns {{ x: number; y: number }} Clamped coordinates.
 */
function clampToParent(el, x, y) {
  const parent = el.parentElement;
  if (!parent) {
    return { x, y };
  }
  const maxX = parent.clientWidth - el.offsetWidth - CLAMP_MARGIN;
  const maxY = parent.clientHeight - el.offsetHeight - CLAMP_MARGIN;
  return {
    x: Math.max(CLAMP_MARGIN, Math.min(x, maxX)),
    y: Math.max(CLAMP_MARGIN, Math.min(y, maxY)),
  };
}

function applyPosition(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

// ── DRAG ──────────────────────────────────────────────────────────────────────

function makeDraggable(el) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  el.addEventListener('mousedown', (e) => {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origLeft = Number.parseInt(el.style.left, 10) || 0;
    origTop = Number.parseInt(el.style.top, 10) || 0;
    el.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) {
      return;
    }
    applyPosition(el, origLeft + (e.clientX - startX), origTop + (e.clientY - startY));
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    el.style.cursor = 'grab';
    const raw = {
      x: Number.parseInt(el.style.left, 10) || 0,
      y: Number.parseInt(el.style.top, 10) || 0,
    };
    const { x, y } = clampToParent(el, raw.x, raw.y);
    applyPosition(el, x, y);
    savePosition(x, y);
  });
}

// ── CONTENT ───────────────────────────────────────────────────────────────────

function escAttr(str) {
  return str.replaceAll('"', '&quot;');
}

/**
 * Rebuilds the legend DOM content from currently visible graph elements. No-op when the legend is
 * disabled or not yet in the DOM.
 */
export function updateLegend() {
  const el = document.getElementById('graph-legend');
  if (!el || !_enabled) {
    return;
  }

  const { nodes, edges } = getVisibleElements();
  const elemTypes = [...new Set(nodes.map((n) => n.type))];
  const relTypes = [...new Set(edges.filter((e) => e.type !== '_containment').map((e) => e.type))];

  let html = '';

  if (elemTypes.length > 0) {
    html += '<div class="legend-section-label">Entities</div>';
    for (const type of elemTypes) {
      html +=
        `<div class="legend-row" data-type="${escAttr(type)}" data-kind="elem">` +
        `<span class="legend-dot" style="--dot-color:${elemColor(type)}"></span>` +
        `<span class="legend-type-name">${escHtml(type)}</span>` +
        `</div>`;
    }
  }

  if (relTypes.length > 0) {
    html += '<div class="legend-section-label">Relationships</div>';
    for (const type of relTypes) {
      html +=
        `<div class="legend-row" data-type="${escAttr(type)}" data-kind="rel">` +
        `<span class="legend-dot" style="--dot-color:${relColor(type)}"></span>` +
        `<span class="legend-type-name">${escHtml(type)}</span>` +
        `</div>`;
    }
  }

  el.innerHTML = html;
}

/**
 * Updates faded state of legend rows based on highlighted types.
 *
 * @param {Set<string>} fadedElemTypes - Element type names where every visible node is faded.
 * @param {Set<string>} fadedRelTypes - Relationship type names where every visible edge is faded.
 */
export function updateLegendHighlight(fadedElemTypes, fadedRelTypes) {
  const el = document.getElementById('graph-legend');
  if (!el || !_enabled) {
    return;
  }
  for (const row of el.querySelectorAll('.legend-row')) {
    const type = row.dataset.type;
    const kind = row.dataset.kind;
    const isFaded = kind === 'elem' ? fadedElemTypes.has(type) : fadedRelTypes.has(type);
    row.classList.toggle('faded', isFaded);
  }
}

// ── VISIBILITY ────────────────────────────────────────────────────────────────

/**
 * Shows or hides the legend and persists the preference to localStorage.
 *
 * @param {boolean} enabled - True to show the legend, false to hide it.
 */
export function setLegendEnabled(enabled) {
  _enabled = enabled;
  const el = document.getElementById('graph-legend');
  if (!el) {
    return;
  }
  if (enabled) {
    el.classList.remove('hidden');
    const { x: rawX, y: rawY } = loadPosition();
    const { x, y } = clampToParent(el, rawX, rawY);
    applyPosition(el, x, y);
    updateLegend();
  } else {
    el.classList.add('hidden');
  }
  try {
    localStorage.setItem(STORAGE_KEY_VISIBLE, String(enabled));
  } catch {
    // Ignore
  }
}

// ── EVENT WIRING ──────────────────────────────────────────────────────────────

/** Wires the legend toggle button (#legend-toggle). */
export function wireLegendEvents() {
  const toggle = document.getElementById('legend-toggle');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      setLegendEnabled(e.target.checked);
    });
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────

/**
 * Initialises the legend: restores persisted position and visibility, wires drag. Call once during
 * app boot before any model loads.
 */
export function initLegend() {
  const el = document.getElementById('graph-legend');
  if (!el) {
    return;
  }

  const { x: rawX, y: rawY } = loadPosition();
  const { x, y } = clampToParent(el, rawX, rawY);
  applyPosition(el, x, y);

  let enabled = false;
  try {
    enabled = localStorage.getItem(STORAGE_KEY_VISIBLE) === 'true';
  } catch {
    // Default to disabled
  }

  const toggle = document.getElementById('legend-toggle');
  if (toggle) {
    toggle.checked = enabled;
  }

  makeDraggable(el);

  const parent = el.parentElement;
  if (parent) {
    new ResizeObserver(() => {
      const cx = Number.parseInt(el.style.left, 10) || 0;
      const cy = Number.parseInt(el.style.top, 10) || 0;
      const { x: newX, y: newY } = clampToParent(el, cx, cy);
      applyPosition(el, newX, newY);
    }).observe(parent);
  }

  setLegendEnabled(enabled);
  wireLegendEvents();
}
