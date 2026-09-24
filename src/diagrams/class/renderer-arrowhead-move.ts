/**
 * renderer-arrowhead-move.ts — `DotPath#moveStartPoint`/`#moveEndPoint` on
 * the flat `EdgeGeo.points` list, split out of `renderer-arrowhead.ts`
 * (cdd2-T12, pre-authorised split, re-exported from there) so the three
 * class-side callers of the SAME upstream primitive share one port:
 *
 *  - `renderer-arrowhead.ts#applyDecorTrim` — `SvekEdge.java:558-561`'s
 *    `dotPath.moveStartPoint/moveEndPoint(translateForKal.compose(...))`;
 *  - `class-kal-overlap.ts#kalMoveX` — `Kal.java:210-216`'s
 *    `SvekEdge.moveStartPoint(dx, 0)` (`SvekEdge.java:1346-1349`);
 *  - `class-shield-helpers.ts#applyClusterMagneticBorders` —
 *    `SvekEdge.java:927-941`'s `todraw.moveStartPoint/moveEndPoint(
 *    magneticForce)`.
 *
 * A `1 + 3n` spline goes through the real `DotPath` port
 * (`core/klimt/shape/DotPath.ts#moveStartPointXY`, which already carries
 * `DotPath.java:206-216`'s first-bezier REMOVAL branch: a move at least as
 * long as the first bezier's chord, `XCubicCurve2D.java:52-56`, drops that
 * bezier and folds the remainder into the next one). Any other point count
 * (the straight 2-point secant `buildPathData` also accepts) keeps the
 * pre-existing plain shift of the end point and, when present, its
 * neighbour — there is no bezier to drop.
 */
import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { DotPath } from '../../core/klimt/shape/DotPath.js';
import { buildDotPathFromSplinePoints } from '../../core/svek/svek-edge-geometry.js';
import { kalTranslateForDecoration } from './class-kal.js';
import type { EdgeGeo } from './layout.js';

type Points = ReadonlyArray<{ x: number; y: number }>;

function isSpline(points: Points): boolean {
  return points.length >= 4 && (points.length - 1) % 3 === 0;
}

/** `DotPath#getBeziers` back to the flat `start, (cp1, cp2, end)*` list. */
function flatten(path: DotPath): Point2D[] {
  const beziers = path.getBeziers();
  const out: Point2D[] = [{ x: beziers[0]!.x1, y: beziers[0]!.y1 }];
  for (const b of beziers) {
    out.push({ x: b.ctrlx1, y: b.ctrly1 }, { x: b.ctrlx2, y: b.ctrly2 }, { x: b.x2, y: b.y2 });
  }
  return out;
}

function shiftPair(points: Points, at: number, near: number, dx: number, dy: number): Point2D[] {
  const out = points.map((p) => ({ x: p.x, y: p.y }));
  out[at] = { x: out[at]!.x + dx, y: out[at]!.y + dy };
  if (out.length >= 4) out[near] = { x: out[near]!.x + dx, y: out[near]!.y + dy };
  return out;
}

/**
 * `DotPath#moveStartPoint(dx, dy)` (`klimt/shape/DotPath.java:206-216`):
 * moves the start point AND the first control point, dropping the first
 * bezier first when `sqrt(dx²+dy²) >= its chord` and the path has more
 * than one. Returns a fresh array; `points` is never mutated.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/DotPath.java
 */
export function movePointsStart(points: Points, dx: number, dy: number): Point2D[] {
  if (!isSpline(points)) return shiftPair(points, 0, 1, dx, dy);
  const path = buildDotPathFromSplinePoints(points);
  path.moveStartPoint(dx, dy);
  return flatten(path);
}

/**
 * `DotPath#moveEndPoint(dx, dy)` (`klimt/shape/DotPath.java:229-234`):
 * moves the end point AND the last control point. Upstream has no removal
 * branch on this end. Returns a fresh array.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/DotPath.java
 */
export function movePointsEnd(points: Points, dx: number, dy: number): Point2D[] {
  const last = points.length - 1;
  return shiftPair(points, last, last - 1, dx, dy);
}

/** cdd2-T12: `Kal#getTranslateForDecoration` (`Kal.java:72-85`) for the
 *  box on one end of `edge`, `(0, 0)` when that end has none
 *  (`SvekEdge.java:549-550`). Built from the drawn box, so it is already in
 *  `edge.points`' (possibly scaled) coordinate space. */
export function kalEndTranslate(edge: EdgeGeo, end: 'start' | 'end'): Point2D {
  const box = edge.kalBox?.[end];
  if (box === undefined) return { x: 0, y: 0 };
  const t = kalTranslateForDecoration(box);
  return { x: t.dx, y: t.dy };
}

export function plus(p: Point2D, d: Point2D): Point2D {
  return { x: p.x + d.x, y: p.y + d.y };
}
