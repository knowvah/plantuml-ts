import type { LocalDate } from '../../../core/time/LocalDate.js';
import { PrintScale } from '../core/PrintScale.js';
import { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from './TimeScale.js';
import { TimeScaleWink } from './TimeScaleWink.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDaily.java:43 */
export class TimeScaleDaily implements TimeScale {
  readonly #basic: TimeScaleWink;
  readonly #delta: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDaily.java:49-56 (`zeroDay == null` -> `undefined`) */
  public constructor(size: number, startingDay: TimePoint, scale: number, zeroDay: LocalDate | undefined) {
    this.#basic = new TimeScaleWink(size, scale, PrintScale.DAILY);
    if (zeroDay === undefined) this.#delta = this.#basic.getPosition(startingDay);
    else this.#delta = this.#basic.getPosition(TimePoint.ofStartOfDay(zeroDay));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDaily.java:58-61 */
  public getPosition(instant: TimePoint): number {
    return this.#basic.getPosition(instant) - this.#delta;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDaily.java:63-66 */
  public getWidth(instant: TimePoint): number {
    return this.#basic.getWidth(instant);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleDaily.java:68-71 */
  public isBreaking(_instant: TimePoint): boolean {
    return true;
  }
}
