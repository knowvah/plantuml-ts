/**
 * `ArrowsRegular`/`ArrowsTriangle` — the activity-diagram arrowhead
 * decorations, selected on `skinparam style strictuml` (D4).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/ArrowsRegular.java:41-86
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/ArrowsTriangle.java:41-82
 * @see net/sourceforge/plantuml/klimt/Arrows.java:52-66 (`asTo` dispatch)
 * @see net/sourceforge/plantuml/utils/Direction.java:110-128 (`fromVector`)
 * @see net/sourceforge/plantuml/skin/SkinParam.java:1306-1309 (`arrows()`'s
 *      `strictUmlStyle() ? new ArrowsTriangle() : new ArrowsRegular()`)
 *
 * `ArrowsRegular` is the default arrow decoration; `ArrowsTriangle` is
 * reachable only under `skinparam style strictuml` (decisions.md#D4).
 * Occupancy for the `activity-klimt-compress` mission's slot finder (D3,
 * batch-1 T1) depends on `ArrowsRegular`'s extents, so that one stays the
 * un-themed default `arrowHeadPoints`/`arrowHeadExtents` below resolve to.
 */
import type { Theme } from '../../core/theme.js';

/** One of the four axis-aligned arrow directions `Arrows#asTo` dispatches
 *  on (`klimt/Arrows.java:52-66`). Upstream's `Direction` enum also has
 *  no fifth "none" case reachable from `asTo` -- a null direction never
 *  reaches `Worm#drawInternalOneColor`'s decoration draw. */
export type ArrowDir = 'up' | 'down' | 'left' | 'right';

/** `ArrowsRegular.java:43-44`. */
const DELTA1 = 10;
const DELTA2 = 4;

/**
 * The four decoration points, relative to the tip (0, 0), in the exact
 * order `ArrowsRegular` emits them (`ArrowsRegular.java:46-84`) — the
 * jar's `UPolygon`/`points` attribute preserves insertion order, and the
 * acceptance test for this port compares `points=` byte for byte.
 */
export function arrowHeadPoints(dir: ArrowDir): ReadonlyArray<{ x: number; y: number }> {
  switch (dir) {
    // asToUp: (-4,10), (0,0), (4,10), (0,6) -- ArrowsRegular.java:47-54
    case 'up':
      return [
        { x: -DELTA2, y: DELTA1 },
        { x: 0, y: 0 },
        { x: DELTA2, y: DELTA1 },
        { x: 0, y: DELTA1 - 4 },
      ];
    // asToDown: (-4,-10), (0,0), (4,-10), (0,-6) -- ArrowsRegular.java:56-64
    case 'down':
      return [
        { x: -DELTA2, y: -DELTA1 },
        { x: 0, y: 0 },
        { x: DELTA2, y: -DELTA1 },
        { x: 0, y: -DELTA1 + 4 },
      ];
    // asToRight: (-10,-4), (0,0), (-10,4), (-6,0) -- ArrowsRegular.java:66-74
    case 'right':
      return [
        { x: -DELTA1, y: -DELTA2 },
        { x: 0, y: 0 },
        { x: -DELTA1, y: DELTA2 },
        { x: -DELTA1 + 4, y: 0 },
      ];
    // asToLeft: (10,-4), (0,0), (10,4), (6,0) -- ArrowsRegular.java:76-84
    case 'left':
      return [
        { x: DELTA1, y: -DELTA2 },
        { x: 0, y: 0 },
        { x: DELTA1, y: DELTA2 },
        { x: DELTA1 - 4, y: 0 },
      ];
  }
}

/**
 * `ArrowsTriangle`'s four direction points (`ArrowsTriangle.java:41-82`) --
 * the SAME `delta1`/`delta2` dispatch as {@link arrowHeadPoints}, but a
 * 3-point polygon each (tip + two base corners, no waist point). Point
 * INSERTION ORDER matches the Java exactly, since the `points=` attribute
 * preserves it (same acceptance contract as `arrowHeadPoints`'s own doc
 * comment) -- note `asToDown`'s order is `(-4,-10),(4,-10),(0,0)`, NOT
 * `(-4,-10),(0,0),(4,-10)` the way `arrowHeadPoints('down')` orders it.
 */
