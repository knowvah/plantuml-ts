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
  ClusterRectangles,
  entryExitPointRect,
  projectionClusterOf,
  type RectangleArea,
  type Point,
  type FrontierRankdir,
  type ProjectionClusterSpec,
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

/** `Cluster.java:413-423`'s split into `ProjectionClusterSpec`'s terms: a
 *  port is a `point` (its centre), a child cluster (one with a graphviz rect)
 *  a `childId`, anything else a NORMAL-position node and so an `inside`. */
function projectionSpecOf(
  id: string,
  children: readonly DescriptionNodeGeo[],
  info: PortClusterInfo,
  spacing: ClusterSpacing,
): ProjectionClusterSpec {
  const insides: RectangleArea[] = [];
  const points: Point[] = [];
  const childIds: string[] = [];
  for (const c of children) {
    if (c.symbol === 'port') points.push({ x: c.x + c.width / 2, y: c.y + c.height / 2 });
    else if (info.clusterRects.has(c.id)) childIds.push(c.id);
    else insides.push(toRect(c));
  }
  return {
    id,
    insides,
    points,
    childIds,
    rankdir: spacing.rankdir,
    titleAndAttributeWidth: info.titleWidth,
    titleAndAttributeHeight: info.titleHeight,
  };
}

const toBbox = (r: RectangleArea): Bbox => ({ x: r.minX, y: r.minY, width: r.maxX - r.minX, height: r.maxY - r.minY });

/** A port cluster's drawn bbox, `Cluster.manageEntryExitPoint`
 *  (`Cluster.java:410-430`) -- see this module's doc comment. */
export function computePortClusterBbox(
  children: readonly DescriptionNodeGeo[],
  info: PortClusterInfo,
  spacing: ClusterSpacing,
): Bbox {
  const spec = projectionSpecOf('', children, info, spacing);
  return toBbox(entryExitPointRect(spec, info.initial, (id) => info.clusterRects.get(id)));
}

// ---------------------------------------------------------------------------
// The edge loop's view of the same clusters (lgm T1b)
// ---------------------------------------------------------------------------

interface PortClusterEntry {
  readonly info: PortClusterInfo;
  readonly spacing: ClusterSpacing;
  /** Position in `ClusterDotString#printInternal`'s print order. */
  readonly printIndex: number;
}

/**
 * Port-cluster inputs, keyed by the geo `buildGeoNode` built for the
 * container. The geo tree is the only structure both `buildGeoTree` (which
 * holds the layout result's cluster rects) and `buildEdgeGeos` (which clips)
 * see; this carries the former's inputs to the latter without widening
 * `DescriptionNodeGeo`, which is drawn data. A `WeakMap`, so a geo tree that
 * is dropped takes its entries with it.
 */
const portClusters = new WeakMap<DescriptionNodeGeo, PortClusterEntry>();

/** Records that `geo` is a port cluster (`entityPositionsExceptNormal()` non-
 *  empty) whose `manageEntryExitPoint` inputs are `info`. */
export function registerPortCluster(
  geo: DescriptionNodeGeo,
  info: PortClusterInfo,
  spacing: ClusterSpacing,
  printIndex: number,
): void {
  portClusters.set(geo, { info, spacing, printIndex });
}

/**
 * `DotStringFactory#solve`'s edge loop (`DotStringFactory.java:465-466`) over a
 * description geo tree: the shared `Cluster.rectangleArea` state, and the
 * `projectionCluster` choice, for lines that arrive in `allLines()` order.
 * Build one per pass over the edges — the mutation must restart for every
 * pass, as the jar's does for every layout.
 */
export class DescriptionSolveRects {
  private readonly rects: ClusterRectangles;
  private readonly entries = new Map<string, PortClusterEntry>();
  private readonly printOrder: readonly string[];

  constructor(geoIndex: ReadonlyMap<string, DescriptionNodeGeo>) {
    const specs = new Map<string, ProjectionClusterSpec>();
    let graphviz: ReadonlyMap<string, RectangleArea> = new Map();
    for (const geo of geoIndex.values()) {
      const entry = portClusters.get(geo);
      if (entry === undefined) continue;
      graphviz = entry.info.clusterRects;
      this.entries.set(geo.id, entry);
      specs.set(geo.id, projectionSpecOf(geo.id, geo.children, entry.info, entry.spacing));
    }
    this.rects = new ClusterRectangles(graphviz, specs);
    this.printOrder = [...this.entries].sort(([, a], [, b]) => a.printIndex - b.printIndex).map(([id]) => id);
  }

  get isEmpty(): boolean {
    return this.entries.size === 0;
  }

  /** The `SvekEdge#projectionCluster` call that precedes the clip
   *  (`SvekEdge.java:660-663`) for a line touching `groups`. */
  manageEntryExitPoint(groups: readonly (DescriptionNodeGeo | undefined)[]): void {
    const touched = new Set(groups.flatMap((g) => (g !== undefined && this.entries.has(g.id) ? [g.id] : [])));
    const projection = projectionClusterOf(touched, this.printOrder);
    if (projection !== undefined) this.rects.manageEntryExitPoint(projection);
  }

  /** `lhead`/`ltail.getRectangleArea()` for a port cluster, as it stands now;
   *  `undefined` for a container with no port children. */
  rectangleAreaOf(geo: DescriptionNodeGeo): Bbox | undefined {
    const r = this.entries.has(geo.id) ? this.rects.rectangleAreaOf(geo.id) : undefined;
    return r === undefined ? undefined : toBbox(r);
  }
}
