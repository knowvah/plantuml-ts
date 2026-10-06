/**
 * Pure port of `Snake#getTextBlockPosition`
 * (`activitydiagram3/ftile/Snake.java:244-270`): where an edge label's
 * TOP-LEFT corner is drawn, given the edge's own points and the label's
 * measured dimension.
 *
 * Upstream reads `worm.getPoint(i)`
 * (`activitydiagram3/ftile/Worm.java:322-324`), which resolves every
 * point through the compressing `UGraphic`'s translate (`:326-329`,
 * `resolve`/`tr`) -- i.e. this runs on the SAME (already-compressed)
 * point set `drawInternalOneColor` draws, AT ACTUAL DRAW TIME
 * (`Snake#drawInternalLabel`, `Snake.java:226-232`, called from
 * `drawInternal` right after the line segments). This port mirrors that
 * by taking `points` as `ActivityEdgeGeo.points` -- already final,
 * post-compression, by the time `renderer.ts` calls this -- so NO
 * separate pre-compression anchor carry (unlike `emphasizeAt`,
 * `compress-geometry.ts#withEmphasizeAnchor`'s own doc) is needed: see
 * that file's own note for the verification this resolves (D1,
 * `plans/activity-divergence-drive-3/decisions.md`).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Snake.java:244-270
 */

import { arrowDirection } from '../arrows-regular.js';

/**
 * One label's alignment, mirroring `Snake#withLabel`'s two overloads
 * (`Snake.java:124-136`): a `Text` is built with EITHER a
 * `VerticalAlignment` (the `(TextBlock, VerticalAlignment)` overload,
 * `horizontalAlignment` left `null`) OR a `HorizontalAlignment` (the
 * other overload, `verticalAlignment` left `null`) -- never both.
 * Callers set exactly one of the two fields below; the pure function
 * checks `vertical` first, matching the Java `if`/`else if` order
 * (`getTextBlockPosition`'s own body checks `verticalAlignment` before
 * ever reading `horizontalAlignment`).
 */
export interface SnakeTextAlign {
  readonly vertical?: 'BOTTOM' | 'CENTER';
  readonly horizontal?: 'LEFT' | 'CENTER' | 'RIGHT';
}

type Point = { readonly x: number; readonly y: number };

const DIRECTION_LETTER: Record<'up' | 'down' | 'left' | 'right', string> = {
  up: 'U',
  down: 'D',
  left: 'L',
  right: 'R',
};

/**
 * The alignment of a label whose push site carries none: the jar's
 * `arrowHorizontalAlignment()` (`ftile/AbstractFtile.java:108-110`), i.e.
 * `AlignmentParam.arrowMessageAlignment`, default LEFT
 * (`skin/AlignmentParam.java:42`).
 */
export const DEFAULT_LABEL_ALIGN: SnakeTextAlign = { horizontal: 'LEFT' };

/**
 * `Worm#getDirectionsCode` (`Worm.java:285-292`): one letter per segment
 * (`R`/`L`/`D`/`U`), reusing {@link arrowDirection}'s own total port of
 * `Direction.fromVector` (`arrows-regular.ts`'s own citation) rather than
 * re-deriving the same four-way axis check.
 */
export function directionsCode(points: readonly Point[]): string {
  let code = '';
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    code += DIRECTION_LETTER[arrowDirection(p2.x - p1.x, p2.y - p1.y)];
  }
  return code;
}

/** `Worm#getMinX`/`getMaxX`/`getMaxY` (`Worm.java:340-359`): loop over
 *  EVERY point of the worm, not just its endpoints. */
function wormExtent(points: readonly Point[]): { minX: number; maxX: number; maxY: number } {
  let minX = points[0]!.x;
  let maxX = points[0]!.x;
  let maxY = points[0]!.y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, maxY };
}

/** The `VerticalAlignment.BOTTOM`/`CENTER` branches
 *  (`Snake.java:251-256`) -- checked FIRST, same as upstream's `if`/
 *  `else if` order; split out so {@link getTextBlockPosition} stays
 *  under this file's NLOC limit. */
