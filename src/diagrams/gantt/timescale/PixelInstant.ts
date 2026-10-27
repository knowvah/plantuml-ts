import type { TimePoint } from '../time/TimePoint.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PixelInstant.java:40 */
export class PixelInstant {
  readonly #instant: TimePoint;
  readonly #position: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PixelInstant.java:45-48 */
  public constructor(instant: TimePoint, position: number) {
    this.#instant = instant;
    this.#position = position;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PixelInstant.java:50-52 */
  public getInstant(): TimePoint {
    return this.#instant;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/timescale/PixelInstant.java:54-56 */
  public getPosition(): number {
    return this.#position;
  }
}
