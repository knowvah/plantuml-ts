import { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from './TimeScale.js';
import { TimeScaleDaily } from './TimeScaleDaily.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleCompressed.java:43 */
export class TimeScaleCompressed implements TimeScale {
  readonly #daily: TimeScale;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleCompressed.java:47-49 (`zeroDay == null` -> `undefined`) */
  public constructor(size: number, calendar: TimePoint, scale: number, zeroDay: LocalDate | undefined) {
    this.#daily = new TimeScaleDaily(size, calendar, scale, zeroDay);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleCompressed.java:51-54 */
  public getPosition(instant: TimePoint): number {
    return this.#daily.getPosition(instant);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleCompressed.java:56-59 */
  public getWidth(instant: TimePoint): number {
    return this.#daily.getWidth(instant);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleCompressed.java:61-64 */
  public isBreaking(instant: TimePoint): boolean {
    return instant.toDayOfWeek() === DayOfWeek.SUNDAY;
  }
}
