/**
 * The engine's published cluster rects, re-keyed by geo id (`astId`) -- what the geo tree reads for a
 * container's drawn box (`ClusterDecoration.java:78,89-90` draws at exactly the graphviz rect) and what
 * the port-cluster frontier starts from (`Cluster.java:344-345`).
 *
 * Moved out of `layout.ts` (500-line cap) -- `buildPortClusterInfoByAstId` and `clusterRectsByAstId`
 * are a pure move; `clusterBoxesByAstId` is new (codd-T2 M1).
 */
import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { RectangleArea } from '../../core/svek/FrontierCalculator.js';
import type { PortClusterInfo } from './frontier-cluster-bbox.js';
import { type Bbox, type DescriptionNodeGeo, type KermorNotesGeo } from './layout-helpers.js';
import { kermorNoteClusterId, type KermorNoteSlot } from '../../core/graph-layout-build-kermor.js';
import type { ClassifyCtx } from './layout-types.js';
import type { ClusterTitleDims } from './layout-dot-tree.js';

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
  titleDimsByClusterId: ReadonlyMap<string, ClusterTitleDims | undefined>,
  result: DotLayoutResult,
): Map<string, PortClusterInfo> {
  const out = new Map<string, PortClusterInfo>();
  const clusterRects = clusterRectsByAstId(ctx, result);
  for (const c of ctx.containers) {
    const initial = clusterRects.get(c.astId);
    // No rect -> no `PortClusterInfo`: `buildGeoNode` then draws the engine's own
    // cluster rect for that container.
    if (!portRanksByCluster.has(c.clusterId) || initial === undefined) continue;
    // `Cluster.java:427-428` `getTitleAndAttributeWidth()`: the SAME D5 dims the cluster's DOT label table prints
    // (`ClusterHeader.java:79-92`, a title block of the group's wrapped lines in the group's own bold font), not the
    // raw display measured as one plain line. No label -> 0/0 (`Cluster.java:671-673`).
    const title = titleDimsByClusterId.get(c.clusterId) ?? { width: 0, height: 0 };
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

/** One slot's note: the min corner of its placed label table (`DotStringFactory.java:454,460`,
 *  `SvekUtils.getMinXY` over the table polygon; `label` is the table's centre). */
function kermorNoteAt(
  byClusterId: ReadonlyMap<string, NonNullable<DotLayoutResult['clusters']>[number]>,
  clusterId: string,
  slot: KermorNoteSlot,
  text: string | undefined,
): { text: string; x: number; y: number } | undefined {
  const label = byClusterId.get(kermorNoteClusterId(clusterId, slot))?.label;
  if (text === undefined || label === undefined) return undefined;
  return { text, x: label.x - label.width / 2, y: label.y - label.height / 2 };
}

/**
 * The kermor TOP/BOTTOM group notes, keyed by geo id (`astId`). `DotStringFactory.java:438-440` `continue`s past a
 * cluster whose title table is empty BEFORE it reads the note positions (`:442-461`), so a group the engine gave no
 * title label gets no note; the position comes from the alpha (TOP) / beta (BOTTOM) label table.
 */
export function kermorNotesByAstId(ctx: ClassifyCtx, result: DotLayoutResult): Map<string, KermorNotesGeo> {
  const byClusterId = new Map((result.clusters ?? []).map((c) => [c.id, c]));
  const out = new Map<string, KermorNotesGeo>();
  for (const c of ctx.containers) {
    if (c.kermorNotes === undefined || byClusterId.get(c.clusterId)?.label === undefined) continue;
    const top = kermorNoteAt(byClusterId, c.clusterId, 'top', c.kermorNotes.top);
    const bottom = kermorNoteAt(byClusterId, c.clusterId, 'bottom', c.kermorNotes.bottom);
    if (top !== undefined || bottom !== undefined) {
      out.set(c.astId, { ...(top === undefined ? {} : { top }), ...(bottom === undefined ? {} : { bottom }) });
    }
  }
  return out;
}

/** The geo tree with each cluster's note positions attached (pure; unchanged nodes are returned as-is). */
export function withKermorNotes(
  nodes: readonly DescriptionNodeGeo[],
  notes: ReadonlyMap<string, KermorNotesGeo>,
): DescriptionNodeGeo[] {
  if (notes.size === 0) return [...nodes];
  return nodes.map((n) => {
    const own = notes.get(n.id);
    return { ...n, ...(own === undefined ? {} : { kermorNotes: own }), children: withKermorNotes(n.children, notes) };
  });
}
