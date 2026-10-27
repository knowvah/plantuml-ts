import {
  castAbstractReal,
  AbstractReal,
  IllegalStateException,
  UnsupportedOperationException,
} from './AbstractReal.js';
import type { Real } from './Real.js';
import { RealDebug } from './RealDebug.js';
import { RealDelta } from './RealDelta.js';
import type { RealLine } from './RealLine.js';

/** `RealMax.java:61`. */
const MAX_RECURSION_DEPTH = 1000;

/**
 * `RealMax.java:62-67` `ThreadLocal<int[]> RECURSION_DEPTH`: JS is
 * single-threaded, so one counter object is the thread-local.
 */
const RECURSION_DEPTH: number[] = [0];

/**
 * `RealMax` — the maximum of several {@link Real}s, cached once computed.
 *
 * `System.err.println` at `:99-100` is not mirrored (no console in `src/`,
 * eslint `no-console`; gep T4d ruling); `printCreationStackTrace()` (`:101`)
 * and the throw (`:102`, message verbatim) are kept.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealMax.java:42-134
 */
export class RealMax extends AbstractReal {
  private readonly all: Real[] = [];
  private readonly creationPoint: RealDebug | null;
  /** `RealMax.java:89` `cache = Double.MAX_VALUE` (the "not computed" sentinel). */
  private cache = Number.MAX_VALUE;

  /** `RealMax.java:72-79`. */
  constructor(reals: readonly Real[]) {
    super(RealMax.line(reals));
    this.all.push(...reals);
    this.creationPoint = RealDebug.create();
  }

  /** `RealMax.java:81-83`: `iterator().next()` on an empty collection throws. */
  static line(reals: readonly Real[]): RealLine {
    const first = reals[0];
    if (first === undefined) throw new Error('NoSuchElementException');
    return castAbstractReal(first).getLine();
  }

  /** `RealMax.java:85-87`. */
  getName(): string {
    return `max ${String(this.all.length)}`;
  }

  /** `RealMax.java:91-116`. */
  getCurrentValueInternal(): number {
    if (this.cache !== Number.MAX_VALUE) return this.cache;
    RECURSION_DEPTH[0] = (RECURSION_DEPTH[0] ?? 0) + 1;
    try {
      if ((RECURSION_DEPTH[0] ?? 0) > MAX_RECURSION_DEPTH) {
        this.printCreationStackTrace();
        throw new IllegalStateException('Infinite recursion?');
      }
      let result = (this.all[0] as Real).getCurrentValue();
      for (let i = 1; i < this.all.length; i++) {
        const v = (this.all[i] as Real).getCurrentValue();
        if (v > result) result = v;
      }
      this.cache = result;
      return result;
    } finally {
      RECURSION_DEPTH[0] = (RECURSION_DEPTH[0] ?? 0) - 1;
    }
  }

  /** `RealMax.java:118-120`. */
  addFixed(delta: number): Real {
    return new RealDelta(this, delta);
  }

  /** `RealMax.java:122-124`. */
  addAtLeast(delta: number): Real {
    void delta;
    throw new UnsupportedOperationException();
  }

  /** `RealMax.java:126-128`. */
  ensureBiggerThan(other: Real): void {
    void other;
    throw new UnsupportedOperationException();
  }

  /** `RealMax.java:130-132`. */
  printCreationStackTrace(): void {
    RealDebug.printCreationStackTrace(this.creationPoint);
  }
}
