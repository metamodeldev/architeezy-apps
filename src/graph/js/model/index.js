/**
 * Model module public API.
 *
 * @module model
 */

export { init } from './bootstrap.js';
export { subscribeModelToUrl } from './router.js';
export { close, initModelSelector, open, setSearchQuery } from './selector.js';
export {
  clear,
  elementTypeCounts,
  fetchModelList,
  getElementById,
  getElements,
  getElementsByType,
  getElementsByTypes,
  getElemMap,
  getErrorMessage,
  getId,
  getIncomingRelations,
  getModelList,
  getModelName,
  getNs,
  getOutgoingRelations,
  getRelations,
  getRelationshipsForElement,
  getStatus,
  hasElement,
  hasElements,
  load,
  modelContentUrl,
  modelNameSignal,
  modelTypeLabel,
  parseModel,
  relationTypeCounts,
  setCurrentModelName,
  setElements,
  setElemMap,
  setErrorMessage,
  setId,
  setModelList,
  setNs,
  setRelations,
  setStatus,
} from './service.js';
