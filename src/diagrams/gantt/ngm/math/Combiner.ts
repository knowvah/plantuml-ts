/**
 * Utilities to combine multiple {@link PiecewiseConstant} functions; a Combiner
 * is itself a {@link PiecewiseConstant}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:56
 */

import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import { AbstractPiecewiseConstant } from './AbstractPiecewiseConstant.js';
import { Fraction } from './Fraction.js';
import type { PiecewiseConstant } from './PiecewiseConstant.js';
import { Segment } from './Segment.js';
import type { TimeDirection } from './TimeDirection.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:56 */
export class Combiner extends AbstractPiecewiseConstant {
  readonly #elements: readonly PiecewiseConstant[];
  readonly #operation: (a: Fraction, b: Fraction) => Fraction;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:62 */
  private constructor(operation: (a: Fraction, b: Fraction) => Fraction, elements: readonly PiecewiseConstant[]) {
    super();
    this.#elements = elements;
    this.#operation = operation;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:67 */
  public static sum(...elements: PiecewiseConstant[]): PiecewiseConstant {
    return Combiner.#combine(Fraction.SUM, elements);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:73 */
  public static min(...elements: PiecewiseConstant[]): PiecewiseConstant {
    return Combiner.#combine(Fraction.MIN, elements);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:79 */
  public static max(...elements: PiecewiseConstant[]): PiecewiseConstant {
    return Combiner.#combine(Fraction.MAX, elements);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:85 */
  public static product(...elements: PiecewiseConstant[]): PiecewiseConstant {
    return Combiner.#combine(Fraction.PRODUCT, elements);
  }

  /** The shared body of the four factories: one element is returned as is. */
  static #combine(operation: (a: Fraction, b: Fraction) => Fraction, elements: PiecewiseConstant[]): PiecewiseConstant {
    const only = elements[0];
    if (elements.length === 1 && only !== undefined) return only;
    return new Combiner(operation, elements);
  }

  /**
   * @throws Error "At least two functions are required for combination" (Java `IllegalStateException`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Combiner.java:92
   */
  public segmentAt(instant: LocalDateTime, direction: TimeDirection): Segment {
    if (this.#elements.length < 2) throw new Error('At least two functions are required for combination');

    const segments = this.#elements.map((element) => element.segmentAt(instant, direction));

    return Segment.intersection(segments, this.#operation);
  }
}