export function arrowHeadPointsTriangle(dir: ArrowDir): ReadonlyArray<{ x: number; y: number }> {
  switch (dir) {
    // asToUp: (-4,10),(0,0),(4,10) -- ArrowsTriangle.java:48-52
    case 'up':
      return [
        { x: -DELTA2, y: DELTA1 },
        { x: 0, y: 0 },
        { x: DELTA2, y: DELTA1 },
      ];
    // asToDown: (-4,-10),(4,-10),(0,0) -- ArrowsTriangle.java:57-61
    case 'down':
      return [
        { x: -DELTA2, y: -DELTA1 },
        { x: DELTA2, y: -DELTA1 },
        { x: 0, y: 0 },
      ];
    // asToRight: (-10,-4),(0,0),(-10,4) -- ArrowsTriangle.java:66-70
    case 'right':
      return [
        { x: -DELTA1, y: -DELTA2 },
        { x: 0, y: 0 },
        { x: -DELTA1, y: DELTA2 },
      ];
    // asToLeft: (10,-4),(0,0),(10,4) -- ArrowsTriangle.java:75-79
    case 'left':
      return [
        { x: DELTA1, y: -DELTA2 },
        { x: 0, y: 0 },
        { x: DELTA1, y: DELTA2 },
      ];
  }
}

/**
 * `SkinParam.java:1306-1309`: `arrows()` returns `new ArrowsTriangle()`
 * under `skinparam style strictuml`, else `new ArrowsRegular()` (D4).
 * `theme.strictUml` is the same flag `skinparam-key-handlers-table-a.ts`
 * already sets for `skinparam style strictuml` (`core/theme.ts:113`) --
 * no new theme field.
 */
export function arrowHeadPointsFor(theme: Theme, dir: ArrowDir): ReadonlyArray<{ x: number; y: number }> {
  return theme.strictUml === true ? arrowHeadPointsTriangle(dir) : arrowHeadPoints(dir);
}

/**
 * Min/max extents of `arrowHeadPoints(dir)`, relative to the tip. This is
 * what `SlotFinder#drawPolygon` reads as `getMinX()`/`getMaxX()` off the
 * translated `UPolygon` (`klimt/compress/SlotFinder.java`, T3's consumer).
 */
export function arrowHeadExtents(dir: ArrowDir): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const pts = arrowHeadPoints(dir);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Port of `Direction.fromVector(p1, p2)` (`utils/Direction.java:110-128`)
 * expressed over a displacement `(dx, dy) = p2 - p1` rather than two
 * points, since every call site here already has the delta.
 *
 * Upstream: `x1 == x2` picks DOWN/UP by the sign of `y2 - y1`; `y1 == y2`
 * picks RIGHT/LEFT by the sign of `x2 - x1`; a zero vector returns `null`
 * (`:115-116`); anything diagonal throws `IllegalArgumentException("Not a
 * H or V line!")` (`:128`) because every upstream `Worm` segment fed to
 * `fromVector` is axis-aligned by construction.
 *
 * Our edges are not always axis-aligned (e.g. the `nomeco-93-minu967`
 * out-edge segment `(208.638,164) -> (218.638,184)`), so upstream's throw
 * is not reachable here. DIVERGENCE, deliberate: for a diagonal, pick the
 * dominant axis (`|dy| >= |dx|` -> vertical, ties going vertical) instead
 * of throwing -- this covers segments upstream's `Worm` structurally
 * cannot produce. For a zero vector, return `'down'` rather than upstream's
 * `null`: the renderer already treats a zero-length last segment as "draw
 * nothing" (`renderer.ts#arrowTip`'s `len === 0` guard predates this port),
 * so this value is never read for a real polygon; it exists only so this
 * function is total.
 */
export function arrowDirection(dx: number, dy: number): ArrowDir {
  if (dx === 0 && dy === 0) return 'down';
  if (dx === 0) return dy > 0 ? 'down' : 'up';
  if (dy === 0) return dx > 0 ? 'right' : 'left';
  return Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 'down' : 'up') : dx > 0 ? 'right' : 'left';
}
