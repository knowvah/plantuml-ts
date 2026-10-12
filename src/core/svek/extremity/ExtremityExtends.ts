import type { UGraphic } from '../../klimt/UGraphic.js';
import type { Point2D } from '../../klimt/UTranslate.js';
import type { Paint } from '../../paint.js';
import { Back } from '../../klimt/Back.js';
import { UPolygon } from '../../klimt/shape/UPolygon.js';
import { Extremity } from './Extremity.js';
import { rotatePoint } from './rotate-point.js';

/** `final double xWing = 19;// 8 * 2.4;`: `ExtremityExtends.java:59`. */
const X_WING = 19;
/** `final double yAperture = 7;// 3 * 2.4;`: `ExtremityExtends.java:60`. */
const Y_APERTURE = 7;

/**
 * `UPolygon#rotate(theta)` (`UPolygon.java:113-117`): no-op at exactly 0,
 * else every point through `XAffineTransform.getRotateInstance(theta)`
 * (`rotate-point.ts`). This port's `UPolygon` has no `rotate` (it needs the
 * unported `XAffineTransform`), so the points are rotated before the polygon
 * is built, as every other extremity here does.
 */
function rotate(points: readonly Point2D[], theta: number): readonly Point2D[] {
  if (theta === 0) return points;
  return points.map((pt) => rotatePoint(pt, theta));
}

/**
 * ExtremityExtends — the legacy hollow EXTENDS triangle the ELK path draws
 * (`MyElkEdge.java:231-232`, via {@link ExtremityFactoryExtends}): 19 deep,
 * 14 wide, filled with the factory's background colour. Not the svek path's
 * EXTENDS head, which is `ExtremityTriangle` 18/6/18
 * (`LinkDecor#getExtremityFactoryComplete`).
 *
 * Ported: the constructor, `drawU`, `getDecorationLength`. Not ported:
 * `somePoint()` / the `contact` field it returns (`:47-52`, `:56`), cut from
 * `Extremity.ts` for every extremity (no caller under `LinkStrategy.SIMPLEST`).
 * Upstream is package-private; exported here for `ExtremityFactoryExtends.ts`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/extremity/ExtremityExtends.java
 */
export class ExtremityExtends extends Extremity {
  private readonly polygon: UPolygon;
  private readonly fill: Paint;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/extremity/ExtremityExtends.java:54-66 */
  constructor(p1: Point2D, angleIn: number, backgroundColor: Paint) {
    super();
    this.fill = backgroundColor;
    const angle = this.manageround(angleIn);
    const local: Point2D[] = [
      { x: 0, y: 0 },
      { x: -X_WING, y: -Y_APERTURE },
      { x: -X_WING, y: Y_APERTURE },
      { x: 0, y: 0 },
    ];
    const rotated = rotate(local, angle + Math.PI / 2);
    this.polygon = new UPolygon(rotated).translate(p1.x, p1.y);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/extremity/ExtremityExtends.java:68-71 */
  drawU(ug: UGraphic): void {
    ug.apply(new Back(this.fill)).draw(this.polygon);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/extremity/ExtremityExtends.java:73-76 */
  override getDecorationLength(): number {
    return 18;
  }
}
