/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePointFormat.java:40
 */

import { dayOfWeekLong, dayOfWeekShort, monthLong, monthShort, type Locale } from '../../../core/utils/I18nTimeData.js';
import type { TimePoint } from './TimePoint.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePointFormat.java:40 */
export class TimePointFormat {
  public static readonly DAY_OF_WEEK_SHORT: TimePointFormat = new TimePointFormat('DAY_OF_WEEK_SHORT', 0);
  public static readonly DAY_OF_WEEK_LONG: TimePointFormat = new TimePointFormat('DAY_OF_WEEK_LONG', 1);
  public static readonly MONTH_YEAR_SHORT: TimePointFormat = new TimePointFormat('MONTH_YEAR_SHORT', 2);
  public static readonly MONTH_YEAR_LONG: TimePointFormat = new TimePointFormat('MONTH_YEAR_LONG', 3);
  public static readonly MONTH_LONG: TimePointFormat = new TimePointFormat('MONTH_LONG', 4);
  public static readonly MONTH_SHORT: TimePointFormat = new TimePointFormat('MONTH_SHORT', 5);
  public static readonly YEAR: TimePointFormat = new TimePointFormat('YEAR', 6);
  public static readonly QUARTER: TimePointFormat = new TimePointFormat('QUARTER', 7);
  public static readonly DAY_OF_MONTH: TimePointFormat = new TimePointFormat('DAY_OF_MONTH', 8);
  public static readonly MONTH_AND_DAY: TimePointFormat = new TimePointFormat('MONTH_AND_DAY', 9);

  static readonly #VALUES: readonly TimePointFormat[] = [
    TimePointFormat.DAY_OF_WEEK_SHORT,
    TimePointFormat.DAY_OF_WEEK_LONG,
    TimePointFormat.MONTH_YEAR_SHORT,
    TimePointFormat.MONTH_YEAR_LONG,
    TimePointFormat.MONTH_LONG,
    TimePointFormat.MONTH_SHORT,
    TimePointFormat.YEAR,
    TimePointFormat.QUARTER,
    TimePointFormat.DAY_OF_MONTH,
    TimePointFormat.MONTH_AND_DAY,
  ];

  readonly #name: string;
  readonly #ordinal: number;

  private constructor(name: string, ordinal: number) {
    this.#name = name;
    this.#ordinal = ordinal;
  }

  /** `TimePointFormat.values()` -- a fresh array, in ordinal order. */
  public static values(): TimePointFormat[] {
    return [...TimePointFormat.#VALUES];
  }

  /** `Enum#name()`. */
  public name(): string {
    return this.#name;
  }

  /** `Enum#ordinal()`. */
  public ordinal(): number {
    return this.#ordinal;
  }

  /**
   * The I18nTimeData lookups take 0-based ordinals, so `.ordinal()` is passed
   * for `DayOfWeek` / `Month`.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePointFormat.java:45-85
   */
  public format(when: TimePoint, locale: Locale): string {
    return formatTimePoint(this, when, locale);
  }

  public toString(): string {
    return this.#name;
  }
}

/**
 * The switch of `TimePointFormat#format`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePointFormat.java:45-85
 */
function formatTimePoint(format: TimePointFormat, when: TimePoint, locale: Locale): string {
  switch (format) {
    case TimePointFormat.DAY_OF_MONTH:
      return '' + String(when.getDayOfMonth());

    case TimePointFormat.QUARTER:
      return '' + when.quarter();

    case TimePointFormat.YEAR:
      return '' + String(when.year());

    case TimePointFormat.DAY_OF_WEEK_LONG:
      return dayOfWeekLong(when.toDayOfWeek().ordinal(), locale);

    case TimePointFormat.DAY_OF_WEEK_SHORT:
      return dayOfWeekShort(when.toDayOfWeek().ordinal(), locale);

    case TimePointFormat.MONTH_LONG:
      return monthLong(when.month().ordinal(), locale);

    case TimePointFormat.MONTH_SHORT:
      return monthShort(when.month().ordinal(), locale);

    case TimePointFormat.MONTH_YEAR_SHORT:
      return monthShort(when.month().ordinal(), locale) + ' ' + String(when.year());

    case TimePointFormat.MONTH_YEAR_LONG:
      return monthLong(when.month().ordinal(), locale) + ' ' + String(when.year());

    case TimePointFormat.MONTH_AND_DAY:
      return monthAndDay(when, locale);
  }
  throw new Error('IllegalStateException');
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/time/TimePointFormat.java:87-107 */
function monthAndDay(when: TimePoint, locale: Locale): string {
  const lang = locale.language;
  const day = String(when.getDayOfMonth());
  switch (lang) {
    case 'fr':
      return day + ' ' + formatTimePoint(TimePointFormat.MONTH_SHORT, when, locale);
    case 'es':
      return day + ' de ' + formatTimePoint(TimePointFormat.MONTH_SHORT, when, locale);
    case 'de':
      return day + '. ' + formatTimePoint(TimePointFormat.MONTH_SHORT, when, locale);
    case 'ja':
      return formatTimePoint(TimePointFormat.MONTH_SHORT, when, locale) + '/' + day + '日';
    case 'ko':
      return formatTimePoint(TimePointFormat.MONTH_SHORT, when, locale) + ' ' + day + '일';
    case 'ru':
      return day + ' ' + formatTimePoint(TimePointFormat.MONTH_LONG, when, locale).toLowerCase();
    case 'zh':
      return formatTimePoint(TimePointFormat.MONTH_SHORT, when, locale) + day + '日';
  }
  return formatTimePoint(TimePointFormat.MONTH_SHORT, when, locale) + ' ' + day;
}
