import { PrintScale } from '../core/PrintScale.js';
import { MILLISECONDS_PER_DAY } from '../time/TimePoint.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from './TimeScale.js';

/** Days per week in `num % 7 == 6` (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleWink.java:67`). */
const DAYS_PER_WEEK = 7;
const WEEK_BREAK_REMAINDER = 6;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleWink.java:41 */
export class TimeScaleWink implements TimeScale {
  readonly #cellWidth: number;
  readonly #printScale: PrintScale;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleWink.java:46-49 */
  public constructor(size: number, scale: number, printScale: PrintScale) {
    this.#cellWidth = size * scale;
    this.#printScale = printScale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleWink.java:51-55 */
  public getPosition(instant: TimePoint): number {
    const wink = instant.getMillis();
    return (wink * this.#cellWidth) / MILLISECONDS_PER_DAY;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleWink.java:57-60 */
  public getWidth(_instant: TimePoint): number {
    return this.#cellWidth;
  }

  /**
   * `long` division truncates toward zero and `%` keeps the dividend's sign,
   * exactly as JS `Math.trunc` and `%` do.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScaleWink.java:62-70
   */
  public isBreaking(instant: TimePoint): boolean {
    if (this.#printScale === PrintScale.WEEKLY) {
      const num = Math.trunc(instant.getMillis() / MILLISECONDS_PER_DAY);
      return num % DAYS_PER_WEEK === WEEK_BREAK_REMAINDER;
    }
    return true;
  }
}
