import { AbstractReal, UnsupportedOperationException } from './AbstractReal.js';
import type { Real } from './Real.js';
import { RealDelta } from './RealDelta.js';
import { RealMax } from './RealMax.js';

/**
 * `RealMin` — the minimum of several {@link Real}s, cached once computed.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealMin.java:42-95
 */
export class RealMin extends AbstractReal {
  private readonly all: Real[] = [];
  /** `RealMin.java:55` `cache = Double.MAX_VALUE` (the "not computed" sentinel). */
  private cache = Number.MAX_VALUE;

  /** `RealMin.java:46-49`. */
  constructor(reals: readonly Real[]) {
    super(RealMax.line(reals));
    this.all.push(...reals);
  }

  /** `RealMin.java:51-53`. */
  getName(): string {
    return `min ${String(this.all.length)}`;
  }

  /** `RealMin.java:57-71`. */
  getCurrentValueInternal(): number {
    if (this.cache !== Number.MAX_VALUE) return this.cache;
    let result = (this.all[0] as Real).getCurrentValue();
    for (let i = 1; i < this.all.length; i++) {
      const v = (this.all[i] as Real).getCurrentValue();
      if (v < result) result = v;
    }
    this.cache = result;
    return result;
  }

  /** `RealMin.java:73-75`. */
  addFixed(delta: number): Real {
    return new RealDelta(this, delta);
  }

  /** `RealMin.java:77-79`. */
  addAtLeast(delta: number): Real {
    void delta;
    throw new UnsupportedOperationException();
  }

  /** `RealMin.java:81-85`. */
  ensureBiggerThan(other: Real): void {
    for (const r of this.all) r.ensureBiggerThan(other);
  }

  /** `RealMin.java:87-89`. */
  size(): number {
    return this.all.length;
  }

  /** `RealMin.java:91-93`. */
  printCreationStackTrace(): void {
    throw new UnsupportedOperationException();
  }
}
