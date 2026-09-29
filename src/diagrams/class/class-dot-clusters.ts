/**
 * Class diagram DOT-cluster construction -- split out of ./class-dot-graph.ts
 * (cdd-T22b, pure relocation, no logic change) to keep that file under the
 * repo's 500-line-per-file cap, same split rationale as
 * ./class-dot-width-floors.ts's own move (cdd-T15's doc comment in
 * class-dot-graph.ts). Owns the "which namespaces get a cluster" filter and
 * the `DotInputCluster` builder; node/edge/graph-assembly stays in
 * ./class-dot-graph.ts, which calls both functions back in.
 */

import type { ClassDiagramAST, Namespace } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { DotInputCluster, DotInputNode } from '../../core/graph-layout.js';
import { clusterWrapperLevel } from './class-cluster-levels.js';
import { namespaceTitleTableDims } from './class-namespace-title-table.js';
import { buildClusterHeaderStereo } from './class-cluster-header.js';
import { clusterPortRanks, type ClassPortRank } from './class-entity-port.js';

/**
 * The set of namespace ids that must emit a cluster: any namespace whose
 * subtree contains at least one direct member classifier. A namespace with no
 * direct members is still kept when a descendant has members (it is a real
 * ancestor cluster and its members bubble up in the oracle); a namespace whose
 * entire subtree is empty is dropped — the oracle omits member-less subgraphs
 * (verified against mujopi-30-zadi566: two empty packages produce no cluster).
 */
export function nonEmptyNamespaceIds(ast: ClassDiagramAST): Set<string> {
  const byId = new Map(ast.namespaces.map((n) => [n.id, n] as const));
  const keep = new Set<string>();
  const seen = new Set<string>();
  for (const ns of ast.namespaces) {
    if (ns.classifiers.length === 0) continue;
    let cur: Namespace | undefined = ns;
    while (cur !== undefined && !seen.has(cur.id)) {
      seen.add(cur.id);
      // cdd3-T9 S-1: a packed group prints no subgraph of its own
      // (`ClusterDotString.java:83-88`) -- its child's cluster sits
      // directly in the packed group's parent.
      if (cur.packed !== true) keep.add(cur.id);
      cur = cur.parentId !== undefined ? byId.get(cur.parentId) : undefined;
    }
  }
  return keep;
}

/** The nearest ancestor of `ns` that is NOT packed (cdd3-T9 S-1): the
 *  cluster a packed group's child nests in (`ClusterDotString.java:83-88`
 *  prints the packed group's children in place of its own subgraph). */
function unpackedParentId(ns: Namespace, byId: ReadonlyMap<string, Namespace>): string | undefined {
  let parent = ns.parentId !== undefined ? byId.get(ns.parentId) : undefined;
  while (parent?.packed === true) parent = parent.parentId !== undefined ? byId.get(parent.parentId) : undefined;
  return parent?.id;
}

/**
 * A cluster's direct members in upstream print order: the group's own leaves
 * first, then its muted empty child packages (`collapsedGroup` leaves), each
 * part keeping its relative order. The parse-time collapse
 * (class-namespace.ts#collapseEmptyNamespace) pushes a muted package onto the
 * parent's `classifiers` in SOURCE order; upstream instead prints
 * `printEntities(g.leafs())` then `printGroups(g)`, and `printGroups` mutes an
 * empty PACKAGE and prints it as an entity in child-group order.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:431-433
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:416-418
 */
function clusterMemberPrintOrder(ns: Namespace, ast: ClassDiagramAST): string[] {
  const muted = new Set(ast.classifiers.filter((c) => c.collapsedGroup === true).map((c) => c.id));
  const leafs = ns.classifiers.filter((id) => !muted.has(id));
  const groups = ns.classifiers.filter((id) => muted.has(id));
  return [...leafs, ...groups];
}

/**
 * cdd6-T3d (bonaco-71-xefu608): `ClusterDotString`'s `hasPort()` branch for
 * a cluster whose direct members include PORTIN/PORTOUT leaves.
 * `entityPositionsExceptNormal().size() > 0` forces `protection0`/
 * `protection1` off (java:107-112), so no `innerMarginLevels`; the cluster
 * prints no `label=` of its own (only `labeljust`, java:121-123) -- the
 * title table goes onto the `empty()` anchor instead, declared last inside
 * `ee` (java:177-181), which `printRanks` chains each rank to (java:266-282).
 * The anchor reuses the package-endpoint anchor id when the group is also a
 * link endpoint (`Cluster.getSpecialPointId`, re-declared first, java:148-149),
 * else takes the same `zaent-` id scheme (`class-shield-helpers.ts
 * #packageEndpointAnchors`). Returns the anchor node for the caller to add.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:107-184
 */
