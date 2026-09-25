import type { Point2D } from '../../klimt/UTranslate.js';
import { Side } from './Side.js';

/**
 * closest-side.ts — `RectangleArea#getClosestSide` (`klimt/geom/
 * RectangleArea.java:209-231`), the node-contact side lookup
 * `SvekEdge#getExtremitySimplier` (`SvekEdge.java:544-546`,
 * `:593-595`) feeds `ExtremityCrowfoot`'s wing clamp (`ExtremityCrowfoot
 * .ts`'s own doc comment — the one reachable-set extremity whose `drawU`
 * actually reads `side`).
 *
 * Ported verbatim except the rectangle shape: this port's node/entity
 * geometry is `{x, y, width, height}` (`ClassifierGeo`, `class-geo-
 * types.ts`), not Java's `minX/minY/maxX/maxY` fields — `minX = x`,
 * `minY = y`, `maxX = x + width`, `maxY = y + height` reproduces the
 * same four edges `RectangleArea`'s constructor stores directly.
 */
export interface ContactRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** `RectangleArea.java:229-231` — `isSmallerThan`. */
function isSmallerThan(value: number, a: number, b: number, c: number): boolean {
  return value <= a && value <= b && value <= c;
}

/**
 * The cardinal side of `rect` closest to `pt` — `undefined` only when no
 * candidate side satisfies `isSmallerThan` (`RectangleArea.java:226`
 * returns `null`; unreachable for a finite rect and finite point, kept for
 * fidelity with the Java branch structure rather than asserted away).
 *
 * @see ~/git/plantuml/.../klimt/geom/RectangleArea.java:209-227
 */
export function getClosestSide(rect: ContactRect, pt: Point2D): Side | undefined {
  const minX = rect.x;
  const minY = rect.y;
  const maxX = rect.x + rect.width;
  const maxY = rect.y + rect.height;
  const distNorth = Math.abs(minY - pt.y);
  const distSouth = Math.abs(maxY - pt.y);
  const distWest = Math.abs(minX - pt.x);
  const distEast = Math.abs(maxX - pt.x);
  if (isSmallerThan(distNorth, distWest, distEast, distSouth)) return Side.NORTH;
  if (isSmallerThan(distSouth, distNorth, distWest, distEast)) return Side.SOUTH;
  if (isSmallerThan(distEast, distNorth, distWest, distSouth)) return Side.EAST;
  if (isSmallerThan(distWest, distNorth, distEast, distSouth)) return Side.WEST;
  return undefined;
}
