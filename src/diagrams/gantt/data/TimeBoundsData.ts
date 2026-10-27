import { ChronoUnit } from '../../../core/time/ChronoUnit.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { Task } from '../core/Task.js';
import { TaskGroup } from '../core/TaskGroup.js';
import { TaskSeparator } from '../core/TaskSeparator.js';
import type { TimeHeader } from '../draw/header/TimeHeader.js';
import { TimePoint } from '../time/TimePoint.js';
import type { DayCalendarData } from './DayCalendarData.js';
import type { GanttModelData } from './GanttModelData.js';

/**
 * Value object containing the time bounds of a Gantt diagram.
 *
 * `maxDay` starts null in Java (and is read before `initMinMax` only by code that has
 * already set it); here it is `undefined` until set, and the getter returns the field as is.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeBoundsData.java:46
 */
export class TimeBoundsData {
  #minDay: LocalDate = TimePoint.epoch();
  #maxDay: LocalDate | undefined;
  #printStart: LocalDate | undefined;
  #printEnd: LocalDate | undefined;

  /** @see TimeBoundsData.java:53-55 */
  public getMinDay(): LocalDate {
    return this.#minDay;
  }

  /** Java returns the null field; every caller runs after `initMinMax` (GanttDiagram), so it is typed non-null. @see TimeBoundsData.java:57-59 */
  public getMaxDay(): LocalDate {
    return this.#maxDay as LocalDate;
  }

  /** @see TimeBoundsData.java:61-63 */
  public getPrintStart(): LocalDate | undefined {
    return this.#printStart;
  }

  /** @see TimeBoundsData.java:65-67 */
  public getPrintEnd(): LocalDate | undefined {
    return this.#printEnd;
  }

  // Setters

  /** @see TimeBoundsData.java:71-73 */
  public setMinDay(minDay: LocalDate): void {
    this.#minDay = minDay;
  }

  /** `null` is accepted: `initMinMax` resets it (:123). @see TimeBoundsData.java:75-77 */
  public setMaxDay(maxDay: LocalDate | undefined): void {
    this.#maxDay = maxDay;
  }

  /** @see TimeBoundsData.java:79-81 */
  public setPrintStart(printStart: LocalDate | undefined): void {
    this.#printStart = printStart;
  }

  /** @see TimeBoundsData.java:83-85 */
  public setPrintEnd(printEnd: LocalDate | undefined): void {
    this.#printEnd = printEnd;
  }

  /** @see TimeBoundsData.java:87-95 */
  public getStartForDrawing(tmp: Task): TimePoint {
    let result: TimePoint;
    if (this.getPrintStart() === undefined) result = tmp.getStart();
    else result = TimePoint.max(TimePoint.ofStartOfDay(this.getMinDay()), tmp.getStart());

    return result;
  }

  /** @see TimeBoundsData.java:97-105 */
  public getEndForDrawing(tmp: Task): TimePoint {
    let result: TimePoint;
    if (this.getPrintStart() === undefined) result = tmp.getEnd();
    else result = TimePoint.min(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)), tmp.getEnd());

    return result;
  }

  /** @see TimeBoundsData.java:107-118 */
  public isHidden(task: Task): boolean {
    if (this.getPrintStart() === undefined || task instanceof TaskSeparator) return false;

    if (task.getEndMinusOneDayTOBEREMOVED().compareTo(TimePoint.ofStartOfDay(this.getMinDay())) < 0) return true;

    if (task.getStart().compareTo(TimePoint.ofEndOfDayMinusOneSecond(this.getMaxDay())) > 0) return true;

    return false;
  }

  /** @see TimeBoundsData.java:120-124 */
  public getBarsColumnWidth(timeHeader: TimeHeader): number {
    const xmin = timeHeader.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMinDay()));
    const xmax = timeHeader.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay()).addDays(1));
    return xmax - xmin;
  }

  /**
   * The two calendar loops only raise `maxDay` to the largest day, so the HashMap/HashSet
   * iteration order (row 20) cannot reach the result.
   * @see TimeBoundsData.java:126-150
   */
  public initMinMax(modelData: GanttModelData, dayCalendar: DayCalendarData): void {
    if (modelData.getTasks().length === 0) {
      this.setMaxDay(this.getMinDay());
    } else {
      this.setMaxDay(undefined);
      for (const task of modelData.getTasks()) {
        if (task instanceof TaskSeparator || task instanceof TaskGroup) continue;

        const tmp = task.getEnd().minusOneSecond();
        const max = this.#maxDay;
        if (max === undefined || max.compareTo(tmp.toDay()) < 0) this.setMaxDay(tmp.toDay());
      }
    }

    for (const d of dayCalendar.getColorDays())
      if (d.toDay().compareTo(this.getMaxDay()) > 0) this.setMaxDay(d.toDay());

    for (const d of dayCalendar.getNameDays().keys())
      if (d.toDay().compareTo(this.getMaxDay()) > 0) this.setMaxDay(d.toDay());
  }

  /** @see TimeBoundsData.java:152-154 */
  public durationInDays(): number {
    return ChronoUnit.DAYS.between(this.#minDay, this.getMaxDay());
  }
}
