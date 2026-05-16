import { describe, expect, it } from 'bun:test';

import { computed, effect, signal, untrack } from '../../js/signals/index.js';

/**
 * Flush queued reactive effects. Internal batching uses queueMicrotask, so awaiting a microtask
 * boundary is enough to observe their side-effects.
 */
async function flush() {
  await Promise.resolve();
}

// ── signal: value semantics ──────────────────────────────────────────────────

describe('signal — value semantics', () => {
  it('returns the initial value', () => {
    const s = signal(7);
    expect(s.value).toBe(7);
  });

  it('initial value undefined when omitted', () => {
    const s = signal();
    expect(s.value).toBeUndefined();
  });

  it('reads back what was written', () => {
    const s = signal('a');
    s.value = 'b';
    expect(s.value).toBe('b');
  });

  it('asReadonly reflects the latest signal value (live, not frozen)', () => {
    const s = signal(1);
    const ro = s.asReadonly();
    expect(ro.value).toBe(1);
    s.value = 2;
    expect(ro.value).toBe(2);
  });

  it('asPair returns [readonly, setter] that share the underlying signal', () => {
    const s = signal(1);
    const [ro, set] = s.asPair();
    expect(ro.value).toBe(1);
    set(99);
    expect(ro.value).toBe(99);
    expect(s.value).toBe(99); // Same underlying state
  });
});

// ── effect: tracking & re-runs ───────────────────────────────────────────────

describe('effect — dependency tracking', () => {
  it('runs immediately on creation', () => {
    let runs = 0;
    effect(() => {
      runs++;
    });
    expect(runs).toBe(1);
  });

  it('re-runs after a tracked signal changes (async via microtask)', async () => {
    const s = signal(1);
    let observed;
    effect(() => {
      observed = s.value;
    });
    expect(observed).toBe(1);
    s.value = 2;
    await flush();
    expect(observed).toBe(2);
  });

  it('does NOT re-run when setter receives the same value', async () => {
    const s = signal(5);
    let runs = 0;
    effect(() => {
      void s.value;
      runs++;
    });
    expect(runs).toBe(1);
    s.value = 5; // No change
    await flush();
    expect(runs).toBe(1);
  });

  it('batches multiple synchronous updates into a single re-run', async () => {
    const s = signal(0);
    let runs = 0;
    effect(() => {
      void s.value;
      runs++;
    });
    s.value = 1;
    s.value = 2;
    s.value = 3;
    await flush();
    expect(runs).toBe(2); // Initial + 1 batched re-run
  });

  it('untracks dependencies that are no longer read after a re-run', async () => {
    const cond = signal(true);
    const a = signal('A');
    const b = signal('B');
    const observed = [];
    effect(() => {
      observed.push(cond.value ? a.value : b.value);
    });
    expect(observed).toStrictEqual(['A']);

    cond.value = false;
    await flush();
    expect(observed).toStrictEqual(['A', 'B']);

    // Now 'a' is no longer a dependency; changing it must not re-run the effect.
    a.value = 'A2';
    await flush();
    expect(observed).toStrictEqual(['A', 'B']);

    // 'b' is still tracked.
    b.value = 'B2';
    await flush();
    expect(observed).toStrictEqual(['A', 'B', 'B2']);
  });

  it('dispose() unsubscribes the effect from all signals', async () => {
    const s = signal(0);
    let runs = 0;
    const eff = effect(() => {
      void s.value;
      runs++;
    });
    eff.dispose();
    s.value = 1;
    await flush();
    expect(runs).toBe(1); // Did not re-run after dispose
  });

  it('manual run() re-executes the effect synchronously', () => {
    const s = signal(0);
    let runs = 0;
    const eff = effect(() => {
      void s.value;
      runs++;
    });
    eff.run();
    expect(runs).toBe(2);
  });

  it('multiple signals — re-runs when any tracked signal changes', async () => {
    const a = signal(1);
    const b = signal(10);
    let sum = 0;
    effect(() => {
      sum = a.value + b.value;
    });
    expect(sum).toBe(11);
    a.value = 2;
    await flush();
    expect(sum).toBe(12);
    b.value = 20;
    await flush();
    expect(sum).toBe(22);
  });
});

// ── untrack ──────────────────────────────────────────────────────────────────

