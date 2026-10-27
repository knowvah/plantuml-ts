import { javaDoubleToString } from './AbstractReal.js';
import { PositiveForce } from './PositiveForce.js';
import type { Real } from './Real.js';
import './RealDelta.js'; // registers RealMoveable.addFixed's RealDelta factory
import type { RealLine } from './RealLine.js';
import { RealMoveable } from './RealMoveable.js';
import type { RealOrigin } from './RealOrigin.js';

/**
 * `RealImpl` — a {@link Real} that holds its own value; the origin of a line.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealImpl.java:38-72
 */
export class RealImpl extends RealMoveable implements RealOrigin {
  private currentValue: number;

  /** `RealImpl.java:42-45`. */
  constructor(name: string, line: RealLine, currentValue: number) {
    super(line, name);
    this.currentValue = currentValue;
  }

  /** `RealImpl.java:47-49`. */
  move(delta: number): void {
    this.currentValue += delta;
  }

  /** `RealImpl.java:51-54`. */
  getCurrentValueInternal(): number {
    return this.currentValue;
  }

  /** `RealImpl.java:56-63`: the name stays O(1) (comment `:57-59`). */
  addAtLeast(delta: number): Real {
    const result = new RealImpl(`addAtLeast${javaDoubleToString(delta)}`, this.getLine(), this.currentValue + delta);
    this.getLine().addForce(new PositiveForce(this, result, delta));
    return result;
  }

  /** `RealImpl.java:65-67`. */
  ensureBiggerThan(other: Real): void {
    this.getLine().addForce(new PositiveForce(other, this, 0));
  }

  /** `RealImpl.java:69-71`. */
  compileNow(): void {
    this.getLine().compile();
  }
}
