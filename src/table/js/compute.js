// ── MATRIX COMPUTATION ─────────────────────────────────────────────────────

export { identifyGroups, nodeLabel, sortNodes } from './compute-helpers.js';
export { buildAxisContexts, getAxisElements, resolveLevel } from './compute-level.js';
export {
  aggregateValues,
  dataItemDisplay,
  makeDataItemAxis,
  resolveDataItemElements,
  resolveDataItemRelations,
} from './compute-data.js';
export {
  buildAxisItems,
  buildAxisItemsAllLevels,
  collectAllElems,
  getOrigRange,
  recomputeAxisSpans,
  recomputeFlatRowGroups,
} from './compute-axis.js';
export { buildAugmentedMatrix, computeMatrix } from './compute-matrix.js';
