import type { TimePoint } from '../time/TimePoint.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScale.java:40 */
export interface TimeScale {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScale.java:42 */
  getPosition(instant: TimePoint): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScale.java:44 */
  getWidth(instant: TimePoint): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/TimeScale.java:46 */
  isBreaking(instant: TimePoint): boolean;
}
