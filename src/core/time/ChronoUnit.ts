/**
 * `java.time.temporal.ChronoUnit`, DAYS only -- the one unit gantt names
 * (`GanttTaskTableColumn.java:116` `ChronoUnit.DAYS.getDuration()`,
 * `data/TimeBoundsData.java:155` `ChronoUnit.DAYS.between(minDay, maxDay)`).
 * Java ordinal of DAYS is 7 (NANOS 0, MICROS 1, MILLIS 2, SECONDS 3, MINUTES 4,
 * HOURS 5, HALF_DAYS 6, DAYS 7).
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/temporal/ChronoUnit.html
 */
import { Duration } from './Duration.js';
import type { LocalDate } from './LocalDate.js';
import { SECONDS_PER_DAY } from './time-math.js';

export class ChronoUnit {
  public static readonly DAYS: ChronoUnit = new ChronoUnit('Days', 7, SECONDS_PER_DAY);

  readonly #name: string;
  readonly #ordinal: number;
  readonly #seconds: number;

  private constructor(name: string, ordinal: number, seconds: number) {
    this.#name = name;
    this.#ordinal = ordinal;
    this.#seconds = seconds;
  }

  public ordinal(): number {
    return this.#ordinal;
  }

  /** `ChronoUnit#getDuration()`. */
  public getDuration(): Duration {
    return Duration.ofSeconds(this.#seconds);
  }

  /** `ChronoUnit#between(Temporal, Temporal)` for `LocalDate` operands: `start.until(end, DAYS)` = epoch-day difference. */
  public between(start: LocalDate, end: LocalDate): number {
    return end.toEpochDay() - start.toEpochDay();
  }

  public toString(): string {
    return this.#name;
  }
}
