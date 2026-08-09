/**
 * The six shape builders `UGraphicHandwritten` dispatches to, ported together
 * because each is a few lines over {@link HandJiggle} and they share one
 * `JavaRandom`.
 *
 * @see ~/git/plantuml/.../klimt/drawing/hand/URectangleHand.java
 * @see ~/git/plantuml/.../klimt/drawing/hand/ULineHand.java
 * @see ~/git/plantuml/.../klimt/drawing/hand/UEllipseHand.java
 * @see ~/git/plantuml/.../klimt/drawing/hand/UPolygonHand.java
 * @see ~/git/plantuml/.../klimt/drawing/hand/UPathHand.java
 * @see ~/git/plantuml/.../klimt/drawing/hand/UDotPathHand.java
 *
 * Every builder works in the shape's OWN frame, exactly as upstream does — a
 * rectangle is jiggled from `(0,0)` to `(width,height)` and a line from
 * `(0,0)` to `(dx,dy)`, because the `UGraphic` applies the translate. Callers
 * add the origin afterwards. That is not a detail: the random draws depend
 * only on a shape's SIZE, so a shape drawn at a different position consumes
 * the identical sequence.
 */

import { HandJiggle } from './HandJiggle.js';
import type { HandCubic, HandPoint } from './HandJiggle.js';
import type { JavaRandom } from './JavaRandom.js';

/** `URectangleHand` — a rounded rect becomes a jiggled POLYGON.
 *
 *  `rx`/`ry` are halved here, as upstream halves `URectangle#getRx()`, which
 *  holds the un-halved `RoundCorner`. Callers holding an already-halved SVG
 *  `rx` should pass it doubled, or pass the style value directly. */
export function rectangleHand(
  width: number,
  height: number,
  roundCorner: number,
  rnd: JavaRandom,
): readonly HandPoint[] {
  const rx = Math.min(roundCorner / 2, width / 2);
  const ry = Math.min(roundCorner / 2, height / 2);
  if (rx === 0 && ry === 0) {
    const j = new HandJiggle(0, 0, 1.5, rnd);
    j.lineTo(width, 0);
    j.lineTo(width, height);
    j.lineTo(0, height);
    j.lineTo(0, 0);
    return j.getPoints();
  }
  const j = new HandJiggle(rx, 0, 1.5, rnd);
  j.lineTo(width - rx, 0);
  j.arcTo(-Math.PI / 2, 0, width - rx, ry, rx, ry);
  j.lineTo(width, height - ry);
  j.arcTo(0, Math.PI / 2, width - rx, height - ry, rx, ry);
  j.lineTo(rx, height);
  j.arcTo(Math.PI / 2, Math.PI, rx, height - ry, rx, ry);
  j.lineTo(0, ry);
  j.arcTo(Math.PI, (3 * Math.PI) / 2, rx, ry, rx, ry);
  return j.getPoints();
}

/** `ULineHand` — a line becomes a jiggled polyline, variation 2.0. */
export function lineHand(dx: number, dy: number, rnd: JavaRandom): readonly HandPoint[] {
  const j = new HandJiggle(0, 0, 2.0, rnd);
  j.lineTo(dx, dy);
  return j.getPoints();
}

/** `UPolygonHand` — jiggle between the points, then close back to the first. */
export function polygonHand(pts: readonly HandPoint[], rnd: JavaRandom): readonly HandPoint[] {
  const first = pts[0];
  if (first === undefined) return [];
  const j = HandJiggle.create(first, 1.5, rnd);
  for (let i = 1; i < pts.length; i++) j.lineTo(pts[i]!.x, pts[i]!.y);
  j.lineTo(first.x, first.y);
  return j.getPoints();
}

/**
 * `UEllipseHand` — a POLYGON, not a jiggled outline.
 *
 * The circular case (`width === height`) walks a random angular step and
 * consumes TWO doubles per point; the elliptical case steps a fixed `PI/20`
 * and consumes ONE. Both loops are `while (angle < 2PI)` with the increment
 * applied FIRST, so the point count depends on the draws themselves.
 */
export function ellipseHand(width: number, height: number, rnd: JavaRandom): readonly HandPoint[] {
  const pts: HandPoint[] = [];
  let angle = 0;
  if (width === height) {
    while (angle < Math.PI * 2) {
      angle += ((10 + rnd.nextDouble() * 10) * Math.PI) / 180;
      const variation = 1 + (rnd.nextDouble() - 0.5) / 8;
      pts.push({
        x: width / 2 + Math.cos(angle) * width * variation / 2,
        y: height / 2 + Math.sin(angle) * height * variation / 2,
      });
    }
    return pts;
  }
  while (angle < Math.PI * 2) {
    angle += Math.PI / 20;
    const variation = (rnd.nextDouble() - 0.5) / 50;
    pts.push({
      x: width / 2 + Math.cos(angle) * width / 2 + variation * width,
      y: height / 2 + Math.sin(angle) * height / 2 + variation * height,
    });
  }
  return pts;
}

/** One segment of a path handed to {@link pathHand}. */
export type HandSegment =
  | { readonly kind: 'move'; readonly x: number; readonly y: number }
  | { readonly kind: 'line'; readonly x: number; readonly y: number }
  | { readonly kind: 'cubic'; readonly c: HandCubic };

/** One run of the resulting path: a move followed by lines. */
export interface HandRun {
  readonly move: HandPoint;
  readonly lines: readonly HandPoint[];
}

/**
 * `UPathHand` — each segment is jiggled from wherever the previous one ended.
 *
 * The two variations differ and both matter: a CUBIC uses 2.0, a LINE uses the
 * class's own `defaultVariation` of 4.0.
 *
 * A cubic's jiggle is appended whole (`appendTo`, which emits every point
 * including the run's own start); a line's contributes only its `lineTo`
 * points, upstream dropping the leading `moveTo` as it re-walks
 * `jiggle.toUPath()`.
 */
export function pathHand(segments: readonly HandSegment[], rnd: JavaRandom): readonly HandRun[] {
  const runs: HandRun[] = [];
  let current: { move: HandPoint; lines: HandPoint[] } | undefined;
  let last: HandPoint = { x: 0, y: 0 };

  for (const seg of segments) {
    if (seg.kind === 'move') {
      current = { move: { x: seg.x, y: seg.y }, lines: [] };
      runs.push(current);
      last = { x: seg.x, y: seg.y };
    } else if (seg.kind === 'cubic') {
      const j = HandJiggle.create(last, 2.0, rnd);
      j.curveTo(seg.c);
      // `appendTo` lineTo's EVERY collected point, the start included.
      current?.lines.push(...j.getPoints());
      last = { x: seg.c.x2, y: seg.c.y2 };
    } else {
      const j = new HandJiggle(last.x, last.y, 4.0, rnd);
      j.lineTo(seg.x, seg.y);
      // `toUPath()` makes the first point a moveTo; only the lineTo's are kept.
      current?.lines.push(...j.getPoints().slice(1));
      last = { x: seg.x, y: seg.y };
    }
  }
  return runs;
}
