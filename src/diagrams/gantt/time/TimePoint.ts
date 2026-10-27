/**
 * A UTC date-time on the gantt axis.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:50
 */

import { DEFAULT_CLOCK, localEpochDay } from '../../../core/clock.js';
import type { Clock } from '../../../core/clock.js';
import type { Locale } from '../../../core/utils/I18nTimeData.js';
import { Instant } from '../../../core/time/Instant.js';
import { LocalDate } from '../../../core/time/LocalDate.js';
import { LocalDateTime } from '../../../core/time/LocalDateTime.js';
import type { Month } from '../../../core/time/Month.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import { WeekFields } from '../../../core/time/WeekFields.js';
import { YearMonth } from '../../../core/time/YearMonth.js';
import { ZoneOffset } from '../../../core/time/ZoneOffset.js';
import { PrintScale } from '../core/PrintScale.js';
import type { PValue } from '../PValue.js';
import { MonthUtils } from './MonthUtils.js';
import { TimePointFormat } from './TimePointFormat.js';
import type { WeekNumberStrategy } from './WeekNumberStrategy.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:53 */
export const MILLISECONDS_PER_DAY = 1000 * 3600 * 24;

const DAYS_PER_WEEK = 7;

/** `Math.floorDiv(long, long)`. */
function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

export class TimePoint implements PValue {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:53 */
  public static readonly MILLISECONDS_PER_DAY: number = MILLISECONDS_PER_DAY;

  readonly #utcDateTime: LocalDateTime;

