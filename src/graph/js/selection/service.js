/**
 * SelectionService — Reactive state for node selection.
 *
 * Depends only on signals — no DOM, no Cytoscape.
 *
 * @module selection/service
 */

import { signal } from '../signals/index.js';

/** Reactive signal tracking the currently selected node ID (undefined when nothing is selected). */
const _selectedNodeId = signal();
export const [selectedNodeId, setSelectedNodeId] = _selectedNodeId.asPair();
