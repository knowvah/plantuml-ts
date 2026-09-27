/**
 * frontier-cluster-bbox.ts — a port cluster's drawn box, `Cluster
 * #manageEntryExitPoint` (`svek/Cluster.java:410-430`) over
 * `core/svek/FrontierCalculator.ts`:
 *
 *     final Collection<RectangleArea> insides = new ArrayList<>();
 *     final List<XPoint2D> points = new ArrayList<>();
 *     for (SvekNode sh : nodes)
 *         if (isNormalPosition(sh)) insides.add(sh.getRectangleArea());
 *         else points.add(sh.getRectangleArea().getPointCenter());
 *     for (Cluster in : children)
 *         ... insides.add(in.getRectangleArea());
 *     final FrontierCalculator frontierCalculator = new FrontierCalculator(
 *         getRectangleArea(), insides, points, skinParam.getRankdir());
 *     if (getTitleAndAttributeWidth() > 0 && getTitleAndAttributeHeight() > 0)
 *         frontierCalculator.ensureMinWidth(getTitleAndAttributeWidth() + 10);
 *
 * `getRectangleArea()` is the box `DotStringFactory#solve` gave the cluster
 * from graphviz's own cluster polygon (`DotStringFactory.java:432-441` ->
 * `Cluster#setPosition`, `Cluster.java:511-512`) -- here, the layout's
 * `DotLayoutResult.clusters` rect for the same cluster (cdd4-T6b; this used
 * to be approximated by an isolated "shadow" graph).
 *
 * A child cluster contributes its graphviz rect too, not its own adjusted
 * box: `SvekResult#drawU` walks `allCluster()` in creation order, parent
 * first, and `manageEntryExitPoint` runs inside each `Cluster#drawU`
 * (`Cluster.java:344-345`), so a parent reads its children before theirs run.
 */
import type { DescriptionNodeGeo, Bbox } from './layout-helpers.js';
import {
  frontierCalculator,
  ensureMinWidth,
  type RectangleArea,
  type Point,
  type FrontierRankdir,
} from '../../core/svek/FrontierCalculator.js';

export interface PortClusterInfo {
  /** `Cluster#getRectangleArea()` when `manageEntryExitPoint` runs: the
   *  cluster's graphviz rect (`Cluster.java:425`). */
  readonly initial: RectangleArea;
  /** The graphviz rect of every laid-out cluster, keyed by geo id -- what a
   *  child cluster contributes to `insides` (`Cluster.java:419-423`). A
   *  child with no entry here is a leaf, and contributes its own box. */
  readonly clusterRects: ReadonlyMap<string, RectangleArea>;
  /** `Cluster.getTitleAndAttributeWidth()` -- 0 when the cluster has no
   *  title/attribute text (guards the `ensureMinWidth` call below, matching
   *  java:427's `> 0` condition). */
  readonly titleWidth: number;
  readonly titleHeight: number;
}

/** The diagram's rankdir, `skinParam.getRankdir()` (`Cluster.java:426`). */
export interface ClusterSpacing {
  readonly rankdir: FrontierRankdir;
}

function toRect(g: DescriptionNodeGeo): RectangleArea {
  return { minX: g.x, minY: g.y, maxX: g.x + g.width, maxY: g.y + g.height };
}

/** `Cluster.java:413-423`'s split: a NORMAL-position node or a child cluster
 *  is an `inside` (full rect), a port a `point` (its centre). */
function splitInsidesAndPoints(
  children: readonly DescriptionNodeGeo[],
  clusterRects: PortClusterInfo['clusterRects'],
): { insides: RectangleArea[]; points: Point[] } {
  const insides: RectangleArea[] = [];
  const points: Point[] = [];
  for (const c of children) {
    if (c.symbol === 'port') points.push({ x: c.x + c.width / 2, y: c.y + c.height / 2 });
    else insides.push(clusterRects.get(c.id) ?? toRect(c));
  }
  return { insides, points };
}

/** A port cluster's drawn bbox, `Cluster.manageEntryExitPoint`
 *  (`Cluster.java:410-430`) -- see this module's doc comment. */
export function computePortClusterBbox(
  children: readonly DescriptionNodeGeo[],
  info: PortClusterInfo,
  spacing: ClusterSpacing,
): Bbox {
  const { insides, points } = splitInsidesAndPoints(children, info.clusterRects);
  let core = frontierCalculator(info.initial, insides, points, spacing.rankdir);
  if (info.titleWidth > 0 && info.titleHeight > 0) {
    core = ensureMinWidth(core, info.initial, info.titleWidth + 10);
  }
  return { x: core.minX, y: core.minY, width: core.maxX - core.minX, height: core.maxY - core.minY };
}
