/**
 * `Worm#merge`'s corner-collapse fixed point (D1, T1b) -- the direction-
 * pattern passes `Snake#merge` (`snake-merge.ts`) runs over a freshly
 * concatenated point list, and nothing else: this module owns no notion of
 * decorations, text, or strategy beyond the one `MergeStrategy.FULL` gate
 * `removePattern8` reads.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:361-394
 *   -- `merge`/`mergeMe`: concatenate both point lists (through each
 *   worm's own `resolve`, already absolute in this port -- D1's own doc),
 *   then loop the ten passes below until none fires.
 * @see net/sourceforge/plantuml/utils/Direction.java:102-130
 *   -- `fromVector`/`getInv`, ported as {@link directionOf}/{@link inverse}.
 */

import type { GPoint } from '../tiles/points.js';
import { dedupeAdjacentPoints } from './edge-point-dedupe.js';

export type MergeStrategy = 'FULL' | 'LIMITED' | 'NONE';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * Two coordinates this port's own upstream geometry computed through
 * different arithmetic paths (e.g. `x + a + b` vs `x + (a + b)`) that
 * SHOULD land on the same axis -- ulp-scale IEEE-754 drift, confirmed on
 * `pixako-75-kumi821` (`63.021875` vs `63.021874999999994`, a 6e-15
 * difference): several orders of magnitude below any real geometric
 * distinction in this domain (`Snake.same()`'s own merge-trigger
 * tolerance is `0.001`) and far above float64 noise at this magnitude
 * (~1e-13). Axis membership only -- never used to move a point.
 */
const AXIS_EPSILON = 1e-6;

/**
 * `Direction.fromVector` (`:110-130`): orthogonal segments only -- every
 * activity edge is axis-aligned, so the diagonal branch can never fire in
 * this port's geometry, same as upstream's own `IllegalArgumentException`
 * guard. `undefined` is this port's `null` (two coincident points --
 * `removeNullVector`'s own doc explains why that is reachable here even
 * though `Worm#addPoint`'s exact-duplicate skip runs on every OTHER push:
 * a merge join concatenates two ALREADY-built point lists with no such
 * guard at the seam).
 */
function directionOf(p1: GPoint, p2: GPoint): Direction | undefined {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.abs(dx) < AXIS_EPSILON && Math.abs(dy) < AXIS_EPSILON) return undefined;
  if (Math.abs(dx) < AXIS_EPSILON) return dy > 0 ? 'DOWN' : 'UP';
  if (Math.abs(dy) < AXIS_EPSILON) return dx > 0 ? 'RIGHT' : 'LEFT';
  throw new Error(`snake-merge: not a horizontal or vertical line (${p1.x},${p1.y})->(${p2.x},${p2.y})`);
}

function inverse(dir: Direction): Direction {
  switch (dir) {
    case 'RIGHT':
      return 'LEFT';
    case 'LEFT':
      return 'RIGHT';
    case 'DOWN':
      return 'UP';
    case 'UP':
      return 'DOWN';
  }
}

function directionAt(points: readonly GPoint[], i: number): Direction | undefined {
  return directionOf(points[i]!, points[i + 1]!);
}

/** `getPatternAt` (`:294-297`): the four consecutive segment directions
 *  starting at `i`, read by every four-point corner pattern below. */
function patternAt(points: readonly GPoint[], i: number): ReadonlyArray<Direction | undefined> {
  return [directionAt(points, i), directionAt(points, i + 1), directionAt(points, i + 2), directionAt(points, i + 3)];
}

function isPattern(points: readonly GPoint[], i: number, want: readonly Direction[][]): boolean {
  const pattern = patternAt(points, i);
  return want.some((w) => w.length === pattern.length && w.every((d, idx) => d === pattern[idx]));
}

/** `removeNullVector` (`:396-405`): a zero-length segment left by the
 *  merge join's own concatenation (see {@link directionOf}'s own doc). */
