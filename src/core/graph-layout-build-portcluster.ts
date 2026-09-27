/**
 * cdd4-T6 (E3-10b): the layout-builder half of `ClusterDotString`'s
 * `hasPort()` branch.
 *
 * That is a cluster whose own children include a genuine PORTIN/PORTOUT port (`DotInputCluster.portRanks` + `portAnchorId`, WITHOUT
 * `portRanksLabelOnEe`; `src/diagrams/description/layout-dot-tree.ts
 * #buildDotClusters`). Split out of ./graph-layout-build.ts for the 500-line
 * file cap, the same way ./graph-layout-build-borderpoint.ts holds the
 * `!hasPort()` border-point family.
 *
 * The Svek-DOT TEXT emitter already writes this shape
 * (`svek-dot-emit-clusters.ts#portClusterBlock`), but the graph handed to
 * @knowvah/dot-engine did not: it kept `label=<title>` on the cluster, had no
 * `ee` subgraph, laid the anchor out as a fixedsize point-sized box, and had
 * none of `printRanks`' chain edges -- so `sokevu-87-toce485`'s node cluster
 * came out 247x227 where the jar's is 261x260.
 *
 * Upstream, `ClusterDotString.printInternal` for this branch (non-kermor,
 * non-packed; `protection0`/`protection1` are forced off at `:109-112`):
 *
 *     sb.append("subgraph " + cluster.getClusterId() + " {");   // :117
 *     ...labeljust only; `label` is kept for later...            // :121-133
 *     printRanks(Cluster.RANK_SOURCE, ...);                      // :136
 *     printRanks(Cluster.RANK_SINK, ...);                        // :137
 *     if (hasPort()) subgraphClusterNoLabel(sb, ID_EE);          // :138-139
 *     ...
 *     cluster.printCluster1(...); cluster.printCluster2(...);   // :174-176
 *     if (hasPort()) {
 *         sb.append(empty() + " [shape=rect,width=.01,height=.01,label=");
 *         sb.append(label);                                      // :178-181
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java
 */

import type { GvGraphBuilder } from '@knowvah/dot-engine';
import type { DotInputCluster, DotInputNode } from './graph-layout.types.js';
import type { ClusterHandles } from './graph-layout-build-borderpoint.js';

/** Sizing-irrelevant BGCOLOR for the layout copy of the anchor's title table
 *  (the jar paints it from its ColorSequence; graphviz never draws it here). */
const LAYOUT_TITLE_BGCOLOR = '#000000';

/** `ClusterDotString#hasPort()` (`:228-234`) as this port models it: the
 *  generic (not border-point) rank family, with the `empty()` anchor that
 *  only the non-kermor path creates (`layout-dot-tree.ts#buildDotClusters`
 *  leaves `portAnchorId` unset under kermor, whose `ClusterDotStringKermor`
 *  has no such branch). */
export function isHasPortCluster(c: DotInputCluster): boolean {
  return c.portRanksLabelOnEe !== true && c.portAnchorId !== undefined && (c.portRanks?.length ?? 0) > 0;
}

/** The anchor's `label` -- `SvekEdge.appendTable(sblabel, w, h - 5, color)`
 *  (`ClusterDotString.java:123-126`, `SvekEdge.java:504-523`), whose `(int)`
 *  casts truncate. `titleLabelHeight` already carries the `- 5`
 *  (`title-label-sizing.ts#measureTitleLabel`). */
function anchorTitleTable(width: number, height: number): string {
  return (
    `<TABLE BGCOLOR="${LAYOUT_TITLE_BGCOLOR}" FIXEDSIZE="TRUE" WIDTH="${Math.trunc(width)}" ` +
    `HEIGHT="${Math.trunc(height)}"><TR><TD></TD></TR></TABLE>`
  );
}

