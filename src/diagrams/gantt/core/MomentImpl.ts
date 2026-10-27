import type { TimePoint } from '../time/TimePoint.js';
import { getEndMinusOneDayTOBEREMOVED } from './Moment.js';
import type { Moment } from './Moment.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/MomentImpl.java:40 */
export class MomentImpl implements Moment {
  readonly #start: TimePoint;
  readonly #end: TimePoint;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/MomentImpl.java:45-48 */
  public constructor(start: TimePoint, end: TimePoint) {
    this.#start = start;
    this.#end = end;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/MomentImpl.java:50-52 */
  public getStart(): TimePoint {
    return this.#start;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/MomentImpl.java:54-57 */
  public getEnd(): TimePoint {
    return this.#end;
  }

  /** Inherited interface default (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Moment.java:46-48`). */
  public getEndMinusOneDayTOBEREMOVED(): TimePoint {
    return getEndMinusOneDayTOBEREMOVED(this);
  }
}
