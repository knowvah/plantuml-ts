import { UnsupportedOperationException } from './AbstractReal.js';
import { PositiveForce } from './PositiveForce.js';
import type { Real } from './Real.js';
import './RealDelta.js'; // registers RealMoveable.addFixed's RealDelta factory
import { RealMoveable } from './RealMoveable.js';

/**
 * `RealMiddle2` — a movable midpoint of two {@link RealMoveable}s; moving it
 * moves both ends by half.
 *
 * The `TeaVM.a()` assertion guard (`RealMiddle2.java:47`, `p1.getLine() ==
 * p2.getLine()`) is dropped as assertion-only (gep T4d ruling; T1f/T3c
 * precedent). The commented-out `addFixed` (`:56-59`) is a comment upstream.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealMiddle2.java:40-75
 */
export class RealMiddle2 extends RealMoveable {
  private readonly p1: RealMoveable;
  private readonly p2: RealMoveable;

  /** `RealMiddle2.java:45-50`. */
  constructor(p1: RealMoveable, p2: RealMoveable) {
    super(p1.getLine(), 'middle');
    this.p1 = p1;
    this.p2 = p2;
  }

  /** `RealMiddle2.java:52-55`. */
  getCurrentValueInternal(): number {
    return (this.p1.getCurrentValue() + this.p2.getCurrentValue()) / 2;
  }

  /** `RealMiddle2.java:61-63`. */
  addAtLeast(delta: number): Real {
    void delta;
    throw new UnsupportedOperationException();
  }

  /** `RealMiddle2.java:65-67`. */
  ensureBiggerThan(other: Real): void {
    this.getLine().addForce(new PositiveForce(other, this, 0));
  }

  /** `RealMiddle2.java:69-73`. */
  move(delta: number): void {
    this.p1.move(delta / 2);
    this.p2.move(delta / 2);
  }
}
