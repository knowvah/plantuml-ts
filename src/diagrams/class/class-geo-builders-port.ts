/**
 * class-geo-builders-port.ts -- the port-leaf branch of `buildNamespaceGeos`
 * (cdd7-T2a, bonaco-71-xefu608, D4), split out of `class-geo-builders.ts`
 * (at its 500-line cap).
 *
 * Two upstream steps, both run while `SvekResult#drawU` walks the clusters
 * (every cluster BEFORE any node, `SvekResult.java:72-87`):
 *
 * 1. `Cluster#drawU` -> `manageEntryExitPoint` whenever the cluster's own
 *    nodes carry a non-NORMAL `EntityPosition` (`Cluster.java:344-345`):
 *    `FrontierCalculator` recomputes the cluster rectangle from its NORMAL
 *    members' rectangles (`insides`), its child clusters' rectangles, and
 *    the CENTRE points of its port nodes, so the drawn border passes
 *    through every port centre (`Cluster.java:410-430`). Nothing moves the
 *    port node itself -- dot already ranked it `source`/`sink`; it is the
 *    cluster border that is redrawn onto the port.
 * 2. `EntityImagePort#upPosition` (`EntityImagePort.java:75-81`), read by
 *    the node draw that follows: the label goes above the symbol when the
 *    node's `minY` is above the parent cluster's (post-frontier) centre.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:344-345,410-436
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/FrontierCalculator.java
 */
import type { ClassDiagramAST } from './ast.js';
import type { ClassifierGeo, NamespaceGeo } from './class-geo-types.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { LeafSymbolInk } from '../../core/svek/image/leaf-sizing-entity.js';
import { frontierCalculator, ensureMinWidth, type RectangleArea } from '../../core/svek/FrontierCalculator.js';
import { resolveElementMinimumWidth } from '../../core/theme.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { LimitFinder } from '../../core/klimt/drawing/LimitFinder.js';
import { entityPortRank } from './class-entity-port.js';
import { buildEntityImagePort } from './renderer-entity-port.js';
import { buildClusterHeaderStereo } from './class-cluster-header.js';
import { namespaceTitleTableDimsFor } from './class-namespace-title-table.js';

/** An axis-aligned box in the layout frame (`DotLayoutResult` clusters,
 *  `ClassifierGeo`). */
export interface PortBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** `IEntityImage.MARGIN` -- `ensureMinWidth(getTitleAndAttributeWidth() + 10)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:427-428 */
const TITLE_MIN_WIDTH_MARGIN = 10;

/** `ClusterHeader`'s title table height is emitted as `HEIGHT = TAH - 5`
 *  (`core/cluster-title-table.ts#computeTitleTableHeight`); add it back. */
const TITLE_TABLE_HEIGHT_OFFSET = 5;

/** The `USymbols.PACKAGE` default of `Cluster#getStyle` (`Cluster.java:390-391`). */
const DEFAULT_CLUSTER_SNAME = 'package';

function toRect(b: PortBox): RectangleArea {
  return { minX: b.x, minY: b.y, maxX: b.x + b.width, maxY: b.y + b.height };
}

function fromRect(r: RectangleArea): PortBox {
  return { x: r.minX, y: r.minY, width: r.maxX - r.minX, height: r.maxY - r.minY };
}

/** `FrontierCalculator`'s inputs for one cluster, in the layout frame. */
export interface PortFrontierInput {
  /** The graphviz cluster box (`Cluster#setPosition`, the `initial`). */
  readonly box: PortBox;
  /** The cluster's DIRECT member leaves (`Cluster.nodes`). */
  readonly members: readonly ClassifierGeo[];
  /** The direct child clusters' current rectangles (`Cluster.children`). */
  readonly childBoxes: readonly PortBox[];
  readonly rankdir: 'TB' | 'LR';
  /** `getTitleAndAttributeWidth()`, or 0 when the height term is 0. */
  readonly titleAndAttributeWidth: number;
}

/**
 * `Cluster#manageEntryExitPoint`'s rectangle (`Cluster.java:410-430`), or
 * `undefined` when no member is a port (`entityPositionsExceptNormal()`
 * empty -- the call is skipped, `:344`).
 */
export function portFrontierBox(input: PortFrontierInput): PortBox | undefined {
  const ports = input.members.filter((m) => entityPortRank(m) !== undefined);
  if (ports.length === 0) return undefined;
  const insides = [
    ...input.members.filter((m) => entityPortRank(m) === undefined).map(toRect),
    ...input.childBoxes.map(toRect),
  ];
  // `sh.getRectangleArea().getPointCenter()` (`:417`).
  const points = ports.map((p) => ({ x: p.x + p.width / 2, y: p.y + p.height / 2 }));
  const initial = toRect(input.box);
  let core = frontierCalculator(initial, insides, points, input.rankdir);
  if (input.titleAndAttributeWidth > 0) {
    core = ensureMinWidth(core, initial, input.titleAndAttributeWidth + TITLE_MIN_WIDTH_MARGIN);
  }
  return fromRect(core);
}

/**
 * `Cluster#getTitleAndAttributeWidth()` gated on `getTitleAndAttributeHeight()
 * > 0` (`Cluster.java:261-268,427`): `ClusterHeader`'s `(int)` title width
 * (`ClusterHeader.java:92`), floored by the cluster style's `MinimumWidth`.
 * The height is non-zero exactly when the header has a label
 * (`ClusterHeader.java:83`), which is `class-dot-clusters.ts`'s `isLabel`.
 */
