import { AbstractReal, ClassCastException } from './AbstractReal.js';
import type { Real } from './Real.js';
import { RealDebug } from './RealDebug.js';
import type { RealLine } from './RealLine.js';

/** Builds the `new RealDelta(this, delta)` of `RealMoveable.java:63`. */
type RealDeltaFactory = (delegated: Real, diff: number) => Real;

let realDeltaFactory: RealDeltaFactory | undefined;

/**
 * Registers how `RealMoveable.addFixed` builds a `RealDelta`
 * (`RealMoveable.java:62-64`). Called once by `RealDelta.ts` when it loads.
 *
 * Import-cycle ruling (gep T4d): `RealDelta extends RealMoveable` while
 * `RealMoveable.addFixed` constructs a `RealDelta`. A runtime import in both
 * directions makes `class RealDelta extends RealMoveable` a TDZ
 * `ReferenceError` whenever `RealMoveable.ts` is evaluated first. So this
 * module imports nothing that extends it, and `RealDelta.ts` hands its
 * constructor over here (the `NGMTaskBase.ts` split's role, as a hook).
 * Reported to the orchestrator.
 */
export function registerRealDeltaFactory(factory: RealDeltaFactory): void {
  realDeltaFactory = factory;
}

/**
 * `RealMoveable` — a {@link Real} whose value can be pushed by a
 * `PositiveForce`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealMoveable.java:40-74
 */
export abstract class RealMoveable extends AbstractReal {
  /** `RealMoveable.java:42` `AtomicInteger CPT` (one thread: a counter). */
  static CPT = 0;
  private readonly cpt: number = RealMoveable.CPT++;
  private readonly name: string;
  private readonly creationPoint: RealDebug | null;

  /** `RealMoveable.java:47-54`. */
  constructor(line: RealLine, name: string) {
    super(line);
    this.name = name;
    this.creationPoint = RealDebug.create();
  }

  /** `RealMoveable.java:56-58` (`final` upstream). */
  printCreationStackTrace(): void {
    RealDebug.printCreationStackTrace(this.creationPoint);
  }

  /** `RealMoveable.java:60` (package-private). */
  abstract move(delta: number): void;

  /** `RealMoveable.java:62-64` (`final` upstream). */
  addFixed(delta: number): Real {
    if (realDeltaFactory === undefined) {
      throw new Error('RealDelta is not loaded: import it before calling addFixed');
    }
    return realDeltaFactory(this, delta);
  }

  /** `RealMoveable.java:66-69` (`final` upstream). */
  toString(): string {
    return `#${String(this.cpt)}_${this.name}`;
  }

  /** `RealMoveable.java:71-73` (`final` upstream). */
  getName(): string {
    return this.name;
  }

  abstract addAtLeast(delta: number): Real;
  abstract ensureBiggerThan(other: Real): void;
}

/** The Java cast `(RealMoveable) real`: throws where Java throws. */
export function castRealMoveable(real: Real): RealMoveable {
  if (!(real instanceof RealMoveable)) {
    throw new ClassCastException(`${real.getName()} cannot be cast to RealMoveable`);
  }
  return real;
}
