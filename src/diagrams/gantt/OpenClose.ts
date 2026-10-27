/**
 * Open/closed calendar of a project, a resource or a task: per-weekday and
 * per-date statuses, working time ranges and an optional active date window,
 * convertible to a {@link PiecewiseConstant}.
 *
 * Java maps: `weekdayStatus` is an `EnumMap` (ordinal order, mirrored by
 * iterating `DayOfWeek.values()`); `dayStatus` is a `HashMap<LocalDate, _>`
 * whose iteration (`asPiecewiseConstant`, :174-184) only fills two maps that
 * are later looked up, never iterated, so no order reaches a result. It is a
 * `Map` keyed by epoch day (`LocalDate` has no identity equality in JS).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:56
 */

import { DayOfWeek } from '../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../core/time/LocalDate.js';
import { LocalDateTime } from '../../core/time/LocalDateTime.js';
import type { TimeRange } from './core/TimeRange.js';
import { DayStatus } from './DayStatus.js';
import { Combiner } from './ngm/math/Combiner.js';
import { Fraction } from './ngm/math/Fraction.js';
import type { PiecewiseConstant } from './ngm/math/PiecewiseConstant.js';
import { PiecewiseConstantHours } from './ngm/math/PiecewiseConstantHours.js';
import { PiecewiseConstantSpecificDays } from './ngm/math/PiecewiseConstantSpecificDays.js';
import { PiecewiseConstantTimeWindow } from './ngm/math/PiecewiseConstantTimeWindow.js';
import { PiecewiseConstantWeekday } from './ngm/math/PiecewiseConstantWeekday.js';

/** A `dayStatus` entry: the date (map key in Java) and its status. */
interface DatedStatus {
  readonly date: LocalDate;
  readonly status: DayStatus;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:56 */
export class OpenClose {
  readonly #weekdayStatus = new Map<DayOfWeek, DayStatus>();
  /** Epoch day -> entry (Java `HashMap<LocalDate, DayStatus>`). */
  readonly #dayStatus = new Map<number, DatedStatus>();
  readonly #workingTimeRanges: TimeRange[] = [];

  #offBefore: LocalDate | undefined;
  #offAfter: LocalDate | undefined;

