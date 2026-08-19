/**
 * spline-clip.ts — faithful port of upstream's compound-edge boundary
 * clipping (`DotPath#simulateCompound`, klimt/shape/DotPath.java), applied
 * when an edge endpoint is a container/group.
 *
 * SI31 T5 (`plans/state-residual-fix-batch/decisions.md#d9`): moved here
 * from `src/diagrams/description/` unchanged — the SI27 shared-seam
 * pattern. Upstream calls `simulateCompound` from `SvekEdge#solveLine`
 * (`SvekEdge.java:671-672`), which is `CucaDiagram`-family machinery every
 * svek engine shares, so the port belongs in `src/core/` too: the state
 * engine's composite-anchor transitions need the same clip
 * (`state/layout-ink-extent.ts`), and `tests/architecture/layering.test.ts`
 * Rule 2 forbids state importing it from description. There is exactly ONE
 * port of `simulateCompound` in this repo and this is it — copying it is
 * forbidden (CLAUDE.md, D9). It was originally split out of description's
 * `layout-helpers.ts` to keep that file within this project's 500-line cap
 * (reported split, matching the `svek-edge-geometry.ts` precedent).
 *
 * Upstream `SvekEdge#solveLine` calls
 * `dotPath.simulateCompound(lhead.getRectangleArea(), ltail.getRectangleArea())`
 * to trim the graphviz spline back to the boundary of the `lhead`/`ltail`
 * cluster rectangles (the group-anchor point graphviz routed the edge to
 * sits *inside* the cluster — `ClusterDotString.java:149`,
 * `Cluster#getSpecialPointId`). The two exported functions here are the
 * `tail` (`clipSplineStart`) and `head` (`clipSplineEnd`) branches of that
 * one method, kept separate because this port's callers
 * (description's `layout-geo-post.ts#clipEdgePoints`, state's
 * `layout-ink-extent.ts#addTransitionInk`) apply them independently.
 *
 * The point array they operate on is the flat graphviz-spline shape
 * `DescriptionEdgeGeo.points`/`TransitionGeo.points` carry: a start anchor
 * followed by `(cp1, cp2, endpoint)` cubic-bezier triples — `1 + 3*n` points for `n`
 * segments — the same convention `buildDotPathFromSplinePoints`
 * (`svek-edge-geometry.ts`) consumes. Clipping is done bezier-by-bezier
 * (upstream operates on `DotPath.beziers`), so the `1 + 3*n` invariant is
 * preserved by construction; the earlier polyline implementation broke it
 * and dropped edges (follow-up F1, `docs/svg-conformance.md`).
 *
 * Fidelity note: upstream locates the boundary crossing by 8 midpoint
 * subdivisions (`XCubicCurve2D#subdivide`, t = 0.5) and *discards* the
 * final straddling sliver — so the clipped endpoint lands a fraction of a
 * segment shy of the true boundary, never exactly on it. That quirk is
 * reproduced here verbatim: matching the jar oracle requires the jar's
 * crossing point, not a more precise one.
 */

/**
 * The rectangle the clips test against — upstream's `RectangleArea`
 * (klimt/geom/RectangleArea.java), which is what `SvekEdge.java:671-672`
 * passes as `lhead.getRectangleArea()` / `ltail.getRectangleArea()`.
 *
 * Declared structurally here rather than imported so `src/core/` keeps no
 * dependency on `src/diagrams/` (`layering.test.ts` Rule 1). Description's
 * own bbox type (`description/layout-helpers-types.ts`) and the state
 * engine's composite rectangle both satisfy it by structure, so no caller
 * changes shape.
 */
export interface ClipRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Pt = { x: number; y: number };

/** One cubic bezier segment: `[start, cp1, cp2, end]`. */
type Cubic = readonly [Pt, Pt, Pt, Pt];

// Upstream's `subdivide` iteration count (`DotPath#simulateCompound`,
// `for (int k = 0; k < 8; k++)`).
const SUBDIVIDE_ITERS = 8;

/**
 * `RectangleArea#contains(x, y)` (klimt/geom/RectangleArea.java): the
 * boundary is **half-open** — closed on min, open on max. Not the same as
 * description's `layout-helpers.ts#insideBbox` (closed on both), so the
 * clip carries its own predicate to match upstream's subdivision decisions
 * exactly.
 */
function contains(p: Pt, b: ClipRect): boolean {
  return p.x >= b.x && p.x < b.x + b.width && p.y >= b.y && p.y < b.y + b.height;
}

