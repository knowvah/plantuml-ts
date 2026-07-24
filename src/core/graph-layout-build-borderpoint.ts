/**
 * G7 T14b border-point (`<<entrypoint>>`/`<<exitpoint>>`-child,
 * `portRanksLabelOnEe`) cluster nesting — split out of
 * ./graph-layout-build.ts#addClusters (500-line file-cap compliance; pure
 * extraction, no behavior change). Ports jar's `ClusterDotString`'s
 * structurally-different shape for a composite whose
 * `entityPositionsExceptNormal.size() > 0` (protection0/protection1 forced
 * off, `ClusterDotString.java:91-116` — MUTUALLY EXCLUSIVE with the plain-
 * cluster a/p0/main/i/p1 nesting `addClusters`'s own `handlesFor` builds for
 * every OTHER cluster): `${outerName}a` (ancestor wrap ONLY, never a `p0`
 * sibling), `main` (rank groups + port node lines, never a `label` attr),
 * `${outerName}ee` (the title-table HTML label), `${outerName}i` (the SAME
 * `borderPointAncestorWrap` boolean that gates `a`, wrapping `ee`'s own
 * non-port content — `ClusterDotString.java:151-152`).
 *
 * SUPERSEDES G8/T1b's own rank-constraint-only wiring for THIS specific case
 * (a bare `__portrank_N` subgraph directly under `main`, no `ee`/`i` wrapper
 * or title-table reservation) — that mechanism stays exactly as-is in
 * `graph-layout-build.ts#addClusters`'s own plain-cluster branch, for
 * genuine PORTIN/PORTOUT ports (`c.portRanks` set WITHOUT
 * `portRanksLabelOnEe`, `src/diagrams/description/layout-dot-tree.ts
 * #buildDotClusters`), which this function does not touch.
 *
 * @see ~/git/plantuml/.../svek/ClusterDotString.java:91-201,254-287
 * @see ~/git/plantuml/.../svek/Cluster.java (RANK_SOURCE/RANK_SINK)
 * @see plans/g6-cluster-geometry/batch-4/withlabel-derivation.md §2c/§5
 */

import type { GvGraphBuilder } from '@knowvah/dot-engine';
import type { DotInputCluster } from './graph-layout.types.js';

/** The two @knowvah/dot-engine subgraph handles a border-point `DotInputCluster`
 *  resolves to — see `graph-layout-build.ts`'s own (non-border-point)
 *  `ClusterHandles` for the general shape this mirrors. `main` is the real
 *  `cluster<N>` subgraph (rank groups + port node lines only, no title
 *  table); `innermost` is `${outerName}i` when `borderPointAncestorWrap` is
 *  set, else `${outerName}ee` directly. */
export interface ClusterHandles {
  main: GvGraphBuilder;
  innermost: GvGraphBuilder;
}

/**
 * Builds one border-point cluster's full nesting and returns its
 * `{ main, innermost }` handles. `nextRankSubId` is the caller's shared
 * `__rank_${outerName}_N` counter (kept in `addClusters`'s own closure so
 * numbering is stable across every cluster in one `input.clusters` pass,
 * independent of the GENERIC `__portrank_N` counter the plain-cluster branch
 * uses for non-`portRanksLabelOnEe` ports).
 */
export function buildBorderPointClusterHandles(
  c: DotInputCluster,
  outerName: string,
  parentInnermost: GvGraphBuilder,
  nextRankSubId: () => number,
): ClusterHandles {
  // "a" only, never "p0" -- `ClusterDotString.java:91-116`: `protection0()`
  // is forced false whenever `entityPositionsExceptNormal.size() > 0` (this
  // cluster IS one), so only the outer ancestor-link wrap ("a",
  // `thereALinkFromOrToGroup1`) can ever fire here, gated by the SAME
  // `borderPointAncestorWrap` boolean the inner "i" wrap below also uses.
  let host = parentInnermost;
  if (c.borderPointAncestorWrap === true) host = host.addSubgraph(`${outerName}a`, {});
  // `main` never carries a `label` attr (plain-text OR HTML) for this
  // family -- jar's `cluster15`/`cluster6` never do; the title table moves
  // onto `ee` below instead.
  const main = host.addSubgraph(outerName, {});
  // `ClusterDotString.printRanks` (`Cluster.RANK_SOURCE`/`RANK_SINK`,
  // `ClusterDotString.java:136-137,254-287`): each rank group is a bare
  // (non-"cluster"-prefixed, issue-08) anonymous subgraph, a DIRECT child of
  // `main`, sibling to `ee` -- both the rank subgraph AND `main` itself get
  // an explicit `addNode` for each port id (mirrors jar's separately-
  // emitted node shape line, `ClusterDotString.java:263-264`).
  for (const pr of c.portRanks ?? []) {
    const rankSub = main.addSubgraph(`__rank_${outerName}_${nextRankSubId()}`, { rank: pr.rank });
    for (const id of pr.nodeIds) {
      rankSub.addNode(id);
      main.addNode(id);
    }
  }
  const ee = main.addSubgraph(`${outerName}ee`, {});
  // G8 T1c precedent (`addClusters`'s own `hasTitleTable` seam, unmodified)
  // -- same FIXEDSIZE HTML-table mechanism, same `Math.floor` truncation
  // rule, attached to `ee` instead of `main` (this family's title table
  // lives on the "ee" subgraph, never the outer cluster).
  if (c.titleTableWidth !== undefined && c.titleTableHeight !== undefined) {
    ee.setHtmlAttr(
      'label',
      `<TABLE FIXEDSIZE="TRUE" WIDTH="${Math.floor(c.titleTableWidth)}" ` +
        `HEIGHT="${Math.floor(c.titleTableHeight)}"><TR><TD></TD></TR></TABLE>`,
    );
  }
  // `${outerName}i` (`ClusterDotString.java:151-152`) -- SAME boolean as the
  // outer "a" wrap above (`thereALinkFromOrToGroup1`); wraps `ee`'s own
  // non-port content (the anchor point + any real non-border member or
  // nested child cluster) from the INSIDE.
  const innermost = c.borderPointAncestorWrap === true ? ee.addSubgraph(`${outerName}i`, {}) : ee;
  return { main, innermost };
}
