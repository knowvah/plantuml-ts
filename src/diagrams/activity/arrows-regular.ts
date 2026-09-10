/**
 * `ArrowsRegular` — the default activity-diagram arrowhead decoration.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/ArrowsRegular.java:41-86
 * @see net/sourceforge/plantuml/klimt/Arrows.java:52-66 (`asTo` dispatch)
 * @see net/sourceforge/plantuml/utils/Direction.java:110-128 (`fromVector`)
 *
 * `ArrowsRegular` is the default arrow decoration
 * (`skin/SkinParam.java:1308-1309`); `ArrowsTriangle` is only reachable
 * under a style and stays filed (unported). Occupancy for the
 * `activity-klimt-compress` mission's slot finder (D3, batch-1 T1) depends
 * on this polygon's extents, so it is ported first and shared between the
 * renderer and (in T3) the slot finder.
 */

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
