/**
 * `java.time.YearMonth` -- gantt uses only `YearMonth.from(LocalDateTime)` and
 * `getYear()` (`time/TimePoint.java:177-178,136`).
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/YearMonth.html
 */
import type { LocalDateTime } from './LocalDateTime.js';

export class YearMonth {
  readonly #year: number;
  readonly #month: number;

  private constructor(year: number, month: number) {
    this.#year = year;
    this.#month = month;
  }

  /** `YearMonth.from(TemporalAccessor)` for a `LocalDateTime`. */
  public static from(temporal: LocalDateTime): YearMonth {
    const date = temporal.toLocalDate();
    return new YearMonth(date.getYear(), date.getMonthValue());
  }

  public getYear(): number {
    return this.#year;
  }

  public equals(other: unknown): boolean {
    return other instanceof YearMonth && other.#year === this.#year && other.#month === this.#month;
  }
}
