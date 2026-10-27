import type { TimePoint } from '../time/TimePoint.js';
import type { PixelInstant } from './PixelInstant.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PiecewiseTimeProjection.java:40 */
export class PiecewiseTimeProjection {
  readonly #start: PixelInstant;
  readonly #end: PixelInstant;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PiecewiseTimeProjection.java:45-48 */
  public constructor(start: PixelInstant, end: PixelInstant) {
    this.#start = start;
    this.#end = end;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PiecewiseTimeProjection.java:50-52 */
  public getStart(): PixelInstant {
    return this.#start;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PiecewiseTimeProjection.java:54-56 */
  public getEnd(): PixelInstant {
    return this.#end;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PiecewiseTimeProjection.java:58-63 (inclusive both ends) */
  public contains(instant: TimePoint): boolean {
    const startInstant = this.#start.getInstant();
    const endInstant = this.#end.getInstant();
    return instant.compareTo(startInstant) >= 0 && instant.compareTo(endInstant) <= 0;
  }
}
