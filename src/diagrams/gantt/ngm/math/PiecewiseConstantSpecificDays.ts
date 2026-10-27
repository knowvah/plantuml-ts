/**
 * Immutable {@link PiecewiseConstant} defined by specific dates, each mapped to
 * a constant {@link Fraction}; other dates get the default value.
 *
 * Java keys a `HashMap<LocalDate, Fraction>`; it is only ever looked up
 * (`getValue`), never iterated, so a `Map` keyed by epoch day is faithful
 * (`LocalDate` instances have no identity equality in JS).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:59
 */

import type { LocalDate } from '../../../../core/time/LocalDate.js';
import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import { LocalTime } from '../../../../core/time/LocalTime.js';
import { AbstractPiecewiseConstant } from './AbstractPiecewiseConstant.js';
import type { Fraction } from './Fraction.js';
import { Segment } from './Segment.js';
import { TimeDirection } from './TimeDirection.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:59 */
export class PiecewiseConstantSpecificDays extends AbstractPiecewiseConstant {
  /** Epoch day -> fraction (Java `Map<LocalDate, Fraction>`). */
  readonly #dayToFraction: ReadonlyMap<number, Fraction>;

  readonly #defaultValue: Fraction;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:76,87 */
  private constructor(value: Fraction, dayToFraction: ReadonlyMap<number, Fraction> = new Map()) {
    super();
    this.#defaultValue = value;
    this.#dayToFraction = dayToFraction;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:92 */
  #getValue(localDate: LocalDate): Fraction {
    return this.#dayToFraction.get(localDate.toEpochDay()) ?? this.#defaultValue;
  }

  /**
   * Both Java overloads: `of(Fraction)` (:105) and `of(Fraction, Map)` (:123,
   * which copies the map into a new `HashMap`).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:105
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:123
   */
  public static of(
    defaultValue: Fraction,
    dayToFraction?: ReadonlyMap<LocalDate, Fraction>,
  ): PiecewiseConstantSpecificDays {
    if (dayToFraction === undefined) return new PiecewiseConstantSpecificDays(defaultValue);
    return new PiecewiseConstantSpecificDays(defaultValue, PiecewiseConstantSpecificDays.#byEpochDay(dayToFraction));
  }

  /** Re-key by epoch day: the `HashMap` copy of :123 / :136. */
  static #byEpochDay(dayToFraction: ReadonlyMap<LocalDate, Fraction>): Map<number, Fraction> {
    const result = new Map<number, Fraction>();
    for (const [day, fraction] of dayToFraction) result.set(day.toEpochDay(), fraction);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:136 */
  public withDay(day: LocalDate, value: Fraction): PiecewiseConstantSpecificDays {
    const newDayToFraction = new Map(this.#dayToFraction);
    newDayToFraction.set(day.toEpochDay(), value);
    return new PiecewiseConstantSpecificDays(this.#defaultValue, newDayToFraction);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantSpecificDays.java:143 */
  public segmentAt(instant: LocalDateTime, direction: TimeDirection): Segment {
    if (direction === TimeDirection.FORWARD) {
      const day = instant.toLocalDate();
      const start = day.atStartOfDay();
      const value = this.#getValue(day);
      return Segment.forward(start, start.plusDays(1), value);
    }

    // BACKWARD: determine which day contains the instant
    const day = instant.toLocalTime().equals(LocalTime.MIDNIGHT)
      ? instant.toLocalDate().minusDays(1)
      : instant.toLocalDate();

    const end = day.atStartOfDay();
    const value = this.#getValue(day);

    return Segment.backward(end.plusDays(1), end, value);
  }
}
