/**
 * The slice of `java.time.temporal.TemporalField` that `LocalDate.get(field)`
 * needs: gantt only passes `WeekFields#weekOfYear()` (`time/TimePoint.java:105`).
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/temporal/TemporalField.html
 */
import type { LocalDate } from './LocalDate.js';

export interface TemporalField {
  /** `TemporalField#getFrom(TemporalAccessor)` restricted to a `LocalDate`. */
  getFrom(date: LocalDate): number;
}
