import { castAbstractReal, javaDoubleToString } from './AbstractReal.js';
import type { Real } from './Real.js';
import { castRealMoveable, RealMoveable, registerRealDeltaFactory } from './RealMoveable.js';

/**
 * `RealDelta` — a {@link Real} that is `delegated + diff`.
 *
 * The name is deliberately O(1) (`RealDelta.java:44-54`, comment). The Java
 * casts `(AbstractReal) delegated` (`:55`) and `(RealMoveable) delegated`
 * (`:74`) throw `ClassCastException`; `castAbstractReal`/`castRealMoveable`
 * keep that.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealDelta.java:38-77
 */
export class RealDelta extends RealMoveable {
  private readonly delegated: Real;
  private readonly diff: number;

  /** `RealDelta.java:43-58`. */
  constructor(delegated: Real, diff: number) {
    super(castAbstractReal(delegated).getLine(), `[Delegated d=${javaDoubleToString(diff)}]`);
    this.delegated = delegated;
    this.diff = diff;
  }

  /** `RealDelta.java:60-63`. */
  getCurrentValueInternal(): number {
    return this.delegated.getCurrentValue() + this.diff;
  }

  /** `RealDelta.java:65-67`. */
  addAtLeast(delta: number): Real {
    return new RealDelta(this.delegated.addAtLeast(delta), this.diff);
  }

  /** `RealDelta.java:69-71`. */
  ensureBiggerThan(other: Real): void {
    this.delegated.ensureBiggerThan(new RealDelta(other, -this.diff));
  }

  /** `RealDelta.java:73-75`. */
  move(delta: number): void {
    castRealMoveable(this.delegated).move(delta);
  }
}

registerRealDeltaFactory((delegated, diff) => new RealDelta(delegated, diff));