function applyPortBranch(
  cluster: DotInputCluster,
  ns: Namespace,
  portRanks: ClassPortRank[],
  anchor: { anchorId: string | undefined; dims: { width: number; height: number } | undefined },
): DotInputNode {
  const portAnchorId = anchor.anchorId ?? `zaent-${ns.id}`;
  delete cluster.innerMarginLevels;
  cluster.portRanks = portRanks;
  cluster.portAnchorId = portAnchorId;
  if (anchor.anchorId === undefined) cluster.nodeIds = [...cluster.nodeIds, portAnchorId];
  if (ns.display.length > 0) cluster.label = ns.display;
  const node: DotInputNode = { id: portAnchorId, width: 1, height: 1, shape: 'rect' };
  if (anchor.dims !== undefined) {
    node.titleLabelWidth = anchor.dims.width;
    node.titleLabelHeight = anchor.dims.height;
  }
  if (anchor.anchorId !== undefined) node.groupAnchorAlsoPoint = true;
  return node;
}

/**
 * Build one `DotInputCluster` per non-empty package/namespace, nesting via
 * `parentId` for dotted/nested names (mirrors the description engine's
 * `buildDotClusters` in ../description/layout.ts). `id` is a synthetic
 * `clusterN` token — NOT `ns.id` — because the comparator's `parseClusters`
 * (tests/oracle/svek-dot.ts:109) only recognizes subgraphs named exactly
 * `^cluster\d+$`; the description engine's `clusterId` generator
 * (`cluster${counter.n++}`, description/layout.ts:108) uses the same scheme.
 * Only direct member classifiers go in `nodeIds`; descendants' members bubble
 * up through the nesting, matching the oracle's cluster-membership counting.
 */
export function buildDotClusters(
  ast: ClassDiagramAST,
  anchors: Map<string, string>,
  theme: Theme,
  measurer: StringMeasurer,
): { clusters: DotInputCluster[]; clusterIdByNs: Map<string, string>; portAnchorNodes: DotInputNode[] } | undefined {
  const keep = nonEmptyNamespaceIds(ast);
  if (keep.size === 0) return undefined;
  const kept = ast.namespaces.filter((ns) => keep.has(ns.id));
  const clusterIdByNs = new Map(kept.map((ns, i) => [ns.id, `cluster${i}`] as const));
  const byId = new Map(ast.namespaces.map((n) => [n.id, n] as const));
  const portAnchorNodes: DotInputNode[] = [];
  const clusters = kept.map((ns, i) => {
    // A package used as a relationship endpoint carries its point anchor as an
    // extra direct member of its own cluster (svek ClusterDotString).
    const anchorId = anchors.get(ns.id);
    const members = clusterMemberPrintOrder(ns, ast);
    const nodeIds = anchorId !== undefined ? [...members, anchorId] : members;
    const cluster: DotInputCluster = { id: `cluster${i}`, nodeIds };
    // T4: `protection0`/`protection1` (ClusterDotString.java:107-115) are
    // unconditional for a non-swimlane, non-`USymbols.NODE` group -- NOT
    // gated on `cluster.isLabel()` (line 122's SEPARATE branch, below) -- so
    // `innerMarginLevels`/`unwrappedNodeId` are set for every kept cluster,
    // independent of whether it carries a title.
    cluster.innerMarginLevels = clusterWrapperLevel(ns.id, ast);
    if (anchorId !== undefined) cluster.unwrappedNodeId = anchorId;
    // cdd2-T19b: `ClusterHeader`'s `dimLabel.getWidth() > 0` gate
    // (`ClusterHeader.java:80`) covers `mergeTB(stereo, title)`, so a header
    // stereo block (displayed stereotype / group legend) counts too.
    const header = buildClusterHeaderStereo(ns, ast, theme, measurer);
    const isLabel = ns.display.length > 0 || header !== undefined;
    const portRanks = clusterPortRanks(members, ast);
    if (portRanks.length > 0) {
      const dims = isLabel ? namespaceTitleTableDims(ns.display, theme, measurer, ns.usymbol, header) : undefined;
      portAnchorNodes.push(applyPortBranch(cluster, ns, portRanks, { anchorId, dims }));
    } else if (isLabel) {
      cluster.label = ns.display;
      // cdd-T12 (A2b E3): `ns.usymbol` feeds `ClusterHeader`'s per-USymbol
      // `suppWidthBecauseOfShape`/`suppHeightBecauseOfShape` supplement
      // (`class-namespace-title-table.ts`) -- a `<<Node>>` package's label
      // table is 60px wider / 5px taller than its bare title text.
      const dims = namespaceTitleTableDims(ns.display, theme, measurer, ns.usymbol, header);
      // Same pair, two consumers (cluster-title-table.ts's own
      // `computeTitleTableHeight` doc comment): `labelWidth`/`labelHeight`
      // feed the DOT-TEXT emitter's `label=<TABLE...>` (svek-dot-emit-
      // clusters.ts#clusterBlock, unconditional whenever both are defined);
      // `titleTableWidth`/`titleTableHeight` feed the LAYOUT builder's real
      // @knowvah/dot-engine reservation (graph-layout-build.ts#addClusters).
      cluster.labelWidth = dims.width;
      cluster.labelHeight = dims.height;
      cluster.titleTableWidth = dims.width;
      cluster.titleTableHeight = dims.height;
    }
    const parentNsId = unpackedParentId(ns, byId);
    const parentClusterId = parentNsId !== undefined ? clusterIdByNs.get(parentNsId) : undefined;
    if (parentClusterId !== undefined) cluster.parentId = parentClusterId;
    return cluster;
  });
  return { clusters, clusterIdByNs, portAnchorNodes };
}
