import type { GPoint } from '../tiles/points.js';
import type { ActivityEdgeGeo } from '../activity-geometry.types.js';

/**
 * Mirrors `Worm#addPoint` (`Worm.java:262-266`): drop a point that
 * exactly equals ("==" on both doubles) the point immediately before it.
 * This is the one edge-construction seam every `tile-coordinates.ts`
 * `pushEdge` call passes through (`decisions.md` D2) -- no tolerance; two
 * points one ulp apart are both kept, matching the jar's own near-zero
 * segments (`.agent-notes/apc-T0.md`). Split into its own sibling module
 * because adding it to `tile-coordinates.ts` would cross the file's
 * 500-line cap (mission `activity-parallel-connectors` README, "Push
 * forward").
 */
export function dedupeAdjacentPoints(points: readonly GPoint[]): GPoint[] {
  const result: GPoint[] = [];
  for (const p of points) {
    const prev = result[result.length - 1];
    if (prev !== undefined && prev.x === p.x && prev.y === p.y) continue;
    result.push(p);
  }
  return result;
}

/**
 * `Snake.same` (`Snake.java:303-305`): two endpoints count as touching
 * within 0.001px, not exact equality -- the gate that decides WHETHER two
 * edges fuse, distinct from `dedupeAdjacentPoints`'s own exact-equality
 * rule for collapsing a single edge's OWN repeated points.
 */
function sameEndpoint(a: GPoint, b: GPoint): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy) < 0.001;
}

function pick<T>(primary: T | undefined, fallback: T | undefined): T | undefined {
  return primary !== undefined ? primary : fallback;
}

function setDefined<K extends 'label' | 'color' | 'emphasize' | 'midArrowAt'>(
  merged: ActivityEdgeGeo,
  key: K,
  value: ActivityEdgeGeo[K] | undefined,
): void {
  if (value !== undefined) merged[key] = value;
}

/**
 * The fused edge's own fields once `tryMergeEdges` has confirmed `a`'s
 * last point touches `b`'s first: `a`'s label/color/emphasize survive
 * (`Snake.java:319-320`'s `color`/`mergeTexts` come from `this`, i.e. `a`
 * -- `b`'s label is already known empty, the `tryMergeEdges` guard), and
 * the end decoration is `b`'s unless `b` explicitly drew none (`oneOf =
 * other.endDecoration == null ? this.endDecoration : other.endDecoration`,
 * `Snake.java:316`).
 */
function buildMergedEdge(a: ActivityEdgeGeo, b: ActivityEdgeGeo): ActivityEdgeGeo {
  const merged: ActivityEdgeGeo = { points: dedupeAdjacentPoints([...a.points, ...b.points]) };
  setDefined(merged, 'label', a.label);
  setDefined(merged, 'color', a.color);
  if (b.arrowhead === false && a.arrowhead === false) merged.arrowhead = false;
  setDefined(merged, 'emphasize', pick(a.emphasize, b.emphasize));
  setDefined(merged, 'midArrowAt', pick(a.midArrowAt, b.midArrowAt));
  return merged;
}

/**
 * Mirrors `Snake#merge` (`Snake.java:303-327`): `a` absorbs `b` into one
 * polyline when one's last point touches the other's first (`Snake.same`).
 * Declines when the absorbed edge carries a label (`Snake.java:306-308`,
 * `if (text.hasText(...)) return null` -- a labelled snake never
 * disappears into another one); `Worm#merge`'s further pattern-based line
 * simplification (`Worm.java:374-393`, `removePattern1`-8) has no fixture
 * in this batch that needs it and is out of scope here.
 */
function tryMergeEdges(a: ActivityEdgeGeo, b: ActivityEdgeGeo): ActivityEdgeGeo | null {
  if (b.label !== undefined && b.label !== '') return null;
  if (sameEndpoint(a.points[a.points.length - 1]!, b.points[0]!)) return buildMergedEdge(a, b);
  if (sameEndpoint(a.points[0]!, b.points[b.points.length - 1]!)) return tryMergeEdges(b, a);
  return null;
}

/**
 * `UGraphicForSnake#addPendingSnake` (`svek/UGraphicForSnake.java:140-149`):
 * every edge drawn during a render is checked, in draw order, against every
 * already-buffered one for a touching merge; a match replaces that buffered
 * entry IN PLACE and the new edge is discarded, so a chain of edges built
 * by separate walkers/tiles that happen to join end-to-start collapses
 * into one polyline with one arrowhead, never two (becaje-01-vaji284/
 * bocaga-53-nale241/jecoxu-17-zama003, T2d row 29(d)).
 *
 * SCOPED, not a full port: checked only against the single
 * most-recently-pushed edge, not the jar's full pending history. The jar's
 * own `mergeable` strategy (`MergeStrategy.NONE`, e.g. `FtileIfDown.java:
 * 512`'s absorbed-stop connector) stops two coordinate-sharing-but-
 * unrelated Snakes from fusing; this port has no per-edge `mergeable` flag
 * threaded (the builders that would set it -- `gtile-if-down.ts`,
 * `conditional-builder.ts` -- are outside this task's write-set), and a
 * full history scan produces false positives wherever this port's
 * geometry (unlike the jar's) places two DIFFERENT hook points at the
 * exact same coordinate (gitoke-38-beme495: a diamond's own IN point and
 * an unrelated merge line both land on `(1872.44, 55)`). Adjacent-only
 * matching is sound for every case this batch's rows need (the absorbed
 * edge and its continuation are always pushed back-to-back) and produced
 * zero cross-diagram false merges across the full baseline; a full-history
 * merge needing the real `mergeable` flag is a push-forward.
 */
export function mergeTouchingEdges(edges: readonly ActivityEdgeGeo[]): ActivityEdgeGeo[] {
  const pending: ActivityEdgeGeo[] = [];
  for (const incoming of edges) {
    const lastIdx = pending.length - 1;
    const merged = lastIdx >= 0 ? tryMergeEdges(pending[lastIdx]!, incoming) : null;
    if (merged !== null) {
      pending[lastIdx] = merged;
    } else {
      pending.push(incoming);
    }
  }
  return pending;
}
