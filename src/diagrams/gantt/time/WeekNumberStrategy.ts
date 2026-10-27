/**
 * First day of week + minimal days in the first week (week-number rules).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/WeekNumberStrategy.java
 */
import type { DayOfWeek } from '../../../core/time/DayOfWeek.js';

export class WeekNumberStrategy {
  readonly #firstDayOfWeek: DayOfWeek;
  readonly #minimalDaysInFirstWeek: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/WeekNumberStrategy.java:41-45 */
  public constructor(firstDayOfWeek: DayOfWeek, minimalDaysInFirstWeek: number) {
    this.#firstDayOfWeek = firstDayOfWeek;
    this.#minimalDaysInFirstWeek = minimalDaysInFirstWeek;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/WeekNumberStrategy.java:52-54 */
  public getMinimalDaysInFirstWeek(): number {
    return this.#minimalDaysInFirstWeek;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/WeekNumberStrategy.java:56-58 */
  public getFirstDayOfWeek(): DayOfWeek {
    return this.#firstDayOfWeek;
  }
}