export function clusterTitleAndAttributeWidth(
  ns: ClassDiagramAST['namespaces'][number],
  ast: ClassDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): number {
  const header = buildClusterHeaderStereo(ns, ast, theme, measurer);
  if (ns.display.length === 0 && header === undefined) return 0;
  const dims = namespaceTitleTableDimsFor(ns, theme, measurer, header);
  if (dims.height + TITLE_TABLE_HEIGHT_OFFSET <= 0) return 0;
  const minimumWidth = resolveElementMinimumWidth(theme, ns.usymbol ?? DEFAULT_CLUSTER_SNAME) ?? 0;
  return Math.max(Math.trunc(dims.width), Math.ceil(minimumWidth));
}

/** Every namespace's graphviz cluster box (`Cluster#setPosition`,
 *  `Cluster.java:511-512`), keyed by namespace id via `clusterIdByNs`;
 *  `buildNamespaceGeos` overwrites entries as frontiers are applied. */
export function graphvizClusterBoxes<B extends PortBox & { readonly id: string }>(
  ast: ClassDiagramAST,
  clusters: readonly B[],
  clusterIdByNs: ReadonlyMap<string, string>,
): Map<string, B> {
  const clusterById = new Map(clusters.map((c) => [c.id, c] as const));
  const boxes = new Map<string, B>();
  for (const ns of ast.namespaces) {
    const clusterId = clusterIdByNs.get(ns.id);
    const box = clusterId === undefined ? undefined : clusterById.get(clusterId);
    if (box !== undefined) boxes.set(ns.id, box);
  }
  return boxes;
}

/** {@link clusterFrontierBox}'s context: `boxes` holds every cluster's
 *  CURRENT rectangle -- graphviz's, or the frontier once a cluster earlier in
 *  `allCluster()` order has been processed (`SvekResult.java:72-74`). */
export interface ClusterFrontierCtx {
  readonly ast: ClassDiagramAST;
  readonly boxes: ReadonlyMap<string, PortBox>;
  readonly leaves: readonly ClassifierGeo[];
  readonly theme: Theme;
  readonly measurer: StringMeasurer;
}

/** One namespace's drawn box: `box` unchanged unless a direct member is a
 *  port, in which case `manageEntryExitPoint`'s frontier replaces it. */
export function clusterFrontierBox<B extends PortBox>(
  ns: ClassDiagramAST['namespaces'][number],
  box: B,
  ctx: ClusterFrontierCtx,
): B {
  const memberIds = new Set(ns.classifiers);
  const members = ctx.leaves.filter((l) => memberIds.has(l.id));
  if (!members.some((m) => entityPortRank(m) !== undefined)) return box;
  const childBoxes = ctx.ast.namespaces
    .filter((c) => c.parentId === ns.id)
    .flatMap((c) => {
      const child = ctx.boxes.get(c.id);
      return child === undefined ? [] : [child];
    });
  const frontier = portFrontierBox({
    box,
    members,
    childBoxes,
    rankdir: ctx.ast.rankdir ?? 'TB',
    titleAndAttributeWidth: clusterTitleAndAttributeWidth(ns, ctx.ast, ctx.theme, ctx.measurer),
  });
  return frontier === undefined ? box : { ...box, ...frontier };
}

/** `EntityImagePort#upPosition` (`EntityImagePort.java:75-81`): `false`
 *  without a parent cluster, else `node.getMinY() < clusterCenter.getY()`. */
export function entityPortUpPosition(port: PortBox, parent: PortBox | undefined): boolean {
  if (parent === undefined) return false;
  return port.y < parent.y + parent.height / 2;
}

/** The port image's own `LimitFinder` extent, relative to the node origin --
 *  what `SvekResult#calculateDimension`'s walk sees for it
 *  (`SvekResult.java:130-135`). */
export function entityPortSymbolInk(leaf: ClassifierGeo, theme: Theme, measurer: StringMeasurer): LeafSymbolInk {
  const finder = LimitFinder.create(new MeasurerStringBounder(measurer), false);
  buildEntityImagePort(leaf, theme, 1, '').drawU(finder);
  return { minX: finder.getMinX(), minY: finder.getMinY(), maxX: finder.getMaxX(), maxY: finder.getMaxY() };
}

/**
 * Stamp `entityPortUp` and `symbolInk` on every port leaf, once every
 * namespace box is final. Mutates `leaves` in place: they are the freshly
 * built `buildClassifierGeos` result, and upstream likewise decides
 * `upPosition` at draw time off the already-mutated cluster rectangle.
 */
export function stampEntityPortLeaves(
  ast: ClassDiagramAST,
  leaves: readonly ClassifierGeo[],
  namespaces: readonly NamespaceGeo[],
  ctx: { readonly theme: Theme; readonly measurer: StringMeasurer },
): void {
  const geoById = new Map(namespaces.map((n) => [n.id, n] as const));
  const parentByLeaf = new Map<string, NamespaceGeo>();
  for (const ns of ast.namespaces) {
    const geo = geoById.get(ns.id);
    if (geo !== undefined) for (const id of ns.classifiers) parentByLeaf.set(id, geo);
  }
  for (const leaf of leaves) {
    if (entityPortRank(leaf) === undefined) continue;
    leaf.entityPortUp = entityPortUpPosition(leaf, parentByLeaf.get(leaf.id));
    leaf.symbolInk = entityPortSymbolInk(leaf, ctx.theme, ctx.measurer);
  }
}