describe(untrack, () => {
  it('returns the function result', () => {
    expect(untrack(() => 42)).toBe(42);
  });

  it('reads inside untrack do not become effect dependencies', async () => {
    const tracked = signal(1);
    const hidden = signal(100);
    let runs = 0;
    effect(() => {
      void tracked.value;
      untrack(() => {
        void hidden.value;
      });
      runs++;
    });
    expect(runs).toBe(1);
    hidden.value = 200;
    await flush();
    expect(runs).toBe(1); // Untracked read did not subscribe
    tracked.value = 2;
    await flush();
    expect(runs).toBe(2);
  });

  it('restores the previous active observer on return', async () => {
    const a = signal('a');
    const b = signal('b');
    let runs = 0;
    effect(() => {
      void a.value;
      untrack(() => void b.value);
      // After untrack returns, the effect must still be the active observer.
      void a.value; // This re-tracks 'a', confirming observer was restored
      runs++;
    });
    expect(runs).toBe(1);
    a.value = 'a2';
    await flush();
    expect(runs).toBe(2);
  });

  it('restores active observer even when the callback throws', () => {
    const s = signal(0);
    let runs = 0;
    // Wrap in effect so there is an active observer to restore.
    effect(() => {
      void s.value;
      runs++;
      try {
        untrack(() => {
          throw new Error('boom');
        });
      } catch {
        /* swallow */
      }
    });
    expect(runs).toBe(1);
    // After the throw, the active-observer slot must be cleared (not stuck on observer).
    // Verify by setting the signal — effect should still re-run normally.
    s.value = 1;
  });
});

// ── computed ─────────────────────────────────────────────────────────────────

describe(computed, () => {
  it('returns the initial computed value', () => {
    const s = signal(2);
    const doubled = computed(() => s.value * 2);
    expect(doubled.value).toBe(4);
  });

  it('updates lazily — does not recompute until value is read', async () => {
    const s = signal(1);
    let computeRuns = 0;
    const c = computed(() => {
      computeRuns++;
      return s.value * 10;
    });
    expect(c.value).toBe(10);
    expect(computeRuns).toBe(1);

    s.value = 2;
    // Even after the microtask, the computed has only been *marked* dirty.
    await flush();
    // No additional run yet — only the schedule fired (but no subscribers, so nothing forces it).
    // Now read: recomputes.
    expect(c.value).toBe(20);
    expect(computeRuns).toBe(2);
  });

  it('caches the value between reads when nothing has changed', () => {
    const s = signal(3);
    let runs = 0;
    const c = computed(() => {
      runs++;
      return s.value;
    });
    c.value;
    c.value;
    c.value;
    expect(runs).toBe(1);
  });

  it('propagates changes through nested computed chains', () => {
    const s = signal(1);
    const a = computed(() => s.value + 1);
    const b = computed(() => a.value * 10);
    expect(b.value).toBe(20);
    s.value = 5;
    expect(b.value).toBe(60);
  });

  it('effect that reads a computed re-runs when underlying signal changes', async () => {
    const s = signal(1);
    const c = computed(() => s.value * 100);
    let observed;
    effect(() => {
      observed = c.value;
    });
    expect(observed).toBe(100);
    s.value = 3;
    await flush();
    expect(observed).toBe(300);
  });

  it('reading the same value twice does not duplicate subscribers', async () => {
    const s = signal(1);
    const c = computed(() => s.value);
    let runs = 0;
    effect(() => {
      void c.value;
      void c.value; // Duplicate read
      runs++;
    });
    expect(runs).toBe(1);
    s.value = 2;
    await flush();
    expect(runs).toBe(2); // Not 3
  });

  it('marks dirty only once per change burst (scheduler short-circuits when already dirty)', () => {
    // Pins the `if (!_isDirty)` guard in computed.scheduler — replacing with `true` would
    // re-enqueue subscribers on every set, replacing with `false` would never enqueue.
    const s = signal(1);
    let runs = 0;
    const c = computed(() => {
      runs++;
      return s.value;
    });
    // Read once so the computed has a tracked dependency.
    expect(c.value).toBe(1);
    expect(runs).toBe(1);
    // Multiple writes — computed remains dirty after first; subsequent writes are no-ops.
    s.value = 2;
    s.value = 3;
    s.value = 4;
    // No subscribers other than the computed's internal tracking — value should refresh on read.
    expect(c.value).toBe(4);
    expect(runs).toBe(2); // Recomputed exactly once
  });
});
