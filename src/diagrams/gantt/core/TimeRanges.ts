import { Duration } from '../../../core/time/Duration.js';
import type { TimeRange } from './TimeRange.js';

/**
 * TimeRanges -- an ordered list of working-hours ranges.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:39-85
 */
export class TimeRanges implements Iterable<TimeRange> {
  readonly #timeRanges: TimeRange[] = [];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:43-46 */
  public constructor(...data: TimeRange[]) {
    for (const tr of data) this.#timeRanges.push(tr);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:48-50 */
  public hasWorkingTimeRanges(): boolean {
    return this.#timeRanges.length > 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:52-54 */
  public add(timeRange: TimeRange): void {
    this.#timeRanges.push(timeRange);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:56-59 (`List#toString`: `[a, b]`) */
  public toString(): string {
    return `[${this.#timeRanges.map((r) => r.toString()).join(', ')}]`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:61-64 (an unmodifiable view's iterator) */
  public [Symbol.iterator](): Iterator<TimeRange> {
    return [...this.#timeRanges][Symbol.iterator]();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:66-72 */
  public totalWorkingDuration(): Duration {
    let working = Duration.ZERO;
    for (const range of this) {
      const start = range.getStart();
      const end = range.getEnd();
      if (start === null || end === null) throw new Error('NullPointerException');
      working = working.plus(Duration.between(start, end));
    }
    return working;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TimeRanges.java:74-80 */
  public durationOfDays(totalDays: number): Duration {
    if (this.hasWorkingTimeRanges()) return this.totalWorkingDuration().multipliedBy(totalDays);

    return Duration.ofDays(totalDays);
  }
}
