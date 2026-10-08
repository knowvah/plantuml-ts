/**
 * The rectangle the jar DRAWS for a border-point composite — and the one its
 * ink pass sees — which is neither graphviz's polygon nor a single
 * `manageEntryExitPoint` of it (lgm-T1d).
 *
 * `Cluster#manageEntryExitPoint` REASSIGNS the cluster's one shared
 * `rectangleArea` on every call (`Cluster.java:430`), seeded with the
 * CURRENT rectangle (`:425`). A cluster is called
 *  - once per line projecting to it, in `allLines()` order, while
 *    `DotStringFactory#solve` clips (`SvekEdge.java:660-663`,
 *    `DotStringFactory.java:465-466`);
 *  - once per `drawU` (`Cluster.java:344-345`), and `SvekResult#drawU` runs
 *    twice — through `TextBlockUtils.getMinMax` inside
 *    `SvekResult#calculateDimension` (`SvekResult.java:130-136`: the INK
 *    pass), then for the real render (the DRAWN box) — walking
 *    `allCluster()` in creation order each time (`SvekResult.java:71-74`).
 *
 * So the drawn box is the rectangle after L + 2 calls. `ensureMinWidth` is
 * not idempotent (it shifts by half the previous drift), so the count binds:
 * pesita-10-dene726 `AA` minX 587, 588.5, 589.25, 589.625 (4 lines), then
 * 589.8125 (ink pass), 589.90625 (drawn).
 *
 * This module replays that exact call sequence over {@link ClusterRectangles}
 * — the same shared state `state-transition-clip.ts#clipLinesInSolveOrder`
 * drives for the clip.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java#manageEntryExitPoint (:410-436)
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekResult.java#drawU (:71-74)
 */
import { ClusterRectangles, type RectangleArea } from '../../core/svek/FrontierCalculator.js';
import type { PassAccumulator } from './state-composite-pass-types.js';
import type { ClusterPosMap, PosMap } from './state-composite-geo.js';
import { inSolveOrder, projectionClusterIdOf, projectionSpecsOf, toRectangleArea } from './state-transition-clip.js';

/** One border-point composite's rectangle at the two draw passes. */
export interface DrawnClusterRect {
  /** After its own call inside `calculateDimension`'s `getMinMax` pass. */
  readonly ink: RectangleArea;
  /** After its own call inside the real `drawU`. */
  readonly drawn: RectangleArea;
}

/** The jar's draw passes over a cluster (`SvekResult.java:130-136` + the real
 *  render): `calculateDimension`'s `getMinMax`, then `drawU`. */
const DRAW_PASSES = 2;

const cache = new WeakMap<ClusterPosMap, WeakMap<PassAccumulator, ReadonlyMap<string, DrawnClusterRect>>>();

/** Lines in `Bibliotekon#allLines()` order, reduced to what the rectangle
 *  sequence reads: the projection cluster each one calls
 *  `manageEntryExitPoint` on. */
function solveCallSequence(acc: PassAccumulator): string[] {
  const projectionOf = projectionClusterIdOf(acc);
  const endpoints = new Map(acc.edges.map((e) => [e.id, e] as const));
  const lines = acc.edgeSources.flatMap(({ t, edgeId }) => {
    const e = endpoints.get(edgeId);
    return e === undefined
      ? []
      : [{ from: e.from, to: e.to, ...(t.creationIndex !== undefined ? { creationIndex: t.creationIndex } : {}) }];
  });
  return inSolveOrder(lines).flatMap((line) => projectionOf(line) ?? []);
}

/**
 * Replay of solve + the two draw passes for ONE layout result's border-point
 * composites, keyed by `DotInputCluster.id`. Memoized on the (cluster map,
 * accumulator) pair, as every cluster of a pass shares one replay.
 */
export function drawnClusterRects(
  acc: PassAccumulator,
  posMap: PosMap,
  clusterPosMap: ClusterPosMap,
): ReadonlyMap<string, DrawnClusterRect> {
  const cached = cache.get(clusterPosMap)?.get(acc);
  if (cached !== undefined) return cached;
  const graphviz = new Map([...clusterPosMap].map(([id, b]) => [id, toRectangleArea(b)] as const));
  const rects = new ClusterRectangles(graphviz, projectionSpecsOf(acc, posMap));
  for (const clusterId of solveCallSequence(acc)) rects.manageEntryExitPoint(clusterId);

  const drawOrder = acc.borderPointClusters.map((c) => c.clusterId);
  const ink = new Map<string, RectangleArea>();
  const out = new Map<string, DrawnClusterRect>();
  for (let pass = 1; pass <= DRAW_PASSES; pass++) {
    for (const clusterId of drawOrder) {
      rects.manageEntryExitPoint(clusterId);
      const now = rects.rectangleAreaOf(clusterId);
      if (now === undefined) continue;
      if (pass === 1) ink.set(clusterId, now);
      else out.set(clusterId, { ink: ink.get(clusterId)!, drawn: now });
    }
  }
  const byAcc = cache.get(clusterPosMap) ?? new WeakMap();
  byAcc.set(acc, out);
  cache.set(clusterPosMap, byAcc);
  return out;
}
