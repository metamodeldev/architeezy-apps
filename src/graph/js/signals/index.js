/**
 * Minimal reactive primitives implementation (signals).
 *
 * Provides signal, computed, and effect for building reactive state without external dependencies.
 *
 * @module signals
 */

/**
 * @typedef {Object} Observer
 * @property {Set<Set<Observer>>} deps - A set of subscriber sets that this observer is currently
 *   subscribed to.
 * @property {() => void} run - The function that executes the observer logic.
 * @property {() => void} [scheduler] - Optional custom scheduling logic for re-runs.
 * @property {() => void} [dispose] - Optional method to clean up the observer.
 * @internal
 */

/**
 * @template T
 * @typedef {Object} ReadonlySignal
 * @property {T} value - The current value of the signal (read-only).
 */

/**
 * @template T
 * @typedef {Object} Signal
 * @property {T} value - The current value of the signal (read/write).
 * @property {function(): ReadonlySignal<T>} asReadonly - Returns a read-only view of the signal.
 * @property {function(): [ReadonlySignal<T>, (newValue: T) => void]} asPair - Returns a tuple
 *   containing a read-only signal and a setter function.
 */

/**
 * @typedef {Object} EffectController
 * @property {() => void} run - Manually triggers the effect execution.
 * @property {() => void} dispose - Unsubscribes the effect from all dependencies.
 */

/** @type {Observer | undefined} */
let _activeObserver;

/** @type {Set<Observer>} */
const _batchQueue = new Set();

let _isBatchPending = false;

/**
 * Runs queued effects in the next microtask.
 *
 * @private
 */
function _flushQueue() {
  const jobs = [..._batchQueue];
  _batchQueue.clear();
  _isBatchPending = false;
  for (const job of jobs) {
    job.run();
  }
}

/**
 * Removes an observer from all its dependencies' subscriber sets.
 *
 * @private
 * @param {Observer} observer - The observer to clean up.
 */
function _cleanup(observer) {
  for (const depSet of observer.deps) {
    depSet.delete(observer);
  }
  observer.deps.clear();
}

/**
 * Creates a reactive signal.
 *
 * @template T
 * @param {T} [initialValue] - The initial value of the signal.
 * @returns {Signal<T>} A signal object with reactive getter/setter.
 */
export function signal(initialValue) {
  let _value = initialValue;
  const _subscribers = new Set();

  /** @type {Signal<T>} */
  const signalObj = {
    get value() {
      if (_activeObserver) {
        _subscribers.add(_activeObserver);
        _activeObserver.deps.add(_subscribers);
      }
      return _value;
    },
    set value(newValue) {
      if (_value !== newValue) {
        _value = newValue;
        for (const sub of _subscribers) {
          if (sub.scheduler) {
            sub.scheduler();
          } else {
            _batchQueue.add(sub);
            if (!_isBatchPending) {
              _isBatchPending = true;
              queueMicrotask(_flushQueue);
            }
          }
        }
      }
    },
    asReadonly() {
      return {
        get value() {
          return signalObj.value;
        },
      };
    },
    asPair() {
      return [
        signalObj.asReadonly(),
        (newValue) => {
          signalObj.value = newValue;
        },
      ];
    },
  };

  return signalObj;
}

/**
 * Runs `fn` without tracking any signal dependencies.
 *
 * @template T
 * @param {() => T} fn - The function to run without tracking.
 * @returns {T} The return value of `fn`.
 */
export function untrack(fn) {
  const prevObserver = _activeObserver;
  _activeObserver = undefined;
  try {
    return fn();
  } finally {
    _activeObserver = prevObserver;
  }
}

/**
 * Creates a reactive effect that re-runs when its dependencies change.
 *
 * @param {() => void} fn - The side-effect function to execute.
 * @returns {EffectController} An effect controller.
 */
export function effect(fn) {
  const observer = {
    deps: new Set(),
    run() {
      _cleanup(observer);
      const prevObserver = _activeObserver;
      _activeObserver = observer;
      try {
        return fn();
      } finally {
        _activeObserver = prevObserver;
      }
    },
    dispose() {
      _cleanup(observer);
    },
  };

  observer.run();
  return observer;
}

/**
 * Creates a derived reactive value.
 *
 * @template T
 * @param {() => T} computeFn - Function to calculate the derived value.
 * @returns {ReadonlySignal<T>} A computed signal.
 */
export function computed(computeFn) {
  let _value;
  let _isDirty = true;

  const _subscribers = new Set();

  /** @type {Observer} */
  const _internalObserver = {
    deps: new Set(),
    scheduler: () => {
      if (!_isDirty) {
        _isDirty = true;
        for (const sub of _subscribers) {
          if (sub.scheduler) {
            sub.scheduler();
          } else {
            _batchQueue.add(sub);
            if (!_isBatchPending) {
              _isBatchPending = true;
              queueMicrotask(_flushQueue);
            }
          }
        }
      }
    },
    run() {
      _cleanup(_internalObserver);
      const prevObserver = _activeObserver;
      _activeObserver = _internalObserver;
      try {
        _value = computeFn();
        _isDirty = false;
      } finally {
        _activeObserver = prevObserver;
      }
    },
  };

  return {
    get value() {
      if (_activeObserver) {
        _subscribers.add(_activeObserver);
        _activeObserver.deps.add(_subscribers);
      }
      if (_isDirty) {
        _internalObserver.run();
      }
      return _value;
    },
  };
}
