import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { WorkingHours } from '../data/WorkingHours.js';
import type { OpenClose } from '../OpenClose.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from './TimeScale.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/VariantTimeScale.java:45 */
export class VariantTimeScale implements TimeScale {
  readonly #min: LocalDate;
  readonly #max: LocalDate;
  readonly #workingHours: WorkingHours;
  readonly #openClose: OpenClose;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/VariantTimeScale.java:52-57 */
  public constructor(min: LocalDate, max: LocalDate, workingHours: WorkingHours, openClose: OpenClose) {
    this.#min = min;
    this.#max = max;
    this.#workingHours = workingHours;
    this.#openClose = openClose;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/VariantTimeScale.java:59-68 */
  public getPosition(instant: TimePoint): number {
    const timeOnly = instant.toLocalDateTime();
    const dateOnly = instant.toDay();
    let tmp = 0;
    for (let dd = this.#min; dd.isBefore(dateOnly); dd = dd.plusDays(1))
      tmp += this.#workingHours.getWorkingDurationForOneDay(this.#openClose.isClosed(dd));

    return tmp + this.#workingHours.getPartialDayWidth(timeOnly.toLocalTime());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/VariantTimeScale.java:70-74 */
  public getWidth(instant: TimePoint): number {
    const isClosed = this.#openClose.isClosed(instant.toDay());
    return this.#workingHours.getWorkingDurationForOneDay(isClosed);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/VariantTimeScale.java:76-79 */
  public isBreaking(_instant: TimePoint): boolean {
    return false;
  }
}