  #cachedPiecewiseConstant: PiecewiseConstant | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:67 */
  public mutateMe(except: OpenClose | undefined): OpenClose {
    const result = new OpenClose();
    copyInto(result.#weekdayStatus, this.#weekdayStatus);
    copyInto(result.#dayStatus, this.#dayStatus);
    result.#offBefore = this.#offBefore;
    result.#offAfter = this.#offAfter;
    result.#workingTimeRanges.push(...this.#workingTimeRanges);
    if (except !== undefined) {
      copyInto(result.#weekdayStatus, except.#weekdayStatus);
      copyInto(result.#dayStatus, except.#dayStatus);
    }
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:82 */
  public daysInWeek(): number {
    let result = 7;
    for (const status of this.#weekdayStatus.values()) if (status === DayStatus.CLOSE) result--;
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:90 */
  public isClosed(day: LocalDate): boolean {
    const status = this.#getLocalStatus(day);
    if (status !== undefined) return status === DayStatus.CLOSE;

    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:98 */
  #getLocalStatus(day: LocalDate): DayStatus | undefined {
    if (this.#offBefore !== undefined && day.compareTo(this.#offBefore) < 0) return DayStatus.CLOSE;
    if (this.#offAfter !== undefined && day.compareTo(this.#offAfter) > 0) return DayStatus.CLOSE;

    const status1 = this.#dayStatus.get(day.toEpochDay())?.status;
    if (status1 !== undefined) return status1;

    return this.#weekdayStatus.get(day.getDayOfWeek());
  }

  /**
   * Both Java overloads `close(DayOfWeek)` (:116) and `close(LocalDate)` (:126).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:116
   */
  public close(day: DayOfWeek | LocalDate): void {
    this.#setStatus(day, DayStatus.CLOSE);
  }

  /**
   * Both Java overloads `open(DayOfWeek)` (:121) and `open(LocalDate)` (:131).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:121
   */
  public open(day: DayOfWeek | LocalDate): void {
    this.#setStatus(day, DayStatus.OPEN);
  }

  #setStatus(day: DayOfWeek | LocalDate, status: DayStatus): void {
    if (day instanceof DayOfWeek) this.#weekdayStatus.set(day, status);
    else this.#dayStatus.set(day.toEpochDay(), { date: day, status });
    this.#cachedPiecewiseConstant = undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:136 */
  public getLoadAtDUMMY(day: LocalDate): number {
    return this.#getLoatAtInternal(day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:140 */
  public setOffBeforeDate(day: LocalDate | undefined): void {
    this.#offBefore = day;
    this.#cachedPiecewiseConstant = undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:145 */
  public setOffAfterDate(day: LocalDate | undefined): void {
    this.#offAfter = day;
    this.#cachedPiecewiseConstant = undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:150 */
  #getLoatAtInternal(day: LocalDate): number {
    if (this.isClosed(day)) return 0;

    return 100;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:157 */
  public getLastDayIfAny(): LocalDate | undefined {
    return this.#offAfter;
  }

  /**
   * Split into helpers (complexity limits); the order of operations is the Java's.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:161
   */
  public asPiecewiseConstant(): PiecewiseConstant {
    if (this.#cachedPiecewiseConstant !== undefined) return this.#cachedPiecewiseConstant;

    const weekPattern = this.#weekPattern();

    let result: PiecewiseConstant = weekPattern;

    if (this.#dayStatus.size > 0) result = this.#withSpecificDays(weekPattern);

    if (this.#workingTimeRanges.length > 0)
      result = Combiner.product(result, PiecewiseConstantHours.fromWorkingHours(this.#workingTimeRanges));

    this.#cachedPiecewiseConstant = this.#withWindow(result);
    return this.#cachedPiecewiseConstant;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:165-169 (`EnumMap#keySet` is in ordinal order) */
  #weekPattern(): PiecewiseConstantWeekday {
    let weekPattern = PiecewiseConstantWeekday.of(Fraction.ONE);

    for (const day of DayOfWeek.values())
      if (this.#weekdayStatus.get(day) === DayStatus.CLOSE) weekPattern = weekPattern.with(day, Fraction.ZERO);

    return weekPattern;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:173-191 */
  #withSpecificDays(weekPattern: PiecewiseConstantWeekday): PiecewiseConstant {
    const closedDays = new Map<LocalDate, Fraction>();
    const openDays = new Map<LocalDate, Fraction>();

    for (const { date, status } of this.#dayStatus.values()) {
      if (status === DayStatus.CLOSE) closedDays.set(date, Fraction.ZERO);
      else openDays.set(date, Fraction.ONE);
    }

    const specificDaysClosed = PiecewiseConstantSpecificDays.of(Fraction.ONE, closedDays);
    const specificDaysOpen = PiecewiseConstantSpecificDays.of(Fraction.ZERO, openDays);

    return Combiner.max(specificDaysOpen, Combiner.product(weekPattern, specificDaysClosed));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:198-216 */
  #withWindow(result: PiecewiseConstant): PiecewiseConstant {
    const offBefore = this.#offBefore;
    const offAfter = this.#offAfter;

    if (offBefore === undefined && offAfter === undefined) return result;

    if (offBefore === undefined)
      return Combiner.product(
        result,
        new PiecewiseConstantTimeWindow(LocalDateTime.MIN, (offAfter as LocalDate).plusDays(1).atStartOfDay()),
      );

    if (offAfter === undefined)
      return Combiner.product(result, new PiecewiseConstantTimeWindow(offBefore.atStartOfDay(), LocalDateTime.MAX));

    return Combiner.product(
      result,
      new PiecewiseConstantTimeWindow(offBefore.atStartOfDay(), offAfter.plusDays(1).atStartOfDay()),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/OpenClose.java:219 */
  public addWorkingTimeRange(timeRange: TimeRange): void {
    this.#workingTimeRanges.push(timeRange);
  }
}

/** `Map#putAll`. */
function copyInto<K, V>(target: Map<K, V>, source: ReadonlyMap<K, V>): void {
  for (const [key, value] of source) target.set(key, value);
}
