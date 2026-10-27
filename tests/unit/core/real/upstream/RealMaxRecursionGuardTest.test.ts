import { describe, expect, it } from 'vitest';
import { IllegalStateException, UnsupportedOperationException } from '../../../../../src/core/real/AbstractReal.js';
import type { Real } from '../../../../../src/core/real/Real.js';
import { RealUtils } from '../../../../../src/core/real/RealUtils.js';

/**
 * Port of `RealMaxRecursionGuardTest.java` (every assertion kept): the RealMax
 * recursion guard still fires for a cyclic Real graph (plantuml/plantuml#2834)
 * and an ordinary deep max chain is unaffected.
 */

/**
 * `MutableRealHolder` (`RealMaxRecursionGuardTest.java:46-77`): a Real whose
 * delegate is wired after construction, to build a genuine cycle.
 */
class MutableRealHolder implements Real {
  private delegate: Real | undefined;

  setDelegate(delegate: Real): void {
    this.delegate = delegate;
  }

  getCurrentValue(): number {
    return (this.delegate as Real).getCurrentValue();
  }

  getName(): string {
    return 'holder';
  }

  addFixed(delta: number): Real {
    void delta;
    throw new UnsupportedOperationException();
  }

  addAtLeast(delta: number): Real {
    void delta;
    throw new UnsupportedOperationException();
  }

  ensureBiggerThan(other: Real): void {
    void other;
    throw new UnsupportedOperationException();
  }

  printCreationStackTrace(): void {
    // empty upstream
  }
}

describe('RealMaxRecursionGuardTest', () => {
  it('a_cyclic_max_still_throws_infinite_recursion', () => {
    const origin = RealUtils.createOrigin();
    const holder = new MutableRealHolder();
    const cyclicMax = RealUtils.max([origin, holder]);
    // Close the cycle: evaluating the holder re-enters cyclicMax before it
    // has produced (and cached) a value, forever.
    holder.setDelegate(cyclicMax);

    let error: unknown;
    try {
      cyclicMax.getCurrentValue();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(IllegalStateException);
    expect((error as Error).message).toBe('Infinite recursion?');
  });

  it('a_deep_but_non_cyclic_max_chain_still_resolves', () => {
    const depth = 500;
    let current: Real = RealUtils.createOrigin();
    for (let i = 0; i < depth; i++) current = RealUtils.max([current, current.addFixed(1)]);

    expect(current.getCurrentValue()).toBe(depth);
  });

  it('the depth counter is restored after a trip, so a later chain still resolves', () => {
    const origin = RealUtils.createOrigin();
    const holder = new MutableRealHolder();
    const cyclic = RealUtils.max([origin, holder]);
    holder.setDelegate(cyclic);
    expect(() => cyclic.getCurrentValue()).toThrow('Infinite recursion?');
    expect(RealUtils.max([origin.addAtLeast(3)]).getCurrentValue()).toBe(3);
  });
});
