import type { OpenClose } from '../OpenClose.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from './TimeScale.js';

/**
 * Daily scale that gives closed days zero width.
 *
 * `startingInt` (`HashMap<TimePoint, Integer>`) is lookup-only, so a `Map` keyed by
 * `TimePoint#getMillis()` (equal <=> `TimePoint#equals`) is faithful.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDailyHideClosed.java:44
 */
export class TimeScaleDailyHideClosed implements TimeScale {
  readonly #cellWidth: number;
  readonly #startingDay: TimePoint;
  #biggest: TimePoint;
  readonly #openClose: OpenClose;
  readonly #startingInt = new Map<number, number>();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDailyHideClosed.java:53-59 */
  public constructor(size: number, startingDay: TimePoint, scale: number, openClose: OpenClose) {
    this.#cellWidth = size * scale;
    this.#startingDay = startingDay;
    this.#biggest = startingDay;
    this.#openClose = openClose;
    this.#startingInt.set(startingDay.getMillis(), 0);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDailyHideClosed.java:61-69 */
  public getPosition(instant: TimePoint): number {
    if (instant.compareTo(this.#startingDay) < 0) throw new RangeError('IllegalArgumentException');

    this.#computeUpTo(instant);

    // `startingInt.get(instant) * cellWidth`: a missing key is a NullPointerException on unboxing.
    const index = this.#startingInt.get(instant.getMillis());
    if (index === undefined) throw new Error('NullPointerException');
    return index * this.#cellWidth;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDailyHideClosed.java:71-83 (`biggest` is never advanced upstream either) */
  #computeUpTo(dest: TimePoint): void {
    if (dest.compareTo(this.#biggest) <= 0) return;

    let i = this.#biggest;
    let current = this.#startingInt.get(i.getMillis())!;
    do {
      if (this.getWidth(i) > 0) current++;
      i = i.increment();
      this.#startingInt.set(i.getMillis(), current);
    } while (i.compareTo(dest) < 0);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDailyHideClosed.java:85-90 */
  public getWidth(instant: TimePoint): number {
    if (this.#openClose.isClosed(instant.toDay())) return 0;
    return this.#cellWidth;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDailyHideClosed.java:92-95 */
  public isBreaking(_instant: TimePoint): boolean {
    return true;
  }
}