function verticalAlignedPosition(
  points: readonly Point[],
  dim: { readonly height: number },
  vertical: 'BOTTOM' | 'CENTER',
): Point {
  const extent = wormExtent(points);
  if (vertical === 'BOTTOM') return { x: extent.minX, y: extent.maxY };
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return { x: extent.minX, y: (first.y + last.y - 10) / 2 - dim.height / 2 };
}

/** The zigzag `CENTER`/`RIGHT` and `RD`/`LD` direction-code branches
 *  (`Snake.java:257-267`) -- reached only when `verticalAlignment` is
 *  unset (upstream's own `else if` chain); `defaultPos` is the
 *  straight-line estimate (`:248,250`) every one of these branches may
 *  fall through to unchanged. */
function horizontalAlignedPosition(
  points: readonly Point[],
  dim: { readonly width: number; readonly height: number },
  defaultPos: Point,
  horizontal: 'LEFT' | 'CENTER' | 'RIGHT' | undefined,
): Point {
  const pt1 = points[0]!;
  const pt2 = points[1]!;
  const code = directionsCode(points);
  const zigzag = code.startsWith('DLD') || code.startsWith('DRD');

  if (horizontal === 'CENTER' && zigzag) {
    const pt3 = points[2]!;
    return { x: (pt2.x + pt3.x) / 2 - dim.width / 2, y: defaultPos.y };
  }
  if (horizontal === 'RIGHT' && zigzag) {
    return { x: Math.max(pt1.x, pt2.x) - dim.width - 4, y: defaultPos.y };
  }
  if (code === 'RD') {
    return { x: Math.max(pt1.x, pt2.x), y: (pt1.y + points[2]!.y) / 2 - dim.height / 2 };
  }
  if (code === 'LD') {
    return { x: Math.min(pt1.x, pt2.x), y: (pt1.y + points[2]!.y) / 2 - dim.height / 2 };
  }
  return defaultPos;
}

/**
 * `Snake#getTextBlockPosition` (`Snake.java:244-270`), verbatim branch
 * order: default (straight-line estimate) -> `BOTTOM` -> `CENTER`
 * (vertical) -> zigzag `CENTER` -> zigzag `RIGHT` -> `RD` -> `LD`.
 *
 * `points` must have at least 2 entries (`renderEdge`'s own `pts.length
 * < 2` guard, `renderer.ts`); the zigzag/`RD`/`LD` branches only read
 * `points[2]` when `code` is already long/short enough to prove it
 * exists (a `DLD`/`DRD`-prefixed code needs >= 4 points; an exact `RD`/
 * `LD` code needs exactly 3).
 */
export function getTextBlockPosition(
  points: readonly Point[],
  dim: { readonly width: number; readonly height: number },
  align: SnakeTextAlign | undefined,
): Point {
  const pt1 = points[0]!;
  const pt2 = points[1]!;
  const defaultPos = { x: Math.max(pt1.x, pt2.x) + 4, y: (pt1.y + pt2.y) / 2 - dim.height / 2 };

  if (align?.vertical !== undefined) return verticalAlignedPosition(points, dim, align.vertical);
  return horizontalAlignedPosition(points, dim, defaultPos, align?.horizontal);
}

/**
 * `Snake#getMaxX` (`Snake.java:234-242`): the edge's own `worm.getMaxX()`
 * widened to also cover the label's own right edge
 * (`position.getX() + dim.getWidth()`) when it hangs past the line.
 * Upstream loops `texts` (plural); our port carries at most one label
 * per edge (`ActivityEdgeGeo.label`), so this takes one `dim` rather
 * than a list.
 */
export function snakeMaxX(
  points: readonly Point[],
  dim: { readonly width: number; readonly height: number },
  align: SnakeTextAlign | undefined,
): number {
  const wormMaxX = wormExtent(points).maxX;
  const position = getTextBlockPosition(points, dim, align);
  return Math.max(wormMaxX, position.x + dim.width);
}
