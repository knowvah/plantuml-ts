/**
 * state-transition-clip.ts — this port of the edge loop in
 * `DotStringFactory#solve`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/
 * DotStringFactory.java:458-459`):
 *
 * ```java
 *   for (SvekEdge line : getBibliotekon().allLines())
 *       line.solveLine(svgResult);
 * ```
 *
 * whose clip is `SvekEdge#solveLine`'s own reassignment at
 * `SvekEdge.java:671-672`:
 *
 * ```java
 *   dotPath = dotPath.simulateCompound(lhead == null ? null : lhead.getRectangleArea(),
 *                                      ltail == null ? null : ltail.getRectangleArea());
 * ```
 *
 * **Identity and scope.** That loop is scoped to ONE graphviz layout result,
 * not to one diagram. `dot/CucaDiagramSimplifierState.java:57-71` rebuilds
 * every autarkic group through its own `GroupMakerState#getImage()` and
 * `overrideImage`s it into a sized leaf, and each of those images comes from
 * `svek/GraphvizImageBuilder.java:287-288`, which runs `dotStringFactory
 * .solve(svg)` and only THEN constructs the `SvekResult` whose
 * `calculateDimension` is the ink walk and whose `drawU` draws. So at every
 * nesting level the clip precedes that level's own measure and draw — which
 * is why this port applies it inside `state-composite-pass.ts
 * #buildLevelTransitionGeos` and `layout.ts#buildFlatTransitionGeos`, the two
 * places a `TransitionGeo` is built from a `DotLayoutResult`, rather than in
 * a single post-assembly pass. (SI32 D1'/D2'; SI32 T1 proved no
 * "after all geometry, before every consumer" point exists here, because the
 * state ink walk *produces* a composite's own width and height.)
 *
 * **The two sibling passes this one brackets upstream**, neither ported, so a
 * future port has an obvious home: `alignEdgesAtLabelNodes()`
 * (`DotStringFactory.java:462-463`, gated on `DotSplines.ORTHO`, which this
 * port never selects) runs immediately after, and the `manageCollision` loop
 * (`:465-466`) after that — ported for the class engine only
 * (`src/diagrams/class/`), not for state.
 *
 * **This module holds no arithmetic.** `DotPath#simulateCompound` itself is
 * ported exactly once in this repo, at `src/core/spline-clip.ts` (SI31 D9);
 * both functions below are wiring over its two exported branches.
 */
import type { DotInputCluster, DotLayoutResult } from '../../core/graph-layout.js';
import { clipSplineStart, clipSplineEnd, type ClipRect } from '../../core/spline-clip.js';
import { clusterPosMapOf } from './state-composite-geo.js';
import { zaentId } from './state-composite-classify.js';

/** `'__zaent_'` — derived from {@link zaentId} itself rather than re-spelled,
 *  so this module cannot drift from the one place the anchor id is built. */
const ZAENT_PREFIX = zaentId('');

const NO_ANCHOR_RECTS: ReadonlyMap<string, ClipRect> = new Map();

/**
 * The clip rectangles for one layout result, keyed by the `__zaent_<id>`
 * anchor an edge endpoint carries when it addresses a composite's CLUSTER
 * rather than a real node.
 *
 * **Provenance (SI32 D2').** The rectangles are the layout's own cluster
 * boxes — `DotLayoutResult.clusters` via {@link clusterPosMapOf}, the seam
 * `state-composite-geo.ts#materializeSpecs` and the two ink-extent sites
 * already consume — not measured image boxes. That is upstream's own source:
 * `SvekEdge.java:671-672` passes `lhead.getRectangleArea()` /
 * `ltail.getRectangleArea()`, which are `svek/Cluster` rectangles produced by
 * the same `solve()` that positions the nodes.
 *
 * **The join.** `result.clusters` is keyed by `DotInputCluster.id` (see that
 * field's own doc comment on `DotLayoutResult.clusters`), and the anchor node
 * is pushed onto its own composite's `DotInputCluster.nodeIds`
 * (`state-composite-cluster.ts:458-459`, `cluster.nodeIds.push(anchorId)`
 * where `anchorId = zaentId(s.id)`) — the only place any `__zaent_` id enters
 * a `nodeIds` list, so the anchor→box mapping is one-to-one. Both sides live
 * in the same origin-shifted frame as `result.edges` by construction, and
 * `shiftDotLayoutResult` (`state-composite-autonom.ts:80-105`) translates
 * `clusters`, `nodes` and `edges` together — so a shifted call site stays
 * consistent without any re-basing here.
 *
 * An anchor whose cluster the layout returned no box for is simply absent,
 * which is upstream's null `ltail`/`lhead` — no clip.
 */
export function clusterAnchorRectsOf(
  clusters: readonly DotInputCluster[] | undefined,
  result: DotLayoutResult,
): ReadonlyMap<string, ClipRect> {
  if (clusters === undefined || clusters.length === 0) return NO_ANCHOR_RECTS;
  const boxes = clusterPosMapOf(result);
  if (boxes.size === 0) return NO_ANCHOR_RECTS;
  const rects = new Map<string, ClipRect>();
  for (const cluster of clusters) {
    const box = boxes.get(cluster.id);
    if (box === undefined) continue;
    for (const nodeId of cluster.nodeIds) {
      if (nodeId.startsWith(ZAENT_PREFIX))
        rects.set(nodeId, { x: box.x, y: box.y, width: box.width, height: box.height });
    }
  }
  return rects;
}

/**
 * `dotPath = dotPath.simulateCompound(lhead…, ltail…)` for one edge —
 * `SvekEdge.java:671-672`. The TAIL branch runs first and the HEAD branch
 * second, matching that call's own evaluation order; neither rectangle
 * present is upstream's `head == null && tail == null -> return this`
 * short-circuit (`klimt/shape/DotPath.java`).
 *
 * Returns `points` itself (not a copy) when nothing is clipped, so the common
 * path allocates nothing.
 */
export function clipTransitionSpline(
  points: Array<{ x: number; y: number }>,
  from: string,
  to: string,
  anchorRects: ReadonlyMap<string, ClipRect>,
): Array<{ x: number; y: number }> {
  const tail = anchorRects.get(from);
  const head = anchorRects.get(to);
  if (tail === undefined && head === undefined) return points;
  let clipped = points;
  if (tail !== undefined) clipped = clipSplineStart(clipped, tail);
  if (head !== undefined) clipped = clipSplineEnd(clipped, head);
  return clipped;
}
