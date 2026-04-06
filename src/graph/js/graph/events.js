/**
 * Graph event handling and pointer interactions.
 *
 * @module graph/events
 * @package
 */

import { getCy } from './cy.js';

// Delay (ms) before treating a single tap as a click, allowing double-tap detection
const TAP_DELAY_MS = 180;

// Private module state
let tapTimer;
let pointerController;

/** Clears any pending single-tap debounce timer. */
export function cancelTapTimer() {
  clearTimeout(tapTimer);
  tapTimer = undefined;
}

/**
 * Attaches Cytoscape event handlers for tap, double-tap, canvas tap, and unselect. Single-tap is
 * debounced by `TAP_DELAY_MS` to let double-tap cancel it first.
 *
 * @param {cytoscape.Core} cy - The Cytoscape instance.
 * @param {function(string): void} onNodeTap - Called with the node ID on single tap.
 * @param {function(string): void} onNodeDblTap - Called with the node ID on double tap.
 * @param {function(): void} onCanvasTap - Called when the canvas background is tapped.
 */
export function bindCyEvents(cy, onNodeTap, onNodeDblTap, onCanvasTap) {
  let _awaitingFirstNodeTap = false;
  let _prevTapWasCanvas = false;

  cy.on('tap', 'node', (e) => {
    _prevTapWasCanvas = _awaitingFirstNodeTap;
    _awaitingFirstNodeTap = false;
    clearTimeout(tapTimer);
    const nodeId = e.target.id();
    tapTimer = setTimeout(() => {
      if (onNodeTap) {
        onNodeTap(nodeId);
      }
      document.dispatchEvent(new CustomEvent('graph:nodeTap', { detail: { nodeId } }));
    }, TAP_DELAY_MS);
  });
  cy.on('dbltap', 'node', (e) => {
    if (_prevTapWasCanvas) {
      _prevTapWasCanvas = false;
      return;
    }
    clearTimeout(tapTimer);
    const nodeId = e.target.id();
    if (onNodeDblTap) {
      onNodeDblTap(nodeId);
    }
    document.dispatchEvent(new CustomEvent('graph:nodeDblTap', { detail: { nodeId } }));
  });
  cy.on('tap', (e) => {
    if (e.target === cy) {
      _awaitingFirstNodeTap = true;
      if (onCanvasTap) {
        onCanvasTap();
      }
      document.dispatchEvent(new CustomEvent('graph:canvasTap', { detail: {} }));
    }
  });

  // Unselect handler removed - drill root management handled by drill controller
}

/**
 * Registers additional tap and select handlers on graph nodes. Can be called multiple times to add
 * independent handlers (e.g. from different features).
 *
 * @param {(nodeId: string) => void} handler - Called with the node ID on tap or select.
 */
export function bindNodeInteraction(handler) {
  const cy = getCy();
  if (!cy) {
    return;
  }
  cy.on('tap', 'node', (e) => handler(e.target.id()));
  cy.on('select', 'node', (e) => handler(e.target.id()));
}

/**
 * Attaches native DOM event listeners to the Cytoscape container for: - Middle-mouse button panning
 * - Wheel zoom (cursor-centred, 1.3× per notch)
 */
export function setupPointerInteractions() {
  if (pointerController) {
    pointerController.abort();
  }
  pointerController = new AbortController();
  const { signal } = pointerController;

  const container = document.getElementById('cy');
  const cy = getCy();

  container.addEventListener(
    'mousedown',
    (e) => {
      if (e.button !== 1) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const panStart = { ...cy.pan() };
      const mouseStart = { x: e.clientX, y: e.clientY };
      function onMove(mv) {
        return cy.pan({
          x: panStart.x + mv.clientX - mouseStart.x,
          y: panStart.y + mv.clientY - mouseStart.y,
        });
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    { passive: false, signal },
  );
  container.addEventListener('auxclick', (e) => e.preventDefault(), { signal });

  container.addEventListener(
    'wheel',
    (e) => {
      if (!cy) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
      const level = Math.max(cy.minZoom(), Math.min(cy.maxZoom(), cy.zoom() * factor));
      cy.zoom({
        level,
        renderedPosition: { x: e.offsetX, y: e.offsetY },
      });
    },
    { passive: false, capture: true, signal },
  );
}
