/**
 * A constant workload segment over a time interval; both bounds exclusive,
 * `]start, end[`, FORWARD (start before end) or BACKWARD (start after end).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:90
 */

import type { LocalDateTime } from '../../../../core/time/LocalDateTime.js';
import { Fraction } from './Fraction.js';
import { TimeDirection } from './TimeDirection.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:90 */
export class Segment {
  readonly #start: LocalDateTime;
  readonly #end: LocalDateTime;
  /** The constant workload value over this segment. */
  readonly #value: Fraction;
  readonly #direction: TimeDirection;

  /** Java `Objects.requireNonNull(value)` is guaranteed by the parameter type. */
  private constructor(direction: TimeDirection, start: LocalDateTime, end: LocalDateTime, value: Fraction) {
    this.#direction = direction;
    this.#start = start;
    this.#end = end;
    this.#value = value;
  }

  /**
   * @throws Error "end must be after start" (Java `IllegalArgumentException`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:133
   */
  public static forward(start: LocalDateTime, end: LocalDateTime, value: Fraction): Segment {
    if (start.isBefore(end) === false) throw new Error('end must be after start');
    return new Segment(TimeDirection.FORWARD, start, end, value);
  }

  /**
   * @throws Error "end must be before start" (Java `IllegalArgumentException`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:158
   */
  public static backward(start: LocalDateTime, end: LocalDateTime, value: Fraction): Segment {
    if (end.isBefore(start) === false) throw new Error('end must be before start');
    return new Segment(TimeDirection.BACKWARD, start, end, value);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:171 */
  public getTimeDirection(): TimeDirection {
    return this.#direction;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:191 */
  public startExclusive(): LocalDateTime {
    return this.#start;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:211 */
  public endExclusive(): LocalDateTime {
    return this.#end;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:220 */
  public getValue(): Fraction {
    return this.#value;
  }

  /**
   * @throws Error "time must be within the segment bounds" (Java `IllegalArgumentException`)
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:256
   */
  public split(time: LocalDateTime): [Segment, Segment] {
    if (this.includes(time) === false) throw new Error('time must be within the segment bounds');

    if (this.#direction === TimeDirection.FORWARD) {
      const first = Segment.forward(this.#start, time, this.#value);
      const second = Segment.forward(time, this.#end, this.#value);
      return [first, second];
    } else {
      const first = Segment.backward(this.#start, time, this.#value);
      const second = Segment.backward(time, this.#end, this.#value);
      return [first, second];
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:289 */
  public includes(time: LocalDateTime): boolean {
    if (this.#direction === TimeDirection.FORWARD) return time.isAfter(this.#start) && time.isBefore(this.#end);
    else return time.isBefore(this.#start) && time.isAfter(this.#end);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:310 */
  public toString(): string {
    return `${this.getTimeDirection()} ]${this.#start.toString()}, ${this.#end.toString()}[ value=${this.#value.toString()}`;
  }

  /**
   * Both Java overloads: `intersection(Segment[])` (valueFunction defaults to
   * `Fraction.PRODUCT`, `Segment.java:337`) and `intersection(Segment[],
   * BiFunction)` (`Segment.java:371`).
   *
   * @throws Error (Java `IllegalArgumentException`) "No segments to intersect",
   *   "All segments must have the same direction", "Segments do not overlap"
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:336
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:371
   */
  public static intersection(
    segments: readonly Segment[],
    valueFunction: (a: Fraction, b: Fraction) => Fraction = Fraction.PRODUCT,
  ): Segment {
    const first = segments[0];
    if (first === undefined) throw new Error('No segments to intersect');

    if (segments.length === 1) return first;

    const direction = first.getTimeDirection();

    let start = first.startExclusive();
    let end = first.endExclusive();
    let combinedValue = first.getValue();

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i] as Segment;

      if (segment.getTimeDirection() !== direction) throw new Error('All segments must have the same direction');

      if (direction === TimeDirection.FORWARD) {
        if (segment.startExclusive().isAfter(start)) start = segment.startExclusive();
        if (segment.endExclusive().isBefore(end)) end = segment.endExclusive();
      } else {
        if (segment.startExclusive().isBefore(start)) start = segment.startExclusive();
        if (segment.endExclusive().isAfter(end)) end = segment.endExclusive();
      }

      combinedValue = valueFunction(combinedValue, segment.getValue());
    }

    if (direction === TimeDirection.FORWARD) {
      if (start.isBefore(end) === false) throw new Error('Segments do not overlap');
      return Segment.forward(start, end, combinedValue);
    } else {
      if (end.isBefore(start) === false) throw new Error('Segments do not overlap');
      return Segment.backward(start, end, combinedValue);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/math/Segment.java:418 */
  public computeClampedStart(current: LocalDateTime): LocalDateTime {
    if (this.#direction === TimeDirection.FORWARD)
      return current.isAfter(this.startExclusive()) ? current : this.startExclusive();
    else return current.isBefore(this.startExclusive()) ? current : this.startExclusive();
  }
}