/**
 * Midpoint (t = 0.5) subdivision of one cubic — a direct port of
 * `XCubicCurve2D#subdivide` (klimt/geom/XCubicCurve2D.java), the only
 * subdivision `simulateCompound` uses. Returns `[part1, part2]` where
 * `part1` is the `[0, 0.5]` half and `part2` the `[0.5, 1]` half; they
 * share the on-curve midpoint (`part1[3]` equals `part2[0]`).
 */
export function subdivide(cubic: Cubic): [Cubic, Cubic] {
  const [p0, c1, c2, p3] = cubic;
  const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const center = mid(c1, c2);
  const lc1 = mid(p0, c1);
  const rc2 = mid(p3, c2);
  const lc12 = mid(lc1, center);
  const rc21 = mid(rc2, center);
  const m = mid(lc12, rc21);
  return [[p0, lc1, lc12, m], [m, rc21, rc2, p3]];
}

/** Split a `1 + 3*n` point list into its `n` cubic segments. */
function toBeziers(points: readonly Pt[]): Cubic[] {
  const beziers: Cubic[] = [];
  for (let i = 0; i + 3 < points.length; i += 3) {
    beziers.push([points[i]!, points[i + 1]!, points[i + 2]!, points[i + 3]!]);
  }
  return beziers;
}

/** Reassemble a `1 + 3*n` point list from a continuous chain of cubics. */
function fromBeziers(beziers: readonly Cubic[]): Pt[] {
  const first = beziers[0]!;
  const points: Pt[] = [first[0], first[1], first[2], first[3]];
  for (let i = 1; i < beziers.length; i++) {
    points.push(beziers[i]![1], beziers[i]![2], beziers[i]![3]);
  }
  return points;
}

/** True when `points` is a well-formed `1 + 3*n` spline (`n >= 1`). */
function isSpline(points: readonly Pt[]): boolean {
  return points.length >= 4 && (points.length - 1) % 3 === 0;
}

/**
 * Clip the leading portion of a spline that lies inside `tail` — the
 * `tail` branch of `DotPath#simulateCompound`. The graphviz spline runs
 * from a group-anchor point inside the `ltail` cluster outward; this trims
 * it back to the cluster boundary. Returns `points` unchanged when the
 * start is already outside `tail`, when the whole spline stays inside
 * (upstream's "strange1" no-op), or when `points` is not a spline.
 */
export function clipSplineStart(points: Array<Pt>, tail: ClipRect): Array<Pt> {
  if (!isSpline(points)) return points;
  const beziers = toBeziers(points);
  if (!contains(beziers[0]![0], tail)) return points; // tail.contains(getStartPoint()) == false
  let idx = 0;
  while (idx + 1 < beziers.length && contains(beziers[idx]![3], tail)) idx++;
  if (contains(beziers[idx]![3], tail)) return points; // last P2 still inside: "strange1"
  const result: Cubic[] = [];
  let current = beziers[idx]!;
  for (let k = 0; k < SUBDIVIDE_ITERS; k++) {
    const [part1, part2] = subdivide(current);
    if (contains(part1[3], tail)) {
      current = part2;
    } else {
      result.unshift(part2);
      current = part1;
    }
  }
  for (let i = idx + 1; i < beziers.length; i++) result.push(beziers[i]!);
  return result.length === 0 ? points : fromBeziers(result);
}

/**
 * Clip the trailing portion of a spline that lies inside `head` — the
 * `head` branch of `DotPath#simulateCompound`. Trims the spline back to
 * the `lhead` cluster boundary. Returns `points` unchanged when the end is
 * already outside `head`, when a segment is wholly inside `head`
 * (upstream's early `return me`), or when `points` is not a spline.
 */
export function clipSplineEnd(points: Array<Pt>, head: ClipRect): Array<Pt> {
  if (!isSpline(points)) return points;
  const beziers = toBeziers(points);
  if (!contains(beziers[beziers.length - 1]![3], head)) return points; // end outside head
  const result: Cubic[] = [];
  for (const bezier of beziers) {
    if (!contains(bezier[3], head)) {
      result.push(bezier);
      continue;
    }
    if (contains(bezier[0], head)) return points; // whole segment inside: upstream `return me`
    let current = bezier;
    for (let k = 0; k < SUBDIVIDE_ITERS; k++) {
      const [part1, part2] = subdivide(current);
      if (contains(part1[3], head)) {
        current = part1;
      } else {
        result.push(part1);
        current = part2;
      }
    }
    return result.length === 0 ? points : fromBeziers(result);
  }
  return points;
}
