/**
 * Containment mode state management (reactive signal).
 *
 * Stores the containment mode as a signal. No effects here — graph/service.js reads
 * getContainmentMode() inside its own effect and rebuilds automatically.
 *
 * @module graph/containment
 * @package
 */

import { signal } from '../signals/index.js';

// Load initial value from localStorage
const initialMode = (() => {
  try {
    return typeof localStorage !== 'undefined'
      ? (localStorage.getItem('architeezyGraphContainment') ?? 'edge')
      : 'edge';
  } catch {
    return 'edge';
  }
})();

// Reactive signal for containment mode ('none' | 'edge' | 'compound')
const _containmentMode = signal(initialMode);

/**
 * Returns the current containment mode.
 *
 * @returns {'none' | 'edge' | 'compound'} The current containment mode.
 */
export function getContainmentMode() {
  return _containmentMode.value;
}

/**
 * Sets the containment mode and persists to localStorage.
 *
 * @param {'none' | 'edge' | 'compound'} mode - The containment mode to apply.
 */
export function setContainmentMode(mode) {
  _containmentMode.value = mode;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('architeezyGraphContainment', mode);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Wires the containment mode dropdown change event. Calls setContainmentMode, which triggers
 * reactive effects automatically.
 */
export function wireContainmentEvents() {
  const select = document.getElementById('containment-select');
  if (!select) {
    return;
  }
  select.addEventListener('change', (e) => {
    setContainmentMode(e.target.value);
  });
}

/** Initializes the containment dropdown UI to the stored value. */
export function initContainment() {
  const select = document.getElementById('containment-select');
  if (select) {
    select.value = getContainmentMode();
  }
}

export { _containmentMode as containmentModeSignal };
