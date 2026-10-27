/**
 * Value object containing week-related configuration and locale.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java
 */
import { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import { type Locale, newLocale } from '../../../core/utils/I18nTimeData.js';
import type { WeeklyHeaderStrategy } from '../draw/WeeklyHeaderStrategy.js';
import { WeekNumberStrategy } from '../time/WeekNumberStrategy.js';

export class WeekConfigData {
  /** `Locale.ENGLISH` (language "en", no country). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:44 */
  #locale: Locale = newLocale('en');

  /** Let's follow ISO-8601 rules. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:47 */
  #weekNumberStrategy: WeekNumberStrategy = new WeekNumberStrategy(DayOfWeek.MONDAY, 4);
  #weeklyHeaderStrategy: WeeklyHeaderStrategy | undefined;
  #weekStartingNumber = 0;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:52-54 */
  public getWeekNumberStrategy(): WeekNumberStrategy {
    return this.#weekNumberStrategy;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:56-58 */
  public getWeeklyHeaderStrategy(): WeeklyHeaderStrategy | undefined {
    return this.#weeklyHeaderStrategy;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:60-62 */
  public getWeekStartingNumber(): number {
    return this.#weekStartingNumber;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:64-66 */
  public getLocale(): Locale {
    return this.#locale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:70-72 */
  public setLocale(locale: Locale): void {
    this.#locale = locale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:74-76 */
  public setWeekNumberStrategy(weekNumberStrategy: WeekNumberStrategy): void {
    this.#weekNumberStrategy = weekNumberStrategy;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:78-80 */
  public setWeeklyHeaderStrategy(weeklyHeaderStrategy: WeeklyHeaderStrategy | undefined): void {
    this.#weeklyHeaderStrategy = weeklyHeaderStrategy;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WeekConfigData.java:82-84 */
  public setWeekStartingNumber(weekStartingNumber: number): void {
    this.#weekStartingNumber = weekStartingNumber;
  }
}
