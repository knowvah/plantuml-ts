import { IllegalArgumentException, IllegalStateException, javaDoubleToString } from './AbstractReal.js';
import type { Real } from './Real.js';
import { RealDebug } from './RealDebug.js';
import { RealMoveable } from './RealMoveable.js';

const ULP_VIEW = new DataView(new ArrayBuffer(8));

/**
 * `Math.ulp(double)` (JDK `java/lang/Math.java`): the distance from
 * `|value|` to the next double of larger magnitude; `Double.MIN_VALUE` at
 * zero, `2^971` at `Double.MAX_VALUE`, NaN for NaN, `+Infinity` for infinities.
 * Used by `PositiveForce.java:91-92`.
 */
function ulp(value: number): number {
  const magnitude = Math.abs(value);
  if (Number.isNaN(magnitude) || magnitude === Number.POSITIVE_INFINITY) return magnitude;
  if (magnitude === Number.MAX_VALUE) return 2 ** 971;
  ULP_VIEW.setFloat64(0, magnitude);
  ULP_VIEW.setBigUint64(0, ULP_VIEW.getBigUint64(0) + 1n);
  return ULP_VIEW.getFloat64(0) - magnitude;
}

/**
 * `PositiveForce` — "`movingPoint` must be at least `minimunDistance` after
 * `fixedPoint`", enforced by moving `movingPoint`.
 *
 * `System.err.println` diagnostics (`PositiveForce.java:66,73-77,95,100`) are
 * not mirrored (no console in `src/`, eslint `no-console`; precedent
 * `src/core/elk/MyElkEdge.ts`, gep T4d ruling); the catch-and-rethrow
 * (`:72-78`) and the calls inside it are kept. `trace` (`:43`) is the
 * constant `false` upstream and only guards those prints.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/PositiveForce.java:38-106
 */
export class PositiveForce {
  private readonly fixedPoint: Real;
  private readonly movingPoint: RealMoveable;
  private readonly minimunDistance: number;
  private readonly creationPoint: RealDebug | null;

  /** `PositiveForce.java:46-57`. */
  constructor(fixedPoint: Real, movingPoint: RealMoveable, minimunDistance: number) {
    if (fixedPoint === movingPoint) {
      throw new IllegalArgumentException();
    }
    this.fixedPoint = fixedPoint;
    this.movingPoint = movingPoint;
    this.minimunDistance = minimunDistance;
    this.creationPoint = RealDebug.create();
  }

  /**
   * Java string concatenation of a `Real` (`PositiveForce.java:61`): a
   * `RealMoveable` prints `#cpt_name` (`RealMoveable.java:66-69`); the others
   * inherit `Object.toString` (`Class@hash`, not reproducible), so their name
   * stands in.
   */
  private static describe(real: Real): string {
    return real instanceof RealMoveable ? real.toString() : real.getName();
  }

  /** `PositiveForce.java:59-62`. */
  toString(): string {
    return `PositiveForce fixed=${PositiveForce.describe(this.fixedPoint)} moving=${String(this.movingPoint)} min=${javaDoubleToString(this.minimunDistance)}`;
  }

  /** `PositiveForce.java:64-104`: `true` when it moved `movingPoint`. */
  apply(): boolean {
    const movingPointValue = this.movingPoint.getCurrentValue();
    let fixedPointValue: number;
    try {
      fixedPointValue = this.fixedPoint.getCurrentValue();
    } catch (e) {
      if (!(e instanceof IllegalStateException)) throw e;
      // PositiveForce.java:73-77 print three lines to System.err; the
      // creation-point calls are kept.
      RealDebug.printCreationStackTrace(this.creationPoint);
      this.fixedPoint.printCreationStackTrace();
      throw e;
    }
    const distance = movingPointValue - fixedPointValue;
    const diff = distance - this.minimunDistance;
    // PositiveForce.java:82-92 (comment, epsilon).
    const epsilon = Math.max(0.000001, 1000 * ulp(Math.max(Math.abs(movingPointValue), Math.abs(fixedPointValue))));
    if (diff >= -epsilon) {
      return false;
    }
    this.movingPoint.move(-diff);
    return true;
  }
}