/** `ClusterDotString.java:178-181`: `empty() [shape=rect,width=.01,
 *  height=.01,label=<title table>]` -- no `fixedsize`, so graphviz grows the
 *  node to the table plus its padding. The plain `shape=point` declaration
 *  `:149` writes first when the group is also an edge end
 *  (`groupAnchorAlsoPoint`) is overridden attribute-for-attribute by this
 *  redeclaration in the same `ee` scope, so the engine only needs this one. */
export function addTitledAnchorNode(b: GvGraphBuilder, n: DotInputNode): void {
  b.addNode(n.id, { shape: 'rect', width: '.01', height: '.01' }).setHtmlAttr(
    'label',
    anchorTitleTable(n.titleLabelWidth!, n.titleLabelHeight!),
  );
}

/** One `printRanks` call (`ClusterDotString.java:254-287`): the
 *  `{rank=X;…}` group (a bare, non-`cluster`-prefixed subgraph -- issue 08),
 *  each entry declared in the cluster (`:263-264`), then the `hasPort()`
 *  chain (`:267-284`):
 *
 *      for (SvekNode sh : entries) { if (arrow) sb.append("->"); ... }
 *      if (arrow) sb.append(" [arrowhead=none]");
 *      ...
 *      sb.append(node + "->" + empty() + ";");
 *
 *  A single-entry rank writes `A [arrowhead=none];` -- a NODE statement, no
 *  edge -- so only consecutive pairs become `arrowhead=none` edges; the
 *  last entry's link to the anchor is bare. */
function printRanks(
  main: GvGraphBuilder,
  rank: { rank: 'source' | 'sink'; nodeIds: readonly string[] },
  subName: string,
  anchorId: string,
): void {
  if (rank.nodeIds.length === 0) return;
  const rankSub = main.addSubgraph(subName, { rank: rank.rank });
  for (const id of rank.nodeIds) {
    rankSub.addNode(id);
    main.addNode(id);
  }
  for (let i = 1; i < rank.nodeIds.length; i++) {
    main.addEdge(rank.nodeIds[i - 1]!, rank.nodeIds[i]!, { arrowhead: 'none' });
  }
  main.addEdge(rank.nodeIds[rank.nodeIds.length - 1]!, anchorId);
}

/**
 * Builds one `hasPort()` cluster and returns `{ main, innermost: ee }`.
 * `main` carries NO `label` (`:121-133` keeps it for the anchor, `:135-141`
 * never writes it on the cluster); `ee` is `subgraphClusterNoLabel`
 * (`:245-252`, `label=""`), inside which `printCluster1`/`printCluster2`
 * place the non-port members and every child cluster (`:174-176`).
 * `nextRankSubId` is `addClusters`' shared `__portrank_N` counter.
 */
export function buildHasPortClusterHandles(
  c: DotInputCluster,
  outerName: string,
  parentInnermost: GvGraphBuilder,
  nextRankSubId: () => number,
): ClusterHandles {
  const main = parentInnermost.addSubgraph(outerName, {});
  // `isHasPortCluster` guarantees `portRanks`/`portAnchorId` here.
  for (const pr of c.portRanks!) printRanks(main, pr, `__portrank_${nextRankSubId()}`, c.portAnchorId!);
  const ee = main.addSubgraph(`${outerName}ee`, {});
  return { main, innermost: ee };
}

/** Where `addClusters` declares a `hasPort()` cluster's direct members: every
 *  port in `main` (`printRanks` already did the ranked ones; an unranked port
 *  follows the text emitter's `unrankedPortLines`), everything else -- the
 *  anchor and any NORMAL member -- in `ee` (`printCluster1`, `:174`). */
export function placeHasPortMembers(c: DotInputCluster, handles: ClusterHandles, portIds: ReadonlySet<string>): void {
  const ranked = new Set(c.portRanks!.flatMap((r) => r.nodeIds));
  for (const id of c.nodeIds) {
    if (ranked.has(id)) continue;
    (portIds.has(id) ? handles.main : handles.innermost).addNode(id);
  }
}
