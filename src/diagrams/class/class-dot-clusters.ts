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
import type { DotInputCluster } from '../../core/graph-layout.js';
import { clusterWrapperLevel } from './class-cluster-levels.js';
import { namespaceTitleTableDims } from './class-namespace-title-table.js';
import { buildClusterHeaderStereo } from './class-cluster-header.js';

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
  for (const ns of ast.namespaces) {
    if (ns.classifiers.length === 0) continue;
    let cur: Namespace | undefined = ns;
    while (cur !== undefined && !keep.has(cur.id)) {
      keep.add(cur.id);
      cur = cur.parentId !== undefined ? byId.get(cur.parentId) : undefined;
    }
  }
  return keep;
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
): { clusters: DotInputCluster[]; clusterIdByNs: Map<string, string> } | undefined {
  const keep = nonEmptyNamespaceIds(ast);
  if (keep.size === 0) return undefined;
  const kept = ast.namespaces.filter((ns) => keep.has(ns.id));
  const clusterIdByNs = new Map(kept.map((ns, i) => [ns.id, `cluster${i}`] as const));
  const clusters = kept.map((ns, i) => {
    // A package used as a relationship endpoint carries its point anchor as an
    // extra direct member of its own cluster (svek ClusterDotString).
    const anchorId = anchors.get(ns.id);
    const nodeIds = anchorId !== undefined ? [...ns.classifiers, anchorId] : ns.classifiers;
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
    if (ns.display.length > 0 || header !== undefined) {
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
    const parentClusterId = ns.parentId !== undefined ? clusterIdByNs.get(ns.parentId) : undefined;
    if (parentClusterId !== undefined) cluster.parentId = parentClusterId;
    return cluster;
  });
  return { clusters, clusterIdByNs };
}
