import { Direction } from '../../abel/Direction.js';
import { UPath } from '../../klimt/shape/UPath.js';
import { XPoint2D } from '../../klimt/geom/XPoint2D.js';

/**
 * The note box the `Opale` class measured: `getWidth`/`getHeight` of
 * `Opale.java:90-98`, its `roundCorner` field and `cornersize` (`:53`).
 * `cornersize` is passed in (it is `OPALE_CORNERSIZE` in `Opale.ts`, which
 * imports this module) so the two modules do not import each other.
 */
export interface OpaleBounds {
  readonly width: number;
  readonly height: number;
  readonly roundCorner: number;
  readonly cornersize: number;
}

/**
 * `Opale#delta` -- the half-depth of the notch.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:173
 */
const DELTA = 4;

/**
 * `MathUtils.limitation`: clamp, but answer `v` untouched when `min >= max`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/MathUtils.java:78-91
 */
function limitation(v: number, min: number, max: number): number {
  if (min >= max) return v;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/**
 * `Opale#getPolygonLeft` (the instance method; the geometry-string helper of
 * the same name lives in `Opale.ts`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:175-203
 */
export function getPolygonLeft(b: OpaleBounds, pp1: XPoint2D, pp2: XPoint2D): UPath {
  const { width, height, roundCorner, cornersize } = b;
  const polygon = UPath.none();
  polygon.moveTo(0, roundCorner / 2);

  let y1 = pp1.getY() - DELTA;
  y1 = limitation(y1, 0, height - 2 * DELTA);
  polygon.lineTo(0, y1);
  polygon.lineTo(pp2.getX(), pp2.getY());
  polygon.lineTo(0, y1 + 2 * DELTA);

  polygon.lineTo(0, height - roundCorner / 2);
  polygon.arcTo(new XPoint2D(roundCorner / 2, height), roundCorner / 2, 0, 0);
  polygon.lineTo(width - roundCorner / 2, height);
  polygon.arcTo(new XPoint2D(width, height - roundCorner / 2), roundCorner / 2, 0, 0);
  polygon.lineTo(width, cornersize);
  polygon.lineTo(width - cornersize, 0);
  polygon.lineTo(roundCorner / 2, 0);
  polygon.arcTo(new XPoint2D(0, roundCorner / 2), roundCorner / 2, 0, 0);
  polygon.closePath();
  return polygon;
}

/**
 * `Opale#getPolygonRight`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:205-229
 */
export function getPolygonRight(b: OpaleBounds, pp1: XPoint2D, pp2: XPoint2D): UPath {
  const { width, height, roundCorner, cornersize } = b;
  const polygon = UPath.none();
  polygon.moveTo(0, roundCorner / 2);
  polygon.lineTo(0, height - roundCorner / 2);
  polygon.arcTo(new XPoint2D(roundCorner / 2, height), roundCorner / 2, 0, 0);
  polygon.lineTo(width - roundCorner / 2, height);
  polygon.arcTo(new XPoint2D(width, height - roundCorner / 2), roundCorner / 2, 0, 0);

  let y1 = pp1.getY() - DELTA;
  y1 = limitation(y1, cornersize, height - 2 * DELTA);
  polygon.lineTo(width, y1 + 2 * DELTA);
  polygon.lineTo(pp2.getX(), pp2.getY());
  polygon.lineTo(width, y1);

  polygon.lineTo(width, cornersize);
  polygon.lineTo(width - cornersize, 0);
  polygon.lineTo(roundCorner / 2, 0);
  polygon.arcTo(new XPoint2D(0, roundCorner / 2), roundCorner / 2, 0, 0);
  polygon.closePath();
  return polygon;
}

/**
 * `Opale#getPolygonUp`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:231-248
 */
export function getPolygonUp(b: OpaleBounds, pp1: XPoint2D, pp2: XPoint2D): UPath {
  const { width, height, roundCorner, cornersize } = b;
  const polygon = UPath.none();
  polygon.moveTo(0, roundCorner / 2);
  polygon.lineTo(0, height - roundCorner / 2);
  polygon.arcTo(new XPoint2D(roundCorner / 2, height), roundCorner / 2, 0, 0);
  polygon.lineTo(width - roundCorner / 2, height);
  polygon.arcTo(new XPoint2D(width, height - roundCorner / 2), roundCorner / 2, 0, 0);
  polygon.lineTo(width, cornersize);
  polygon.lineTo(width - cornersize, 0);

  let x1 = pp1.getX() - DELTA;
  x1 = limitation(x1, 0, width - cornersize);
  polygon.lineTo(x1 + 2 * DELTA, 0);
  polygon.lineTo(pp2.getX(), pp2.getY());

  polygon.lineTo(x1, 0);
  polygon.lineTo(roundCorner / 2, 0);
  polygon.arcTo(new XPoint2D(0, roundCorner / 2), roundCorner / 2, 0, 0);
  polygon.closePath();
  return polygon;
}

/**
 * `Opale#getPolygonDown`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:250-269
 */
export function getPolygonDown(b: OpaleBounds, pp1: XPoint2D, pp2: XPoint2D): UPath {
  const { width, height, roundCorner, cornersize } = b;
  const polygon = UPath.none();
  polygon.moveTo(0, roundCorner / 2);
  polygon.lineTo(0, height - roundCorner / 2);
  polygon.arcTo(new XPoint2D(roundCorner / 2, height), roundCorner / 2, 0, 0);

  let x1 = pp1.getX() - DELTA;
  x1 = limitation(x1, 0, width);
  polygon.lineTo(x1, height);
  polygon.lineTo(pp2.getX(), pp2.getY());
  polygon.lineTo(x1 + 2 * DELTA, height);

  polygon.lineTo(width - roundCorner / 2, height);
  polygon.arcTo(new XPoint2D(width, height - roundCorner / 2), roundCorner / 2, 0, 0);
  polygon.lineTo(width, cornersize);
  polygon.lineTo(width - cornersize, 0);
  polygon.lineTo(roundCorner / 2, 0);
  polygon.arcTo(new XPoint2D(0, roundCorner / 2), roundCorner / 2, 0, 0);
  polygon.closePath();
  return polygon;
}

/**
 * `Opale.getCorner` (the folded-corner triangle), `cornersize` passed in.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:147-161
 */
export function corner(width: number, roundCorner: number, cornersize: number): UPath {
  const path = UPath.none();
  path.moveTo(width - cornersize, 0);
  if (roundCorner === 0) {
    path.lineTo(width - cornersize, cornersize);
  } else {
    path.lineTo(width - cornersize, cornersize - roundCorner / 4);
    path.arcTo(new XPoint2D(width - cornersize + roundCorner / 4, cornersize), roundCorner / 4, 0, 0);
  }
  path.lineTo(width, cornersize);
  path.lineTo(width - cornersize, 0);
  path.closePath();
  return path;
}

/**
 * `Opale.getPolygonNormal(width, height, roundCorner)` (the unnotched outline), `cornersize` passed in.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:163-188
 */
export function polygonNormal(width: number, height: number, roundCorner: number, cornersize: number): UPath {
  const polygon = UPath.none();
  if (roundCorner === 0) {
    polygon.moveTo(0, 0);
    polygon.lineTo(0, height);
    polygon.lineTo(width, height);
    polygon.lineTo(width, cornersize);
    polygon.lineTo(width - cornersize, 0);
    polygon.lineTo(0, 0);
  } else {
    polygon.moveTo(0, roundCorner / 2);
    polygon.lineTo(0, height - roundCorner / 2);
    polygon.arcTo(new XPoint2D(roundCorner / 2, height), roundCorner / 2, 0, 0);
    polygon.lineTo(width - roundCorner / 2, height);
    polygon.arcTo(new XPoint2D(width, height - roundCorner / 2), roundCorner / 2, 0, 0);
    polygon.lineTo(width, cornersize);
    polygon.lineTo(width - cornersize, 0);
    polygon.lineTo(roundCorner / 2, 0);
    polygon.arcTo(new XPoint2D(0, roundCorner / 2), roundCorner / 2, 0, 0);
  }
  polygon.closePath();
  return polygon;
}

/**
 * The `withLink` branch of `Opale#drawU`: pick the notched outline by `strategy`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/Opale.java:113-122
 */
export function getPolygonLinked(strategy: Direction | undefined, b: OpaleBounds, pp1: XPoint2D, pp2: XPoint2D): UPath {
  if (strategy === Direction.LEFT) return getPolygonLeft(b, pp1, pp2);
  if (strategy === Direction.RIGHT) return getPolygonRight(b, pp1, pp2);
  if (strategy === Direction.UP) return getPolygonUp(b, pp1, pp2);
  if (strategy === Direction.DOWN) return getPolygonDown(b, pp1, pp2);
  throw new Error('IllegalArgumentException');
}
