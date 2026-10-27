/**
 * Intra-day piecewise constant profile (a `TreeMap<LocalTime, Fraction>` of
 * boundaries).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:48
 */

import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import { LocalTime } from '../../../../core/time/LocalTime.js';
import type { TimeRange } from '../../core/TimeRange.js';
import { AbstractPiecewiseConstant } from './AbstractPiecewiseConstant.js';
import { Fraction } from './Fraction.js';
import { Segment } from './Segment.js';
import { TimeDirection } from './TimeDirection.js';

/** A `TreeMap<LocalTime, Fraction>` entry. */
interface Entry {
  readonly key: LocalTime;
  readonly value: Fraction;
}

/**
 * The `NavigableMap<LocalTime, Fraction>` subset used: `put`, `get`, `putAll`,
 * `floorEntry`, `lowerEntry`, `higherKey`, `lastEntry`. Entries stay sorted by
 * `LocalTime#compareTo`; keys are unique by `LocalTime#equals`.
 */
class TimeBoundaries {
  #entries: Entry[] = [];

  public copy(): TimeBoundaries {
    const result = new TimeBoundaries();
    result.#entries = [...this.#entries];
    return result;
  }

  public put(key: LocalTime, value: Fraction): void {
    const index = this.#entries.findIndex((entry) => entry.key.compareTo(key) >= 0);
    const found = this.#entries[index];
    if (found !== undefined && found.key.equals(key)) this.#entries[index] = { key, value };
    else if (index === -1) this.#entries.push({ key, value });
    else this.#entries.splice(index, 0, { key, value });
  }

  public get(key: LocalTime): Fraction | undefined {
    return this.#entries.find((entry) => entry.key.equals(key))?.value;
  }

  /** Greatest entry with key <= `key`. */
  public floorEntry(key: LocalTime): Entry | undefined {
    return this.#entries.filter((entry) => entry.key.compareTo(key) <= 0).pop();
  }

  /** Greatest entry with key < `key`. */
  public lowerEntry(key: LocalTime): Entry | undefined {
    return this.#entries.filter((entry) => entry.key.compareTo(key) < 0).pop();
  }

  /** Least key > `key`. */
  public higherKey(key: LocalTime): LocalTime | undefined {
    return this.#entries.find((entry) => entry.key.compareTo(key) > 0)?.key;
  }

  public lastEntry(): Entry | undefined {
    return this.#entries[this.#entries.length - 1];
  }
}

/** A Java dereference of a null bound: `NullPointerException`. */
function nonNull(time: LocalTime | null): LocalTime {
  if (time === null) throw new Error('NullPointerException');
  return time;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:48 */
export class PiecewiseConstantHours extends AbstractPiecewiseConstant {
  readonly #defaultValue: Fraction;

  readonly #timeBoundaries: TimeBoundaries;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:54 */
  private constructor(defaultValue: Fraction, timeBoundaries: TimeBoundaries = new TimeBoundaries()) {
    super();
    this.#defaultValue = defaultValue;
    this.#timeBoundaries = timeBoundaries;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:58 */
  public static of(defaultValue: Fraction): PiecewiseConstantHours {
    return new PiecewiseConstantHours(defaultValue);
  }

  /**
   * ZERO everywhere by default and ONE inside each range; an empty or `null`
   * list yields a profile closed for the whole day.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:76
   */
  public static fromWorkingHours(workingTimeRanges: readonly TimeRange[] | null): PiecewiseConstantHours {
    let result = PiecewiseConstantHours.of(Fraction.ZERO);
    if (workingTimeRanges === null) return result;

    for (const range of workingTimeRanges) result = result.with(range, Fraction.ONE);

    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:88 */
  public segmentAt(instant: LocalDateTime, direction: TimeDirection): Segment {
    return direction === TimeDirection.FORWARD ? this.#segmentForwardAt(instant) : this.#segmentBackwardAt(instant);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:92 */
  #segmentForwardAt(instant: LocalDateTime): Segment {
    const dayStart = instant.toLocalDate().atStartOfDay();
    const t = instant.toLocalTime();
    const ent = this.#timeBoundaries.floorEntry(t);

    const startKey = ent !== undefined ? ent.key : LocalTime.MIDNIGHT;
    const value = this.#timeBoundaries.get(startKey) ?? this.#defaultValue;

    const endKey = this.#timeBoundaries.higherKey(startKey); // next boundary after start
    const start = dayStart.with(startKey);
    const end = endKey === undefined ? dayStart.plusDays(1) : dayStart.with(endKey);

    return Segment.forward(start, end, value);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:109 */
  #segmentBackwardAt(instant: LocalDateTime): Segment {
    const t = instant.toLocalTime();

    // At midnight, backward segment is the last one of the previous day
    if (t.equals(LocalTime.MIDNIGHT)) {
      const dayStart = instant.toLocalDate().minusDays(1).atStartOfDay();

      const last = this.#timeBoundaries.lastEntry(); // may be undefined
      const startKey = last === undefined ? LocalTime.MIDNIGHT : last.key;
      const value = last === undefined ? this.#defaultValue : last.value;

      const start = dayStart.plusDays(1); // 00:00 of next day
      const end = dayStart.with(startKey); // start of last segment
      return Segment.backward(start, end, value);
    }

    const dayStart = instant.toLocalDate().atStartOfDay();

    const ent = this.#timeBoundaries.lowerEntry(t);
    const startKey = ent === undefined ? LocalTime.MIDNIGHT : ent.key;
    const value = ent === undefined ? this.#defaultValue : ent.value;

    const endKey = this.#timeBoundaries.higherKey(startKey); // end of that segment
    const start = endKey === undefined ? dayStart.plusDays(1) : dayStart.with(endKey);
    const end = dayStart.with(startKey);

    return Segment.backward(start, end, value);
  }

  /**
   * @throws Error "start must be strictly before end" (Java `IllegalArgumentException`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/PiecewiseConstantHours.java:138
   */
  public with(timeRange: TimeRange, fraction: Fraction): PiecewiseConstantHours {
    const rangeStart = nonNull(timeRange.getStart());
    const rangeEnd = nonNull(timeRange.getEnd());
    if (rangeEnd.equals(LocalTime.MIDNIGHT) === false && rangeStart.compareTo(rangeEnd) >= 0)
      throw new Error('start must be strictly before end');

    const boundaries = this.#timeBoundaries.copy();
    boundaries.put(rangeStart, fraction);
    if (rangeEnd.equals(LocalTime.MIDNIGHT) === false) boundaries.put(rangeEnd, this.#defaultValue);
    return new PiecewiseConstantHours(this.#defaultValue, boundaries);
  }
}
