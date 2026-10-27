/**
 * Immutable weekly workload pattern: each `DayOfWeek` maps to a constant
 * {@link Fraction}. Java uses an `EnumMap` (ordinal order); only `get` is used
 * on it, so no iteration order reaches a result.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java:63
 */

import { DayOfWeek } from '../../../../core/time/DayOfWeek.js';
import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import { LocalTime } from '../../../../core/time/LocalTime.js';
import { AbstractPiecewiseConstant } from './AbstractPiecewiseConstant.js';
import type { Fraction } from './Fraction.js';
import { Segment } from './Segment.js';
import { TimeDirection } from './TimeDirection.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java:65 (`EnumSet.allOf(DayOfWeek.class)`) */
const ALL_DAYS: readonly DayOfWeek[] = DayOfWeek.values();

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java:63 */
export class PiecewiseConstantWeekday extends AbstractPiecewiseConstant {
  /** Complete day-to-workload mapping (all 7 days), never mutated. */
  readonly #workloadByDay: ReadonlyMap<DayOfWeek, Fraction>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java:76 */
  private constructor(workloadByDay: ReadonlyMap<DayOfWeek, Fraction>) {
    super();
    this.#workloadByDay = workloadByDay;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java:86 */
  public static of(sameWorkload: Fraction): PiecewiseConstantWeekday {
    const map = new Map<DayOfWeek, Fraction>();
    for (const day of ALL_DAYS) map.set(day, sameWorkload);

    return new PiecewiseConstantWeekday(map);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java:109 */
  public with(day: DayOfWeek, newWorkload: Fraction): PiecewiseConstantWeekday {
    const copy = new Map(this.#workloadByDay);
    copy.set(day, newWorkload);
    return new PiecewiseConstantWeekday(copy);
  }

  /** The workload of `day`; `EnumMap#get` on a complete mapping never misses. */
  #workloadOf(day: DayOfWeek): Fraction {
    // The mapping is complete by construction (`of` fills all 7 days, `with` replaces one), so the lookup cannot miss.
    return this.#workloadByDay.get(day) as Fraction;
  }

  /**
   * `midnight.minusDays(1)` (:125) is `plusDays(-1)`: `LocalDateTime.minusDays`
   * is not in the ported D2 subset (JDK: `minusDays(n)` = `plusDays(-n)`).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantWeekday.java:118
   */
  public segmentAt(instant: LocalDateTime, direction: TimeDirection): Segment {
    const midnight = instant.toLocalDate().atStartOfDay();

    if (direction === TimeDirection.FORWARD) {
      const value = this.#workloadOf(midnight.getDayOfWeek());
      return Segment.forward(midnight, midnight.plusDays(1), value);
    }

    // BACKWARD: determine which day contains the instant
    // Midnight belongs to the previous day in backward iteration
    const end = instant.toLocalTime().equals(LocalTime.MIDNIGHT) ? midnight.plusDays(-1) : midnight;

    const value = this.#workloadOf(end.getDayOfWeek());
    return Segment.backward(end.plusDays(1), end, value);
  }
}
