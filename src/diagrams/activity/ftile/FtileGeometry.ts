import { XDimension2D } from '../../../core/klimt/geom/XDimension2D.js';

/**
 * Java's `Double.MIN_NORMAL`: `FtileGeometry`'s "no point out" sentinel for
 * `outY` (FtileGeometry.java:88-90 passes it; `hasPointOut` tests it).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:89
 */
const DOUBLE_MIN_NORMAL = 2.2250738585072014e-308;

/**
 * FtileGeometry — an `XDimension2D` plus the tile's entry column (`left`)
 * and entry/exit heights (`inY`, `outY`).
 *
 * Ported slice (what `FtileBoxOld#calculateDimensionFtile` reaches): the
 * 4- and 5-number constructors, `getLeft`, `getInY`, `getOutY`,
 * `toString`. The point accessors and the `inc*`/`add*`/`translate`
 * builders serve the activity ftile graph, which this port does not build
 * (the activity engine's `tiles/` tree is a separate structure); they land
 * with the first consumer.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:42-201
 */
export class FtileGeometry extends XDimension2D {
  /** @see FtileGeometry.java:44 */
  private readonly left: number;
  /** @see FtileGeometry.java:45 */
  private readonly inY: number;
  /** @see FtileGeometry.java:46 */
  private readonly outY: number;

  /** The 4-number overload defaults `outY` to the sentinel. @see FtileGeometry.java:88-90,97-102 */
  constructor(width: number, height: number, left: number, inY: number, outY: number = DOUBLE_MIN_NORMAL) {
    super(width, height);
    this.left = left;
    this.inY = inY;
    this.outY = outY;
  }

  /** Diagnostic only; `String(n)` prints `34` where Java prints `34.0`. @see FtileGeometry.java:92-95 */
  toString(): string {
    return `[${String(this.getWidth())}x${String(this.getHeight())} left=${String(this.left)}]`;
  }

  /** @see FtileGeometry.java:158-160 */
  getInY(): number {
    return this.inY;
  }

  /** @see FtileGeometry.java:162-164 */
  getLeft(): number {
    return this.left;
  }

  /** @see FtileGeometry.java:170-172 */
  getOutY(): number {
    return this.outY;
  }
}
