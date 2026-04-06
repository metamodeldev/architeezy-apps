/**
 * Model URL router — keeps the `model` URL param in sync with the current model ID.
 *
 * @module model/router
 * @package
 */

import { replaceParams } from '../router/index.js';
import { effect } from '../signals/index.js';
import { getId } from './service.js';

/** Registers a reactive effect that keeps the URL `model` param in sync with the model ID signal. */
export function subscribeModelToUrl() {
  effect(() => replaceParams({ model: getId() }));
}
