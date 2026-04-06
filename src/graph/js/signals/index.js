/**
 * Minimal reactive primitives implementation (signals).
 *
 * Provides signal, computed, and effect for building reactive state without external dependencies.
 *
 * @module signals
 */

let _activeObserver;

const _batchQueue = new Set();

let _isBatchPending = false;

/** Runs queued effects in the next microtask. */
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
 * @param {Object} observer - The observer to clean up.
 */
function _cleanup(observer) {
  for (const depSet of observer.deps) {
    depSet.delete(observer);
  }
  observer.deps.clear();
}

/**
 * @template T
 * @typedef {Object} ReadonlySignal
 * @property {T} value - A read-only signal value.
 * @readonly
 */

/**
 * @template T
 * @typedef {Object} Signal
 * @property {T} value - A signal value.
 * @property {function(): ReadonlySignal<T>} asReadonly - Creates a read-only signal.
 * @property {function(): [ReadonlySignal<T>,(newValue: T) => void]} asPair - Creates a pair of a
 *   read-only signal and setter.
 */

/**
 * Creates a reactive signal.
 *
 * @template T
 * @param {T} [initialValue] - The initial value of the signal.
 * @returns {Signal<T>} A signal object with getter/setter for reactive value.
 */
export function signal(initialValue) {
  let _value = initialValue;
  const _subscribers = new Set();

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
        // Schedule updates for all subscribers
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
      return /** @type {[ReadonlySignal<T>, (newValue: T) => void]} */ ([
        signalObj.asReadonly(),
        (newValue) => {
          signalObj.value = newValue;
        },
      ]);
    },
  };

  return signalObj;
}

/**
 * Runs `fn` without tracking any signal dependencies. Reads inside `fn` will not subscribe the
 * current observer to those signals.
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
 * @param {Function} fn - The side-effect function.
 * @returns {{ run: () => void; dispose: () => void }} An effect controller with run and dispose
 *   methods.
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
 * @param {() => T} computeFn - Function to calculate the value.
 * @returns {ReadonlySignal<T>} A computed signal with read-only value.
 */
export function computed(computeFn) {
  let _value;
  let _isDirty = true;
  const _subscribers = new Set();

  // Internal observer to track dependencies of the computeFn
  const _internalObserver = {
    deps: new Set(),
    scheduler: () => {
      if (!_isDirty) {
        _isDirty = true;
        // Notify downstream observers that this computed is now dirty
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
      // Register current observer as a subscriber to this computed value
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
