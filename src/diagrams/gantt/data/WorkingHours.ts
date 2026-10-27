import { Duration } from '../../../core/time/Duration.js';
import { LocalTime } from '../../../core/time/LocalTime.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { URectangle } from '../../../core/klimt/shape/URectangle.js';
import type { TimeRanges } from '../core/TimeRanges.js';

/** A Java dereference of a null bound: `NullPointerException`. */
function nonNull(time: LocalTime | null): LocalTime {
  if (time === null) throw new Error('NullPointerException');
  return time;
}

/**
 * WorkingHours -- converts the working time ranges of a day into pixel widths.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java:47-114
 */
export class WorkingHours {
  readonly #workingTimeRanges: TimeRanges;
  readonly #dayWidth: number;
  readonly #closeFactor: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java:53-57 */
  public constructor(workingTimeRanges: TimeRanges, dayWidth: number, closeFactor: number) {
    this.#workingTimeRanges = workingTimeRanges;
    this.#dayWidth = dayWidth;
    this.#closeFactor = closeFactor;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java:59-62 */
  public toString(): string {
    return this.#workingTimeRanges.toString();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java:64-71 */
  public getWorkingDurationForOneDay(isClosed: boolean): number {
    if (isClosed) return this.#widthForClosedHours(Duration.ofHours(24));

    const working = this.#workingTimeRanges.totalWorkingDuration();
    const pause = Duration.ofHours(24).minus(working);
    return this.#widthForWorkingHours(working) + this.#widthForClosedHours(pause);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java:73-93 */
  public getPartialDayWidth(pos: LocalTime): number {
    let working = Duration.ZERO;
    let pause = Duration.ZERO;

    let t = LocalTime.MIDNIGHT;
    for (const range of this.#workingTimeRanges) {
      const start = nonNull(range.getStart());
      const end = nonNull(range.getEnd());
      if (pos.isBefore(start)) {
        pause = pause.plus(Duration.between(t, pos));
        return this.#widthForWorkingHours(working) + this.#widthForClosedHours(pause);
      } else if (pos.isBefore(end)) {
        pause = pause.plus(Duration.between(t, start));
        working = working.plus(Duration.between(start, pos));
        return this.#widthForWorkingHours(working) + this.#widthForClosedHours(pause);
      }
      pause = pause.plus(Duration.between(t, start));
      working = working.plus(range.getDuration());
      t = end;
    }
    pause = pause.plus(Duration.between(t, pos));
    return this.#widthForWorkingHours(working) + this.#widthForClosedHours(pause);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java:95-97 */
  #widthForWorkingHours(between: Duration): number {
    return (between.getSeconds() * this.#dayWidth) / (24.0 * 3600.0);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java:99-101 */
  #widthForClosedHours(between: Duration): number {
    return this.#closeFactor * this.#widthForWorkingHours(between);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/WorkingHours.java:103-113 */
  public drawOneDay(ug: UGraphic, height: number): void {
    let current = this.getPartialDayWidth(LocalTime.MIDNIGHT);
    for (const range of this.#workingTimeRanges) {
      const start = this.getPartialDayWidth(nonNull(range.getStart()));
      ug.apply(UTranslate.dx(current)).draw(URectangle.build(start - current, height));
      current = this.getPartialDayWidth(nonNull(range.getEnd()));
    }
    const last = this.getPartialDayWidth(LocalTime.MAX);
    ug.apply(UTranslate.dx(current)).draw(URectangle.build(last - current, height));
  }
}
