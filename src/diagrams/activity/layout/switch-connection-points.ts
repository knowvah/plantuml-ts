/**
 * Pure same-lane point-array math for the switch connectors, split out of
 * `walk-switch.ts` purely to keep that file under the complexity hook's
 * NLOC/CCN cap -- a direct port of `FtileSwitchWithManyLinks`'s/
 * `FtileSwitchWithOneLink`'s `Connection*` inner classes' `drawU` methods
 * (`vcompact/cond/FtileSwitchWithManyLinks.java`,
 * `vcompact/cond/FtileSwitchWithOneLink.java`). Cross-swimlane routing is
 * NOT here -- that's the pre-existing `loop`-tagged translate path
 * (`swimlane-loop-translate.ts`'s `'switch-h-then-v-cross'`/
 * `'switch-v-then-h-cross'`), untouched by this task.
 */

import type { GPoint } from '../tiles/points.js';

/** `FtileSwitchWithManyLinks.margin` (`:64`) -- the threshold both
 *  `ConnectionVerticalTop` and `ConnectionVerticalBottom` use to decide
 *  whether a middle case sits "under" diamond1's own span. */
const MARGIN = 10;

export interface HexagonCorners {
  readonly west: GPoint;
  readonly east: GPoint;
  readonly south: GPoint;
}

/**
 * `ConnectionHorizontalThenVertical#drawU` (`FtileSwitchWithManyLinks
 * .java:81-107`): the first/last case's diamond1-in edge, from the
 * hexagon's own WEST (first) or EAST (last) corner. The `isLast() &&
 * p1.x > p2.x` detour only applies to the LAST case.
 */
export function horizontalThenVerticalPoints(
  p1: GPoint,
  p2: GPoint,
  isLast: boolean,
  diamond1Height: number,
): GPoint[] {
  if (isLast && p1.x > p2.x) {
    return [
      p1,
      { x: p1.x + 12, y: p1.y },
      { x: p1.x + 12, y: p1.y + diamond1Height },
      { x: p2.x, y: p1.y + diamond1Height },
      p2,
    ];
  }
  return [p1, { x: p2.x, y: p1.y }, p2];
}

/**
 * `ConnectionVerticalTop#drawU` (`FtileSwitchWithManyLinks.java:206-234`):
 * a middle case's diamond1-in edge. Outside `[p1d.x - margin, p1b.x +
 * margin]`: a bare 2-point line starting in open space at the hexagon's
 * own mid-height, NEVER touching diamond1's own corner -- an upstream
 * quirk this preserves rather than "fixes" (CLAUDE.md).
 */
export function verticalTopPoints(hex1: HexagonCorners, p2: GPoint): GPoint[] {
  if (p2.x < hex1.west.x - MARGIN || p2.x > hex1.east.x + MARGIN) {
    return [{ x: p2.x, y: hex1.west.y }, p2];
  }
  const x1 = hex1.south.x;
  const y1 = hex1.south.y;
  const ym = (y1 * 2 + p2.y) / 3;
  return [{ x: x1, y: y1 }, { x: x1, y: ym }, { x: p2.x, y: ym }, p2];
}

/**
 * `FtileSwitchWithOneLink$ConnectionVerticalTop#drawU` (`:73-88`): the
 * single-case switch's only diamond1-in edge, from the hexagon's own
 * SOUTH point -- a bare vertical line at the CASE's own x, spanning from
 * diamond1's own y to the case's y (never diamond1's own x).
 */
export function oneLinkVerticalPoints(p1: GPoint, p2: GPoint): GPoint[] {
  return [{ x: p2.x, y: p1.y }, p2];
}

/**
 * `ConnectionVerticalThenHorizontal#drawU` (`FtileSwitchWithManyLinks
 * .java:142-188`): the first/last outgoing case's case-to-merge edge,
 * landing on diamond2's own WEST/EAST/NORTH point depending on direction.
 * add4-T1f (R1): also returns that `direction` -- the arrow polygon is
 * chosen with it (`asToRight`/`asToLeft`/`asToDown`, `:159-170`), so it is
 * the edge's end decoration, whatever the last segment's own direction.
 */
export function verticalThenHorizontalPoints(
  p1: GPoint,
  hex2: { west: GPoint; east: GPoint; north: GPoint },
): { points: GPoint[]; direction: 'left' | 'right' | 'down' } {
  let p2: GPoint;
  let direction: 'LEFT' | 'RIGHT' | 'DOWN';
  if (p1.x < hex2.west.x) {
    p2 = hex2.west;
    direction = 'RIGHT';
  } else if (p1.x > hex2.east.x) {
    p2 = hex2.east;
    direction = 'LEFT';
  } else {
    p2 = hex2.north;
    direction = 'DOWN';
  }
  const points: GPoint[] = [p1];
  if (direction === 'LEFT' && p2.x > p1.x - 10) {
    points.push({ x: p1.x, y: p2.y - 8 }, { x: p1.x + 12, y: p2.y - 8 }, { x: p1.x + 12, y: p2.y });
  } else {
    points.push({ x: p1.x, y: p2.y });
  }
  points.push(p2);
  return { points, direction: direction === 'LEFT' ? 'left' : direction === 'RIGHT' ? 'right' : 'down' };
}

/**
 * `ConnectionVerticalBottom#drawU` (`FtileSwitchWithManyLinks.java:252
 * -288`): a middle outgoing case's case-to-merge edge. The threshold
 * check reads DIAMOND1's own W/E corners (`hex1`), not diamond2's -- a
 * literal upstream cross-reference, not a typo. Outside the span: a
 * 2-point line that stops at diamond2's own mid-height WITHOUT reaching
 * its x -- preserved verbatim (CLAUDE.md), same class of quirk as
 * {@link verticalTopPoints}'s open-space start.
 */
export function verticalBottomPoints(
  p1: GPoint,
  hex1: HexagonCorners,
  hex2: { north: GPoint; west: GPoint },
): GPoint[] {
  if (p1.x < hex1.west.x - MARGIN || p1.x > hex1.east.x + MARGIN) {
    return [p1, { x: p1.x, y: hex2.west.y }];
  }
  const ym = (p1.y + hex2.north.y) / 2;
  return [p1, { x: p1.x, y: ym }, { x: hex2.north.x, y: ym }, hex2.north];
}

/**
 * `FtileSwitchWithOneLink$ConnectionVerticalBottom#drawU` (`:107-121`):
 * the single-case switch's only case-to-merge edge -- a bare vertical
 * line at the CASE's own x, landing on diamond2's own pointA (NORTH).
 */
export function oneLinkBottomPoints(p1: GPoint, p2: GPoint): GPoint[] {
  return [{ x: p2.x, y: p1.y }, p2];
}
