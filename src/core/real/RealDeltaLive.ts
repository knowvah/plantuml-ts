import { castAbstractReal } from './AbstractReal.js';
import type { Real } from './Real.js';
import './RealDelta.js'; // registers RealMoveable.addFixed's RealDelta factory
import { castRealMoveable, RealMoveable } from './RealMoveable.js';

/**
 * `RealDeltaLive` — like `RealDelta`, except the offset is read live from a
 * supplier (`java.util.function.DoubleSupplier` -> `() => number`) every time
 * the value is resolved (`RealDeltaLive.java:40-49`, comment).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealDeltaLive.java:50-78
 */
export class RealDeltaLive extends RealMoveable {
  private readonly delegated: Real;
  private readonly delta: () => number;

  /** `RealDeltaLive.java:55-59`. */
  constructor(delegated: Real, delta: () => number) {
    super(castAbstractReal(delegated).getLine(), '[DelegatedLive]');
    this.delegated = delegated;
    this.delta = delta;
  }

  /** `RealDeltaLive.java:61-64`. */
  getCurrentValueInternal(): number {
    return this.delegated.getCurrentValue() + this.delta();
  }

  /** `RealDeltaLive.java:66-68`. */
  addAtLeast(d: number): Real {
    return new RealDeltaLive(this.delegated.addAtLeast(d), this.delta);
  }

  /** `RealDeltaLive.java:70-72`. */
  ensureBiggerThan(other: Real): void {
    this.delegated.ensureBiggerThan(new RealDeltaLive(other, () => -this.delta()));
  }

  /** `RealDeltaLive.java:74-76`. */
  move(d: number): void {
    castRealMoveable(this.delegated).move(d);
  }
}
