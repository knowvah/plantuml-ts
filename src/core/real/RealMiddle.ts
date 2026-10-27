import { AbstractReal, UnsupportedOperationException } from './AbstractReal.js';
import type { Real } from './Real.js';
import type { RealMoveable } from './RealMoveable.js';

/**
 * `RealMiddle` — the midpoint of two {@link RealMoveable}s plus a fixed delta.
 *
 * `RealMiddle.java:39` `::remove folder when __HAXE__` is a HAXE marker, not
 * `__MIT__`: ignored (gep T4d ruling). Nothing in the package calls the
 * private `create` (`:52-54`) or the private constructor but `addFixed`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealMiddle.java:38-81
 */
export class RealMiddle extends AbstractReal {
  private readonly p1: RealMoveable;
  private readonly p2: RealMoveable;
  private readonly delta: number;

  /** `RealMiddle.java:45-50` (private upstream; the Java is not reachable otherwise). */
  private constructor(p1: RealMoveable, p2: RealMoveable, delta: number) {
    super(p1.getLine());
    this.p1 = p1;
    this.p2 = p2;
    this.delta = delta;
  }

  /** `RealMiddle.java:52-54` (private static upstream, unused there). */
  static create(p1: RealMoveable, p2: RealMoveable): RealMiddle {
    return new RealMiddle(p1, p2, 0);
  }

  /** `RealMiddle.java:56-59`. */
  getCurrentValueInternal(): number {
    return (this.p1.getCurrentValue() + this.p2.getCurrentValue()) / 2 + this.delta;
  }

  /** `RealMiddle.java:61-63`. */
  addFixed(diff: number): Real {
    return new RealMiddle(this.p1, this.p2, this.delta + diff);
  }

  /** `RealMiddle.java:65-67`. */
  addAtLeast(delta: number): Real {
    void delta;
    throw new UnsupportedOperationException();
  }

  /** `RealMiddle.java:69-71`. */
  ensureBiggerThan(other: Real): void {
    void other;
    throw new UnsupportedOperationException();
  }

  /** `RealMiddle.java:73-75`. */
  getName(): string {
    return `[Middle ${this.p1.getName()} and ${this.p2.getName()}]`;
  }

  /** `RealMiddle.java:77-79`. */
  printCreationStackTrace(): void {
    throw new UnsupportedOperationException();
  }
}
