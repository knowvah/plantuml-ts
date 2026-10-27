import { javaHashSetOrder } from '../../../core/java-hash-set.js';
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { Duration } from '../../../core/time/Duration.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { HColor } from '../../../core/style/Value.js';
import type { TimeRange } from '../core/TimeRange.js';
import { TimeRanges } from '../core/TimeRanges.js';
import type { PiecewiseConstant } from '../ngm/math/PiecewiseConstant.js';
import { OpenClose } from '../OpenClose.js';
import type { TimePoint } from '../time/TimePoint.js';
import { WorkingHours } from './WorkingHours.js';

/** An entry of a `HashMap<TimePoint, V>`: the key object and its value. */
interface TimePointEntry<V> {
  readonly key: TimePoint;
  value: V;
}

/**
 * A `HashMap<TimePoint, V>`: lookups are by `TimePoint#equals`; iteration is in the
 * JDK 21 `HashMap` table order (`javaHashSetOrder` over the key insertion history; a
 * `put` on an existing key keeps its position, `HashMap.putVal`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:62-64
 */
class TimePointHashMap<V> {
  /** Keyed by `TimePoint#getMillis()` (equals <=> same `LocalDateTime`); insertion ordered. */
  readonly #entries = new Map<number, TimePointEntry<V>>();

  public get(key: TimePoint): V | undefined {
    return this.#entries.get(key.getMillis())?.value;
  }

  public put(key: TimePoint, value: V): void {
    const existing = this.#entries.get(key.getMillis());
    if (existing === undefined) this.#entries.set(key.getMillis(), { key, value });
    else existing.value = value;
  }

  /** The entries in `HashMap` iteration order. */
  public orderedEntries(): TimePointEntry<V>[] {
    const keys = [...this.#entries.values()].map((e) => e.key);
    const ordered = javaHashSetOrder(
      keys,
      (k) => k.hashCode(),
      (a, b) => a.equals(b),
    );
    return ordered.map((k) => this.#entries.get(k.getMillis())!);
  }
}

/**
 * Value object containing day calendar information: open/closed days, day colors, and
 * day names.
 *
 * `colorDaysOfWeek` (`HashMap<DayOfWeek, HColor>`, :65) is only ever read through
 * `getDayOfWeekColor` (a lookup, :84-86): its identity-hash iteration order never reaches
 * output, so a `Map` is faithful. `verticalSeparatorBefore` (`HashSet<LocalDate>`, :66) and
 * `openCloseForTask` (:67) are lookup-only as well.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:59
 */
export class DayCalendarData {
  readonly #openClose = new OpenClose();
  readonly #nameDays = new TimePointHashMap<string>();
  readonly #colorDaysToday = new TimePointHashMap<HColor>();
  readonly #colorDaysInternal = new TimePointHashMap<HColor>();
  readonly #colorDaysOfWeek = new Map<DayOfWeek, HColor>();
  /** Epoch days (`LocalDate#equals` is value equality). */
  readonly #verticalSeparatorBefore = new Set<number>();
  readonly #openCloseForTask = new Map<string, OpenClose>();
  readonly #workingTimeRanges = new TimeRanges();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:70-72 (`isOpen(LocalDate)`) */
  public isOpen(day: LocalDate): boolean;
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:74-76 (`isOpen(TimePoint)`) */
  public isOpen(instant: TimePoint): boolean;
  public isOpen(arg: LocalDate | TimePoint): boolean {
    const day = 'toDay' in arg ? arg.toDay() : arg;
    return this.#openClose.getLoadAtDUMMY(day) > 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:78-84 */
  public getDayColor(day: TimePoint): HColor | undefined {
    let color = this.#colorDaysToday.get(day);
    if (color === undefined) color = this.#colorDaysInternal.get(day);

    return color;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:86-88 */
  public getDayOfWeekColor(dayOfWeek: DayOfWeek): HColor | undefined {
    return this.#colorDaysOfWeek.get(dayOfWeek);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:90-92 */
  public getDayName(day: TimePoint): string | undefined {
    return this.#nameDays.get(day);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:94-96 */
  public getOpenClose(): OpenClose {
    return this.#openClose;
  }

  /**
   * `colorDaysInternal.keySet()`, in `HashMap` iteration order.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:98-100
   */
  public getColorDays(): TimePoint[] {
    return this.#colorDaysInternal.orderedEntries().map((e) => e.key);
  }

  /**
   * `Collections.unmodifiableMap(nameDays)`: a read-only view whose iteration is the
   * `HashMap` order (upstream iterates it, `GanttDiagram.java:254,409`,
   * `TimeBoundsData.java:149`). Its keys are the stored `TimePoint` objects, so use
   * {@link getDayName} for lookups by an equal `TimePoint`.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:102-104
   */
  public getNameDays(): ReadonlyMap<TimePoint, string> {
    return new Map(this.#nameDays.orderedEntries().map((e) => [e.key, e.value] as const));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:106-108 */
  public hasSeparatorBefore(day: LocalDate): boolean {
    return this.#verticalSeparatorBefore.has(day.toEpochDay());
  }

  // Mutator

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:112-114 */
  public addSeparatorBefore(day: LocalDate): void {
    this.#verticalSeparatorBefore.add(day.toEpochDay());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:116-118 */
  public putNameDay(day: TimePoint, name: string): void {
    this.#nameDays.put(day, name);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:120-122 */
  public putColorDayToday(day: TimePoint, color: HColor): void {
    this.#colorDaysToday.put(day, color);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:124-126 */
  public putColorDay(day: TimePoint, color: HColor): void {
    this.#colorDaysInternal.put(day, color);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:128-130 */
  public putColorDayOfWeek(dow: DayOfWeek, color: HColor): void {
    this.#colorDaysOfWeek.set(dow, color);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:132-134 (`computeIfAbsent`) */
  public getOpenCloseForTask(task: string): OpenClose {
    let result = this.#openCloseForTask.get(task);
    if (result === undefined) {
      result = new OpenClose();
      this.#openCloseForTask.set(task, result);
    }
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:136-138 */
  public getDefaultPlan(): PiecewiseConstant {
    return this.#openClose.asPiecewiseConstant();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:140-143 */
  public addWorkingTimeRange(timeRange: TimeRange): void {
    this.#workingTimeRanges.add(timeRange);
    this.#openClose.addWorkingTimeRange(timeRange);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:145-147 */
  public buildWorkingHours(dayWidth: number, closeFactor: number): WorkingHours {
    return new WorkingHours(this.#workingTimeRanges, dayWidth, closeFactor);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:149-151 */
  public hasWorkingTimeRanges(): boolean {
    return this.#workingTimeRanges.hasWorkingTimeRanges();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/DayCalendarData.java:153-155 */
  public durationOfDays(totalDays: number): Duration {
    return this.#workingTimeRanges.durationOfDays(totalDays);
  }
}
