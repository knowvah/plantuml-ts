/**
 * The resource allocation applied to a task over time, as a time-varying
 * {@link PiecewiseConstant} FTE function.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMAllocation.java:86
 */

import { Fraction } from './math/Fraction.js';
import type { PiecewiseConstant } from './math/PiecewiseConstant.js';
import { PiecewiseConstantWeekday } from './math/PiecewiseConstantWeekday.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMAllocation.java:86 */
export class NGMAllocation {
  readonly #loadFunction: PiecewiseConstant;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMAllocation.java:107 */
  private constructor(loadFunction: PiecewiseConstant) {
    this.#loadFunction = loadFunction;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMAllocation.java:122 */
  public static of(loadFunction: PiecewiseConstant): NGMAllocation {
    return new NGMAllocation(loadFunction);
  }

  /** Constant full-time allocation (100% at all times). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMAllocation.java:136 */
  public static fullTime(): NGMAllocation {
    // Full-time: 1/1 at all times, all days of the week
    return new NGMAllocation(PiecewiseConstantWeekday.of(Fraction.ONE));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMAllocation.java:151 */
  public getLoadFunction(): PiecewiseConstant {
    return this.#loadFunction;
  }
}
