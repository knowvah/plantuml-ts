/**
 * The engine's published cluster rects, re-keyed by geo id (`astId`) -- what the geo tree reads for a
 * container's drawn box (`ClusterDecoration.java:78,89-90` draws at exactly the graphviz rect) and what
 * the port-cluster frontier starts from (`Cluster.java:344-345`).
 *
 * Moved out of `layout.ts` (500-line cap) -- `buildPortClusterInfoByAstId` and `clusterRectsByAstId`
 * are a pure move; `clusterBoxesByAstId` is new (codd-T2 M1).
 */
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { RectangleArea } from '../../core/svek/FrontierCalculator.js';
import type { PortClusterInfo } from './frontier-cluster-bbox.js';
import { measureTitleLabel, type Bbox } from './layout-helpers.js';
import type { ClassifyCtx } from './layout-types.js';

/** Builds the `PortClusterInfo` (frontier-cluster-bbox.ts) for every
 *  container with port children -- the clusters `Cluster#drawU` runs
 *  `manageEntryExitPoint` for (`entityPositionsExceptNormal().size() > 0`,
 *  `Cluster.java:344-345`). `initial` is the cluster's own graphviz rect from
 *  THIS layout (`DotStringFactory.java:432-441` -> `Cluster#setPosition`,
 *  `Cluster.java:511-512`), `clusterRects` every cluster's, for child
 *  `insides`; `titleWidth`/`titleHeight` are `measureTitleLabel`'s jar-exact
 *  `getTitleAndAttributeWidth/Height` (`Cluster.java:427-428`). Kermor builds
 *  the same info: `Cluster#drawU` runs `manageEntryExitPoint` whenever the group
 *  has a port, kermor or not (`Cluster.java:344-345`); kermor only skips the port
 *  ANCHOR node (`portAnchorId` stays unset, see `buildDotClusters`). */
export function buildPortClusterInfoByAstId(
  ctx: ClassifyCtx,
  portRanksByCluster: ReadonlyMap<string, { rank: 'source' | 'sink'; nodeIds: string[] }[]>,
  fonts: { fontSpec: FontSpec; measurer: StringMeasurer },
  result: DotLayoutResult,
): Map<string, PortClusterInfo> {
  const out = new Map<string, PortClusterInfo>();
  const clusterRects = clusterRectsByAstId(ctx, result);
  for (const c of ctx.containers) {
    const initial = clusterRects.get(c.astId);
    // No rect -> no `PortClusterInfo`: `buildGeoNode` then draws the engine's own
    // cluster rect for that container.
    if (!portRanksByCluster.has(c.clusterId) || initial === undefined) continue;
    const title = measureTitleLabel(c.display, c.symbol, fonts.fontSpec, fonts.measurer);
    out.set(c.astId, { initial, clusterRects, titleWidth: title.width, titleHeight: title.height });
  }
  return out;
}

/** `DotLayoutResult.clusters` (keyed by `DotInputCluster.id`, the
 *  container's `clusterId`) re-keyed by the geo id (`astId`) as
 *  `RectangleArea`s. */
export function clusterRectsByAstId(ctx: ClassifyCtx, result: DotLayoutResult): Map<string, RectangleArea> {
  const byClusterId = new Map((result.clusters ?? []).map((c) => [c.id, c]));
  const out = new Map<string, RectangleArea>();
  for (const c of ctx.containers) {
    const r = byClusterId.get(c.clusterId);
    if (r !== undefined) out.set(c.astId, { minX: r.x, minY: r.y, maxX: r.x + r.width, maxY: r.y + r.height });
  }
  return out;
}

/**
 * `DotLayoutResult.clusters` re-keyed by the geo id (`astId`) as drawn boxes: `DotStringFactory.java:432-441`
 * hands each cluster the min/max of its graphviz polygon (`Cluster#setPosition`, `Cluster.java:511-512`) and
 * `ClusterDecoration#drawU` draws at that rect (`ClusterDecoration.java:78,89-90`). `x/y/width/height` are the
 * engine's own numbers, NOT recomputed from `maxX - minX`: `USymbolCloud.java:75` seeds
 * `new Random((long) width + 7919L * (long) height)`, and a rounded-off `x + width - x` can truncate to a
 * different `(long)`.
 */
export function clusterBoxesByAstId(ctx: ClassifyCtx, result: DotLayoutResult): Map<string, Bbox> {
  const byClusterId = new Map((result.clusters ?? []).map((c) => [c.id, c]));
  const out = new Map<string, Bbox>();
  for (const c of ctx.containers) {
    const r = byClusterId.get(c.clusterId);
    if (r !== undefined) out.set(c.astId, { x: r.x, y: r.y, width: r.width, height: r.height });
  }
  return out;
}
