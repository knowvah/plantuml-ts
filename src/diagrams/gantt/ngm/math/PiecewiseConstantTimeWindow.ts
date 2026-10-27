/**
 * {@link PiecewiseConstant} that is ONE inside `[offBefore, offAfter)` and ZERO
 * before and after. `LocalDateTime.MIN`/`MAX` are the unbounded sentinels.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantTimeWindow.java:60
 */

import { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import { AbstractPiecewiseConstant } from './AbstractPiecewiseConstant.js';
import { Fraction } from './Fraction.js';
import { Segment } from './Segment.js';
import { TimeDirection } from './TimeDirection.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantTimeWindow.java:60 */
export class PiecewiseConstantTimeWindow extends AbstractPiecewiseConstant {
  readonly #offBefore: LocalDateTime;
  readonly #offAfter: LocalDateTime;

  /**
   * @throws Error "offAfter must be after offBefore" (Java `IllegalArgumentException`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantTimeWindow.java:82
   */
  public constructor(offBefore: LocalDateTime, offAfter: LocalDateTime) {
    super();
    this.#offBefore = offBefore;
    this.#offAfter = offAfter;

    if (this.#offBefore.isBefore(this.#offAfter) === false) throw new Error('offAfter must be after offBefore');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantTimeWindow.java:105 */
  public segmentAt(instant: LocalDateTime, direction: TimeDirection): Segment {
    if (direction === TimeDirection.FORWARD) return this.#segmentAtForward(instant);
    else return this.#segmentAtBackward(instant);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantTimeWindow.java:118 */
  #segmentAtForward(instant: LocalDateTime): Segment {
    // Before the active window: instant to offBefore with value 0
    if (instant.isBefore(this.#offBefore)) return Segment.forward(instant, this.#offBefore, Fraction.ZERO);

    // After the active window: unbounded segment from instant onwards with value 0
    if (instant.isBefore(this.#offAfter) === false) return Segment.forward(instant, LocalDateTime.MAX, Fraction.ZERO);

    // Within the active window: instant to offAfter with value 1
    return Segment.forward(instant, this.#offAfter, Fraction.ONE);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantTimeWindow.java:140 */
  #segmentAtBackward(instant: LocalDateTime): Segment {
    // After the active window: instant back to offAfter with value 0
    if (instant.isAfter(this.#offAfter)) return Segment.backward(instant, this.#offAfter, Fraction.ZERO);

    // Before the active window: unbounded segment backwards with value 0
    if (instant.isAfter(this.#offBefore) === false) return Segment.backward(instant, LocalDateTime.MIN, Fraction.ZERO);

    // Within the active window: instant back to offBefore with value 1
    return Segment.backward(instant, this.#offBefore, Fraction.ONE);
  }
}
