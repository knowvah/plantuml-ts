import { UBrexLeaf } from '../../core/ubrex/builder/UBrexLeaf.js';
import { UBrexOr } from '../../core/ubrex/builder/UBrexOr.js';
import type { UBrexPart } from '../../core/ubrex/builder/UBrexPart.js';
import { ChronoUnit } from '../../core/time/ChronoUnit.js';
import { Duration } from '../../core/time/Duration.js';
import type { LocalDate } from '../../core/time/LocalDate.js';
import type { Locale } from '../../core/utils/I18nTimeData.js';
import type { Task } from './core/Task.js';
import { GanttI18n } from './GanttI18n.js';
import { TimePoint } from './time/TimePoint.js';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Carries the table-wide state that columns need to format their values.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:133-200
 */
export class Context {
  readonly #locale: Locale;
  readonly #relativeMode: boolean;
  readonly #minDay: LocalDate;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:139-143 */
  constructor(locale: Locale, relativeMode: boolean, minDay: LocalDate) {
    this.#locale = locale;
    this.#relativeMode = relativeMode;
    this.#minDay = minDay;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:145-147 */
  getLocale(): Locale {
    return this.#locale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:149-155 */
  formatDay(point: TimePoint): string {
    if (this.#relativeMode) return GanttI18n.dayNumber(this.#locale, this.#relativeDayNum(point));

    return point.toStringShort(this.#locale);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:157-182 */
  formatDayWithTime(point: TimePoint): string {
    const day = this.formatDay(point);

    const dateTime = point.toLocalDateTime();
    const hour = dateTime.getHour();
    const minute = dateTime.getMinute();
    const second = dateTime.getSecond();

    if (hour === 0 && minute === 0 && second === 0) return day;

    const time = second === 0 ? `${pad2(hour)}:${pad2(minute)}` : `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;

    return day + ' ' + time;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:184-193 */
  formatEnd(end: TimePoint): string {
    const dateTime = end.toLocalDateTime();
    const atMidnight = dateTime.getHour() === 0 && dateTime.getMinute() === 0 && dateTime.getSecond() === 0;

    if (atMidnight) return this.formatDay(end.minusOneSecond());

    return this.formatDayWithTime(end);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:195-198 */
  #relativeDayNum(point: TimePoint): number {
    const minAbs = TimePoint.ofStartOfDay(this.#minDay).getAbsoluteDayNum();
    return point.getAbsoluteDayNum() - minAbs + 1;
  }
}

type HeaderFn = (locale: Locale) => string;
type ValueFn = (task: Task, context: Context) => string;

/**
 * GanttTaskTableColumn -- one column of the textual task table; a Java enum
 * with constant-specific bodies, so singleton instances with Java ordinals.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:60-220
 */
export class GanttTaskTableColumn {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:62-72 */
  public static readonly TASK: GanttTaskTableColumn = new GanttTaskTableColumn(
    'TASK',
    0,
    (locale) => GanttI18n.task(locale),
    (task) => task.getCode().getDisplay(),
  );

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:74-84 */
  public static readonly START: GanttTaskTableColumn = new GanttTaskTableColumn(
    'START',
    1,
    (locale) => GanttI18n.start(locale),
    (task, context) => context.formatDayWithTime(task.getStart()),
  );

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:86-96 */
  public static readonly END: GanttTaskTableColumn = new GanttTaskTableColumn(
    'END',
    2,
    (locale) => GanttI18n.end(locale),
    (task, context) => context.formatEnd(task.getEnd()),
  );

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:98-109 */
  public static readonly DURATION: GanttTaskTableColumn = new GanttTaskTableColumn(
    'DURATION',
    3,
    (locale) => GanttI18n.duration(locale),
    (task, context) => {
      const start = task.getStart().toLocalDateTime();
      const end = task.getEnd().toLocalDateTime();

      const duration = Duration.between(start, end);

      return GanttI18n.durationHumanReadable(context.getLocale(), duration);
    },
  );

  static readonly #VALUES: readonly GanttTaskTableColumn[] = [
    GanttTaskTableColumn.TASK,
    GanttTaskTableColumn.START,
    GanttTaskTableColumn.END,
    GanttTaskTableColumn.DURATION,
  ];

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:116 (86400) */
  public static readonly SECONDS_IN_A_DAY: number = ChronoUnit.DAYS.getDuration().getSeconds();

  readonly #name: string;
  readonly #ordinal: number;
  readonly #header: HeaderFn;
  readonly #valueOf: ValueFn;

  private constructor(name: string, ordinal: number, header: HeaderFn, valueOf: ValueFn) {
    this.#name = name;
    this.#ordinal = ordinal;
    this.#header = header;
    this.#valueOf = valueOf;
  }

  /** `GanttTaskTableColumn.values()` -- a fresh array, in ordinal order. */
  public static values(): GanttTaskTableColumn[] {
    return [...GanttTaskTableColumn.#VALUES];
  }

  /** `Enum#valueOf(String)`; unknown names throw `IllegalArgumentException`. */
  public static valueOf(name: string): GanttTaskTableColumn {
    const found = GanttTaskTableColumn.#VALUES.find((v) => v.#name === name);
    if (found === undefined) {
      throw new Error(
        `IllegalArgumentException: No enum constant net.sourceforge.plantuml.gantt.GanttTaskTableColumn.${name}`,
      );
    }
    return found;
  }

  /** `Enum#name()`. */
  public name(): string {
    return this.#name;
  }

  /** `Enum#ordinal()`. */
  public ordinal(): number {
    return this.#ordinal;
  }

  /** Localized header label shown on the first row of the table. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:118-121 */
  public header(locale: Locale): string {
    return this.#header(locale);
  }

  /** Textual value of this column for the given task. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:123-126 */
  public valueOf(task: Task, context: Context): string {
    return this.#valueOf(task, context);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:202-208 (null on any failure) */
  public static of(what: string): GanttTaskTableColumn | undefined {
    try {
      return GanttTaskTableColumn.valueOf(what.toUpperCase());
    } catch {
      return undefined;
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTableColumn.java:210-217 */
  public static getUbrex(): UBrexPart {
    const definition: UBrexPart[] = [];
    for (const column of GanttTaskTableColumn.values()) {
      definition.push(new UBrexLeaf(column.toString()));
      definition.push(new UBrexLeaf(column.toString().toLowerCase()));
    }
    return new UBrexOr(definition);
  }

  public toString(): string {
    return this.#name;
  }
}
