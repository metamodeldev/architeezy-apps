/**
 * Applies fading effects during highlight mode.
 *
 * Uses BFS traversal.
 *
 * @module highlight/apply
 * @package
 */

import { getDrillDepth } from '../drill-down/index.js';
import { getActiveElemTypes, getActiveRelTypes } from '../filter/index.js';
import {
  applyDisplayState,
  applyFadedClasses,
  clearFadedClasses,
  computeDrillBfs,
  getContainmentMode,
  getGraphSnapshot,
  getVisibleFadedElements,
  isGraphLoaded,
  updateStats,
} from '../graph/index.js';
import { getAllElements, getAllRelations, getElementsByTypes } from '../model/index.js';
import { getHighlightEnabled, getHighlightNodeId } from './state.js';

// eslint-disable-next-line max-statements
export function applyHighlight() {
  if (!isGraphLoaded() || !getHighlightEnabled()) {
    return;
  }

  const highlightNodeId = getHighlightNodeId();

  if (!highlightNodeId) {
    document.dispatchEvent(new CustomEvent('highlight:cleared'));
    clearFadedClasses();
    return;
  }

  const activeElemTypes = getActiveElemTypes();
  const activeRelTypes = getActiveRelTypes();
  const { nodes, edges } = getGraphSnapshot();
  const drillDepth = getDrillDepth();

  const { visibleIds, nodeDepth } = computeDrillBfs({
    rootId: highlightNodeId,
    drillDepth,
    nodes,
    edges,
    activeElemTypes,
    activeRelTypes,
    containmentMode: getContainmentMode(),
  });

  const displayNodeIds = new Set([
    ...getElementsByTypes(activeElemTypes).map((e) => e.id),
    highlightNodeId,
  ]);

  applyDisplayState({
    visibleNodeIds: displayNodeIds,
    isEdgeVisible: (srcId, tgtId, type, isContainment) =>
      displayNodeIds.has(srcId) &&
      displayNodeIds.has(tgtId) &&
      (activeRelTypes.has(type) || isContainment),
  });

  applyFadedClasses(
    (nodeId) => displayNodeIds.has(nodeId) && nodeId !== highlightNodeId && !visibleIds.has(nodeId),
    (srcId, tgtId) => {
      if (!displayNodeIds.has(srcId) || !displayNodeIds.has(tgtId)) {
        return false;
      }
      const srcDepth = nodeDepth.get(srcId) ?? drillDepth;
      const tgtDepth = nodeDepth.get(tgtId) ?? drillDepth;
      return !(
        visibleIds.has(srcId) &&
        visibleIds.has(tgtId) &&
        Math.min(srcDepth, tgtDepth) < drillDepth
      );
    },
  );

  updateStats(getAllElements(), getAllRelations());

  const { nodes: visNodes, edges: visEdges } = getVisibleFadedElements();
  const clearElemTypes = new Set();
  const clearRelTypes = new Set();
  for (const n of visNodes) {
    if (!n.faded) {
      clearElemTypes.add(n.type);
    }
  }
  for (const e of visEdges) {
    if (!e.faded && !e.isContainment) {
      clearRelTypes.add(e.type);
    }
  }
  const fadedElemTypes = new Set();
  const fadedRelTypes = new Set();
  for (const n of visNodes) {
    if (n.type && !clearElemTypes.has(n.type)) {
      fadedElemTypes.add(n.type);
    }
  }
  for (const e of visEdges) {
    if (e.type && !e.isContainment && !clearRelTypes.has(e.type)) {
      fadedRelTypes.add(e.type);
    }
  }

  document.dispatchEvent(
    new CustomEvent('highlight:legendUpdate', { detail: { fadedElemTypes, fadedRelTypes } }),
  );
}
