/**
 * cdd-T6 (A2a/M9): `constraint on links: text`.
 *
 * Split out of `class-edge-geo.ts` (500-line cap, pre-authorised).
 *
 * `SvekEdge.java:994-1012` builds a 10x10 "square" of 8 candidate points at
 * the link's own constraint-spot corner, samples the edge's bezier, keeps
 * the SQUARE point nearest any sampled point, and hands it to
 * `LinkConstraint#setPosition(link, minPt)`.
 * `LinkConstraint#drawMe` (`cucadiagram/LinkConstraint.java:82-103`) then
 * draws `ULine(x2 - x1, y2 - y1)` at `UTranslate(x1, y1)` under
 * `UStroke(3, 3, 1)` — the golden's `stroke-dasharray:3,3` — and centres
 * the constraint text on that line's midpoint.
 */
import type { Point2D } from '../../core/klimt/UTranslate.js';

/** `SvekEdge.java:1080-1091` — the 8 points of the 10x10 square whose
 *  top-left corner is the link's constraint spot (the 4 corners plus the 4
 *  edge midpoints; the centre is deliberately absent upstream). */
export function constraintSquare(x: number, y: number): Point2D[] {
  return [
    { x, y },
    { x: x + 5, y },
    { x: x + 10, y },
    { x, y: y + 5 },
    { x: x + 10, y: y + 5 },
    { x, y: y + 10 },
    { x: x + 5, y: y + 10 },
    { x: x + 10, y: y + 10 },
  ];
}

/** `XCubicCurve2D#getFlatnessSq` via `XLine2D#ptSegDistSq` — the larger of
 *  the two control points' squared distances to the chord. */
function flatnessSq(b: readonly Point2D[]): number {
  const [p0, c1, c2, p3] = b as [Point2D, Point2D, Point2D, Point2D];
  return Math.max(ptSegDistSq(p0, p3, c1), ptSegDistSq(p0, p3, c2));
}

function ptSegDistSq(a: Point2D, b: Point2D, p: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return (p.x - (a.x + t * dx)) ** 2 + (p.y - (a.y + t * dy)) ** 2;
}

function mid(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** de Casteljau at `t = 0.5` — `XCubicCurve2D#subdivide`. */
function subdivide(b: readonly Point2D[]): [Point2D[], Point2D[]] {
  const [p0, c1, c2, p3] = b as [Point2D, Point2D, Point2D, Point2D];
  const a = mid(p0, c1);
  const bb = mid(c1, c2);
  const c = mid(c2, p3);
  const d = mid(a, bb);
  const e = mid(bb, c);
  const f = mid(d, e);
  return [
    [p0, a, d, f],
    [f, e, c, p3],
  ];
}

/** `DotPath#sample(XCubicCurve2D, Set)` (`klimt/shape/DotPath.java:139-152`)
 *  — recursive halving until the segment is flat AND its control points are
 *  within 4 units of each other, then both control points join the set.
 *  Ported here over the class engine's raw point arrays rather than added to
 *  `core/klimt/shape/DotPath.ts`, because no class-engine edge ever builds a
 *  `DotPath` object: `EdgeGeo.points` is the spline. */
function sampleBezier(b: readonly Point2D[], out: Point2D[]): void {
  const [, c1, c2] = b as [Point2D, Point2D, Point2D, Point2D];
  if (flatnessSq(b) > 0.5 || Math.hypot(c1.x - c2.x, c1.y - c2.y) > 4) {
    const [left, right] = subdivide(b);
    sampleBezier(left, out);
    sampleBezier(right, out);
    return;
  }
  out.push(c1, c2);
}

/** `DotPath#sample()` (`:131-137`) over the flat `[p0, c1, c2, p1, c1, c2,
 *  p2, …]` control-point list this port carries per edge. A degenerate
 *  2-point (straight-line) list has no cubic segment at all and samples to
 *  its own two endpoints. */
export function sampleEdgePath(points: readonly Point2D[]): Point2D[] {
  const out: Point2D[] = [];
  for (let i = 0; i + 3 < points.length; i += 3) {
    sampleBezier(points.slice(i, i + 4), out);
  }
  return out.length === 0 ? [...points] : out;
}

/**
 * `SvekEdge.java:998-1010` — the square point nearest any sampled bezier
 * point. Upstream's own loop keeps `pt` (the SQUARE point), not `pt2`, and
 * its `minPt == null ||` guard means the FIRST square point always wins the
 * first comparison; both details are preserved verbatim.
 */
export function constraintAnchor(points: readonly Point2D[], spot: Point2D): Point2D | undefined {
  const bez = sampleEdgePath(points);
  if (bez.length === 0) return undefined;
  let minPt: Point2D | undefined;
  let minDist = Number.MAX_VALUE;
  for (const pt of constraintSquare(spot.x, spot.y)) {
    for (const pt2 of bez) {
      const distance = Math.hypot(pt2.x - pt.x, pt2.y - pt.y);
      if (minPt === undefined || distance < minDist) {
        minPt = pt;
        minDist = distance;
      }
    }
  }
  return minPt;
}
