import type { TimePoint } from '../time/TimePoint.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Moment.java:40 */
export interface Moment {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Moment.java:42 */
  getStart(): TimePoint;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Moment.java:44 */
  getEnd(): TimePoint;

  /**
   * The interface `default` method (`gantt/core/Moment.java:46-48`). TS interfaces have no
   * defaults: implementers return {@link getEndMinusOneDayTOBEREMOVED}`(this)`.
   */
  getEndMinusOneDayTOBEREMOVED(): TimePoint;
}

/**
 * The body of the interface `default` method `getEndMinusOneDayTOBEREMOVED`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/Moment.java:46-48`): `getEnd().decrement()`.
 */
export function getEndMinusOneDayTOBEREMOVED(moment: Moment): TimePoint {
  return moment.getEnd().decrement();
}