  private constructor(utcDateTime: LocalDateTime) {
    this.#utcDateTime = utcDateTime;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:57-59 */
  public static epoch(): LocalDate {
    return Instant.EPOCH.atZone(ZoneOffset.UTC).toLocalDate();
  }

  /**
   * `ofStartOfDay(int, String, int)` (:61-63), `ofStartOfDay(LocalDate)` (:69-71) and
   * `ofStartOfDay(int, int, int)` (:73-75).
   */
  public static ofStartOfDay(day: LocalDate): TimePoint;
  public static ofStartOfDay(year: number, month: string | number, dayOfMonth: number): TimePoint;
  public static ofStartOfDay(first: LocalDate | number, month?: string | number, dayOfMonth?: number): TimePoint {
    if (first instanceof LocalDate) return new TimePoint(first.atStartOfDay());
    const m = typeof month === 'string' ? MonthUtils.fromString(month) : (month as number);
    return new TimePoint(LocalDateTime.of(first, m, dayOfMonth as number, 0, 0));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:65-67 */
  public static of(time: LocalDateTime): TimePoint {
    return new TimePoint(time);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:77-79 */
  public static ofEndOfDayMinusOneSecond(day: LocalDate): TimePoint {
    return TimePoint.ofStartOfDay(day.plusDays(1)).minusOneSecond();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:85-87 */
  public static create(ms: number): TimePoint {
    return new TimePoint(LocalDateTime.ofInstant(Instant.ofEpochMilli(ms), ZoneOffset.UTC));
  }

  /**
   * Deviation (D3a): upstream reads the wall clock,
   * `LocalDateTime.now(ZoneOffset.UTC)` (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:89-91`); the
   * port reads the injected {@link Clock}. Upstream callers: none (grep over
   * `net/`: only the definition, `:89`).
   */
  public static nowUtc1(clock: Clock = DEFAULT_CLOCK): TimePoint {
    return new TimePoint(LocalDateTime.ofInstant(Instant.ofEpochMilli(clock.nowMillis()), ZoneOffset.UTC));
  }

  /**
   * Deviation (D3a): upstream is `LocalDate.now().atStartOfDay()` in the JVM
   * default zone (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:93-95`); the port takes the local
   * date from the injected {@link Clock} (`localEpochDay`). Upstream callers:
   * `GanttDiagram.java:457` and `:464` (batch 5 threads the clock there).
   */
  public static todayAtMidnight(clock: Clock = DEFAULT_CLOCK): TimePoint {
    return new TimePoint(LocalDate.ofEpochDay(localEpochDay(clock)).atStartOfDay());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:102-104 */
  public toLocalDateTime(): LocalDateTime {
    return this.#utcDateTime;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:106-108 */
  public toStringShort(locale: Locale): string {
    return TimePointFormat.MONTH_AND_DAY.format(this, locale);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:110-113 (`weekOfYear()`, 0 before week 1) */
  public getWeekOfYear(strategy: WeekNumberStrategy): number {
    const wf = WeekFields.of(strategy.getFirstDayOfWeek(), strategy.getMinimalDaysInFirstWeek());
    return this.#utcDateTime.toLocalDate().get(wf.weekOfYear());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:115-117 */
  public increment(): TimePoint;
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:196-200 */
  public increment(printScale: PrintScale): TimePoint;
  public increment(printScale?: PrintScale): TimePoint {
    if (printScale === PrintScale.WEEKLY) return this.addDays(DAYS_PER_WEEK);
    return this.addDays(1);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:119-121 */
  public decrement(): TimePoint {
    return this.addDays(-1);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:123-125 */
  public addDays(nday: number): TimePoint {
    return new TimePoint(this.#utcDateTime.plusDays(nday));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:127-129 */
  public getAbsoluteDayNum(): number {
    return floorDiv(this.getMillis(), MILLISECONDS_PER_DAY);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:131-133 */
  public getMillis(): number {
    return this.#utcDateTime.toInstant(ZoneOffset.UTC).toEpochMilli();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:135-137 */
  public year(): number {
    return this.monthYear().getYear();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:139-141 (integer division) */
  public quarter(): string {
    return 'Q' + String(Math.trunc((this.month().ordinal() + 3) / 3));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:143-146 */
  public toString(): string {
    return this.#utcDateTime.toString();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:148-151 (= `LocalDateTime#hashCode`, JDK-exact) */
  public hashCode(): number {
    return this.#utcDateTime.hashCode();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:153-162 */
  public equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof TimePoint)) return false;

    return this.#utcDateTime.equals(obj.#utcDateTime);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:164-167 */
  public compareTo(other: TimePoint): number {
    return this.#utcDateTime.compareTo(other.#utcDateTime);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:169-171 */
  public getDayOfMonth(): number {
    return this.#utcDateTime.getDayOfMonth();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:173-175 */
  public month(): Month {
    return this.#utcDateTime.getMonth();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:177-179 */
  public monthYear(): YearMonth {
    return YearMonth.from(this.#utcDateTime);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:181-183 */
  public toDayOfWeek(): DayOfWeek {
    return this.#utcDateTime.getDayOfWeek();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:185-187 */
  public toDay(): LocalDate {
    return this.#utcDateTime.toLocalDate();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:189-191 */
  public static min(d1: TimePoint, d2: TimePoint): TimePoint {
    return d1.compareTo(d2) <= 0 ? d1 : d2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:193-195 */
  public static max(d1: TimePoint, d2: TimePoint): TimePoint {
    return d1.compareTo(d2) >= 0 ? d1 : d2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:203-208 (floor(ms / day) * day) */
  public roundDayDown(): TimePoint {
    const ms = this.getMillis();
    const floored = floorDiv(ms, MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY;
    return TimePoint.create(floored);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:210-215 (ceil(ms / day) * day) */
  public roundDayUp(): TimePoint {
    const ms = this.getMillis();
    const ceiled = floorDiv(ms + MILLISECONDS_PER_DAY - 1, MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY;
    return TimePoint.create(ceiled);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:217-219 */
  public minusOneSecond(): TimePoint {
    return new TimePoint(this.#utcDateTime.minusSeconds(1));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:221-223 */
  public plusOneSecond(): TimePoint {
    return new TimePoint(this.#utcDateTime.plusSeconds(1));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePoint.java:225-227 */
  public floorToDay(): TimePoint {
    return new TimePoint(this.#utcDateTime.toLocalDate().atStartOfDay());
  }
}