function removeNullVector(points: GPoint[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (directionAt(points, i) === undefined) {
      points.splice(i, 1);
      return true;
    }
  }
  return false;
}

/** `removeRedondantDirection` (`:407-417`): two consecutive segments
 *  running the same way collapse to one. */
function removeRedondantDirection(points: GPoint[]): boolean {
  for (let i = 0; i < points.length - 2; i++) {
    if (directionAt(points, i) === directionAt(points, i + 1)) {
      points.splice(i + 1, 1);
      return true;
    }
  }
  return false;
}

/** Every four-point pattern collapses the SAME way: points `i+1..i+3`
 *  replaced by one corner point. Shared by `removePattern1`-`5`/`8` so each
 *  stays a one-line body; split out only to keep this file's own function
 *  count from ballooning into near-identical bodies CLAUDE.md would flag
 *  as a refactor risk if inlined ten times instead of parameterised once. */
function collapseCorner(points: GPoint[], i: number, corner: GPoint): void {
  points.splice(i + 1, 3, corner);
}

/** `removePattern1` (`:419-434`): `DOWN,LEFT,DOWN,RIGHT` or its mirror. */
function removePattern1(points: GPoint[]): boolean {
  for (let i = 0; i < points.length - 5; i++) {
    if (isPattern(points, i, [['DOWN', 'LEFT', 'DOWN', 'RIGHT'], ['DOWN', 'RIGHT', 'DOWN', 'LEFT']])) {
      collapseCorner(points, i, { x: points[i + 1]!.x, y: points[i + 3]!.y });
      return true;
    }
  }
  return false;
}

/** `removePattern2` (`:452-466`): `RIGHT,DOWN,RIGHT,UP` or its mirror. */
function removePattern2(points: GPoint[]): boolean {
  for (let i = 0; i < points.length - 5; i++) {
    if (isPattern(points, i, [['RIGHT', 'DOWN', 'RIGHT', 'UP'], ['LEFT', 'DOWN', 'LEFT', 'UP']])) {
      collapseCorner(points, i, { x: points[i + 3]!.x, y: points[i + 1]!.y });
      return true;
    }
  }
  return false;
}

/** `removePattern3` (`:468-483`): `DOWN,RIGHT,DOWN,RIGHT` or its mirror. */
function removePattern3(points: GPoint[]): boolean {
  for (let i = 0; i < points.length - 4; i++) {
    if (isPattern(points, i, [['DOWN', 'RIGHT', 'DOWN', 'RIGHT'], ['DOWN', 'LEFT', 'DOWN', 'LEFT']])) {
      collapseCorner(points, i, { x: points[i + 1]!.x, y: points[i + 3]!.y });
      return true;
    }
  }
  return false;
}

/** `removePattern4` (`:485-503`): `DOWN,LEFT,DOWN,RIGHT` at the LAST five
 *  points only, gated on `p4.x > p1.x` (unlike `removePattern1`, which
 *  scans every position and has no such gate). */
function removePattern4(points: GPoint[]): boolean {
  const i = points.length - 5;
  if (i < 0 || !isPattern(points, i, [['DOWN', 'LEFT', 'DOWN', 'RIGHT']])) return false;
  if (points[i + 4]!.x <= points[i + 1]!.x) return false;
  collapseCorner(points, i, { x: points[i + 1]!.x, y: points[i + 3]!.y });
  return true;
}

/** `removePattern5` (`:505-523`): `DOWN,RIGHT,DOWN,LEFT` at the LAST five
 *  points only, gated on `p4.x + 4 < p1.x`. */
function removePattern5(points: GPoint[]): boolean {
  const i = points.length - 5;
  if (i < 0 || !isPattern(points, i, [['DOWN', 'RIGHT', 'DOWN', 'LEFT']])) return false;
  if (points[i + 4]!.x + 4 >= points[i + 1]!.x) return false;
  collapseCorner(points, i, { x: points[i + 1]!.x, y: points[i + 3]!.y });
  return true;
}

