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
import {
  ClusterRectangles,
  projectionClusterOf,
  type Point,
  type ProjectionClusterSpec,
  type RectangleArea,
} from '../../core/svek/FrontierCalculator.js';
import type { PassAccumulator } from './state-composite-pass-types.js';
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

type Spline = Array<{ x: number; y: number }>;

/** One transition of a layout result, as `DotStringFactory#solve`'s edge loop
 *  sees a `SvekEdge`: its routed spline, the two (resolved) endpoint ids, and
 *  the position in `Bibliotekon#allLines()` it was created at. */
export interface SolveLine {
  readonly key: string;
  readonly from: string;
  readonly to: string;
  readonly points: Spline;
  readonly creationIndex?: number;
}

const toRectangleArea = (b: ClipRect): RectangleArea => ({
  minX: b.x,
  minY: b.y,
  maxX: b.x + b.width,
  maxY: b.y + b.height,
});

const toClipRect = (r: RectangleArea): ClipRect => ({
  x: r.minX,
  y: r.minY,
  width: r.maxX - r.minX,
  height: r.maxY - r.minY,
});

/** `__zaent_<stateId>` -> `<stateId>`; `undefined` for a plain node id. */
function groupIdOfEndpoint(endpointId: string): string | undefined {
  return endpointId.startsWith(ZAENT_PREFIX) ? endpointId.slice(ZAENT_PREFIX.length) : undefined;
}

/**
 * `Cluster#manageEntryExitPoint`'s inputs for every border-point composite of
 * the pass (`Cluster.java:410-430`), read off the layout result: the NORMAL
 * `Cluster.nodes` rectangles, the port centres, and the direct child clusters
 * (`parentId`). The zaent anchor is this port's stand-in for the cluster's
 * special point, not an `SvekNode` in `Cluster.nodes`, so it is excluded.
 */
function projectionSpecsOf(acc: PassAccumulator, result: DotLayoutResult): Map<string, ProjectionClusterSpec> {
  const nodeById = new Map(result.nodes.map((n) => [n.id, n] as const));
  const clusterById = new Map(acc.clusters.map((c) => [c.id, c] as const));
  const specs = new Map<string, ProjectionClusterSpec>();
  for (const info of acc.borderPointClusters) {
    const ports = new Set(info.portNodeIds);
    const insides: RectangleArea[] = [];
    const points: Point[] = [];
    for (const nodeId of clusterById.get(info.clusterId)?.nodeIds ?? []) {
      const node = nodeById.get(nodeId);
      if (node === undefined || nodeId.startsWith(ZAENT_PREFIX)) continue;
      if (ports.has(nodeId)) points.push({ x: node.x + node.width / 2, y: node.y + node.height / 2 });
      else insides.push(toRectangleArea(node));
    }
    specs.set(info.clusterId, {
      id: info.clusterId,
      insides,
      points,
      childIds: acc.clusters.filter((c) => c.parentId === info.clusterId).map((c) => c.id),
      rankdir: info.rankdir,
      titleAndAttributeWidth: info.titleAndAttributeWidth,
      titleAndAttributeHeight: info.titleAndAttributeHeight,
    });
  }
  return specs;
}

/** Stable sort by `Bibliotekon#allLines()` position; a line with no recorded
 *  position keeps its place after every recorded one. */
const inSolveOrder = (lines: readonly SolveLine[]): SolveLine[] =>
  [...lines].sort((a, b) => (a.creationIndex ?? Infinity) - (b.creationIndex ?? Infinity));

/**
 * `DotStringFactory#solve`'s edge loop (`DotStringFactory.java:465-466`) for
 * one layout result: for each line, in `allLines()` order, the
 * `projectionCluster.manageEntryExitPoint` call that precedes the clip
 * (`SvekEdge.java:660-663`) and then `simulateCompound` against the
 * `lhead`/`ltail` rectangles as they stand (`:671-672`). The rectangles are
 * {@link ClusterRectangles}' shared mutable state, so a later line sees what
 * an earlier one left — the order dependence this function exists to keep.
 *
 * @returns each line's clipped spline by `key`; the very array in `points`
 *          for a line that clips nothing.
 */
export function clipLinesInSolveOrder(
  acc: PassAccumulator,
  result: DotLayoutResult,
  lines: readonly SolveLine[],
): Map<string, Spline> {
  const graphviz = new Map([...clusterPosMapOf(result)].map(([id, b]) => [id, toRectangleArea(b)] as const));
  const rects = new ClusterRectangles(graphviz, projectionSpecsOf(acc, result));
  const clusterIdByState = new Map(acc.borderPointClusters.map((c) => [c.stateId, c.clusterId] as const));
  const projectionOrder = acc.borderPointClusters.map((c) => c.stateId);
  const raw = clusterAnchorRectsOf(acc.clusters, result);
  const clusterIdByAnchor = anchorClusterIds(acc.clusters);
  const clipRectOf = (endpoint: string): ClipRect | undefined => {
    const clusterId = clusterIdByAnchor.get(endpoint);
    if (clusterId === undefined || !rects.isAdjusted(clusterId)) return raw.get(endpoint);
    return toClipRect(rects.rectangleAreaOf(clusterId)!);
  };
  const out = new Map<string, Spline>();
  for (const line of inSolveOrder(lines)) {
    const touched = new Set([line.from, line.to].flatMap((e) => groupIdOfEndpoint(e) ?? []));
    const projection = projectionClusterOf(touched, projectionOrder);
    if (projection !== undefined) rects.manageEntryExitPoint(clusterIdByState.get(projection)!);
    const clipped = clipSplineWith(line.points, clipRectOf(line.from), clipRectOf(line.to));
    out.set(line.key, clipped);
  }
  return out;
}

/** `anchorId -> DotInputCluster.id` for every zaent anchor on a cluster's own
 *  `nodeIds` (see {@link clusterAnchorRectsOf}'s join). */
function anchorClusterIds(clusters: readonly DotInputCluster[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const cluster of clusters) {
    for (const nodeId of cluster.nodeIds) if (nodeId.startsWith(ZAENT_PREFIX)) out.set(nodeId, cluster.id);
  }
  return out;
}

/** `dotPath.simulateCompound(head, tail)` over an explicit pair of rectangles
 *  (tail branch first, as {@link clipTransitionSpline}). */
function clipSplineWith(points: Spline, tail: ClipRect | undefined, head: ClipRect | undefined): Spline {
  let clipped = points;
  if (tail !== undefined) clipped = clipSplineStart(clipped, tail);
  if (head !== undefined) clipped = clipSplineEnd(clipped, head);
  return clipped;
}