/** `removePattern6` (`:525-533`): a segment immediately followed by its
 *  own inverse (there-and-back) collapses to nothing. */
function removePattern6(points: GPoint[]): boolean {
  for (let i = 0; i < points.length - 2; i++) {
    const dir = directionAt(points, i);
    const next = directionAt(points, i + 1);
    if (dir !== undefined && next !== undefined && dir === inverse(next)) {
      points.splice(i + 1, 1);
      return true;
    }
  }
  return false;
}

/** `removePattern7` (`:436-450`): `RIGHT,DOWN,LEFT,DOWN` at the FIRST
 *  position only, gated on `p3.x > p0.x` -- collapses to a 2-point corner
 *  (replaces `i+1,i+2`, not `i+1..i+3`, unlike every other pattern here). */
function removePattern7(points: GPoint[]): boolean {
  if (points.length <= 4) return false;
  if (!isPattern(points, 0, [['RIGHT', 'DOWN', 'LEFT', 'DOWN']])) return false;
  if (points[3]!.x <= points[0]!.x) return false;
  points.splice(1, 2, { x: points[3]!.x, y: points[0]!.y });
  return true;
}

/** `removePattern8` (`:535-550`): `LEFT,DOWN,LEFT,DOWN` or its mirror --
 *  the ONLY pattern gated on `MergeStrategy.FULL` (`Worm.java:390-391`);
 *  `mergeMe` skips it entirely for `LIMITED` (decisions.md D2's "extra
 *  corner LIMITED preserves"). */
function removePattern8(points: GPoint[]): boolean {
  for (let i = 0; i < points.length - 4; i++) {
    if (isPattern(points, i, [['LEFT', 'DOWN', 'LEFT', 'DOWN'], ['RIGHT', 'DOWN', 'RIGHT', 'DOWN']])) {
      collapseCorner(points, i, { x: points[i + 3]!.x, y: points[i + 1]!.y });
      return true;
    }
  }
  return false;
}

/** Every pass `mergeMe` tries, in upstream's own order (`:379-391`) --
 *  `removePattern8` is appended only for `MergeStrategy.FULL` (D2's "extra
 *  corner LIMITED preserves"). Split out as data, not a chained `||`, to
 *  keep {@link mergeMe} itself a plain loop rather than a ten-branch
 *  expression. */
function passesFor(strategy: MergeStrategy): ReadonlyArray<(points: GPoint[]) => boolean> {
  const passes = [
    removeNullVector,
    removeRedondantDirection,
    removePattern1,
    removePattern2,
    removePattern3,
    removePattern4,
    removePattern5,
    removePattern6,
    removePattern7,
  ];
  return strategy === 'FULL' ? [...passes, removePattern8] : passes;
}

/** `mergeMe` (`:374-394`): one fixed-point loop, short-circuited to fire
 *  AT MOST one collapse per outer iteration (same order as upstream) so a
 *  pattern's own preconditions are always re-evaluated against the
 *  freshly-collapsed list before the next one runs. */
function mergeMe(points: GPoint[], strategy: MergeStrategy): void {
  const passes = passesFor(strategy);
  let change = true;
  while (change) {
    change = passes.some((pass) => pass(points));
  }
}

/**
 * `Worm#merge` (`:361-372`): concatenate `head`'s then `tail`'s own point
 * lists (both already absolute -- `Snake#merge`'s own doc, `snake-merge.ts`)
 * through the SAME exact-duplicate skip every other edge push already uses
 * (`Worm#addPoint`, `edge-point-dedupe.ts`), then run {@link mergeMe}.
 */
export function wormMerge(head: readonly GPoint[], tail: readonly GPoint[], strategy: MergeStrategy): GPoint[] {
  const points = dedupeAdjacentPoints([...head, ...tail]);
  mergeMe(points, strategy);
  return points;
}
