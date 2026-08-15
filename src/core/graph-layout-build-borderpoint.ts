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

/** The empty FIXEDSIZE reservation jar hands graphviz for a cluster title —
 *  `SvekEdge#appendTable`'s `(int)` casts are the `Math.floor` (G8 T1c's
 *  jar-verified truncation rule, shared by `addClusters`'s own seam). */
function titleTable(width: number, height: number): string {
  return (
    `<TABLE FIXEDSIZE="TRUE" WIDTH="${Math.floor(width)}" ` +
    `HEIGHT="${Math.floor(height)}"><TR><TD></TD></TR></TABLE>`
  );
}

/**
 * G9/T6: the label a nested cluster INHERITS from `parent`, or undefined.
 *
 * Jar builds its graph as DOT TEXT, where an attribute set on a subgraph
 * applies to every subgraph declared inside it afterwards. `ClusterDotString`
 * writes `label=` on `<parent>ee` (`:135-141`) and only then recurses into the
 * children (`Cluster.java:580`), so each child `cluster<N>` — which never
 * writes a `label` of its own on this branch (`:117-133` emits only `style`,
 * `color` and `labeljust` when the title moved to `ee`) — silently inherits
 * the parent's title table. Graphviz then reserves a label band at the top of
 * that child's box, which widens the rank gap between the last rank inside
 * `<parent>ee` and the child's own border-point ranks.
 *
 * This builder has no textual scope to inherit through, so the band was
 * missing and every nested composite came out short. Verified directly:
 * blanking ONLY `cluster0ee`'s label in `temuxi-28-cega322`'s DOT strips `lp`
 * from all three children in real graphviz and reproduces our own 62.5px gap
 * where jar has 89px; restoring it here makes the engine's cluster boxes
 * identical to graphviz's on the same graph.
 *
 * Two scopes BLOCK the inheritance, and both are honored by returning
 * undefined: a `borderPointAncestorWrap` parent puts an `${id}i` wrapper
 * around `ee`'s content, and every wrapper is written `label=""` (`:245-252`),
 * which overrides rather than passes through; and a plain-family parent always
 * writes a `label` of its own (a table or `""`) on the cluster its children
 * nest inside, so nothing of the grandparent's survives either.
 */
export function inheritedEeLabel(parent: DotInputCluster | undefined): string | undefined {
  if (parent?.portRanksLabelOnEe !== true || parent.borderPointAncestorWrap === true) return undefined;
  if (parent.titleTableWidth === undefined || parent.titleTableHeight === undefined) return undefined;
  return titleTable(parent.titleTableWidth, parent.titleTableHeight);
}

/**
 * Builds one border-point cluster's full nesting and returns its
 * `{ main, innermost }` handles. `nextRankSubId` is the caller's shared
 * `__rank_${outerName}_N` counter (kept in `addClusters`'s own closure so
 * numbering is stable across every cluster in one `input.clusters` pass,
 * independent of the GENERIC `__portrank_N` counter the plain-cluster branch
 * uses for non-`portRanksLabelOnEe` ports). `inheritedLabel` is
 * {@link inheritedEeLabel} for this cluster's parent.
 */
export function buildBorderPointClusterHandles(
  c: DotInputCluster,
  outerName: string,
  parentInnermost: GvGraphBuilder,
  nextRankSubId: () => number,
  inheritedLabel: string | undefined,
): ClusterHandles {
  // "a" only, never "p0" -- `ClusterDotString.java:91-116`: `protection0()`
  // is forced false whenever `entityPositionsExceptNormal.size() > 0` (this
  // cluster IS one), so only the outer ancestor-link wrap ("a",
  // `thereALinkFromOrToGroup1`) can ever fire here, gated by the SAME
  // `borderPointAncestorWrap` boolean the inner "i" wrap below also uses.
  let host = parentInnermost;
  if (c.borderPointAncestorWrap === true) host = host.addSubgraph(`${outerName}a`, {});
  // `main` never carries a `label` attr OF ITS OWN for this family -- jar's
  // `cluster15`/`cluster6` never write one; the title table moves onto `ee`
  // below instead. G9/T6: which is exactly why it takes the one its enclosing
  // `<parent>ee` leaks to it in jar's DOT text (see `inheritedEeLabel`).
  const main = host.addSubgraph(outerName, {});
  if (inheritedLabel !== undefined) main.setHtmlAttr('label', inheritedLabel);
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
    ee.setHtmlAttr('label', titleTable(c.titleTableWidth, c.titleTableHeight));
  }
  // `${outerName}i` (`ClusterDotString.java:151-152`) -- SAME boolean as the
  // outer "a" wrap above (`thereALinkFromOrToGroup1`); wraps `ee`'s own
  // non-port content (the anchor point + any real non-border member or
  // nested child cluster) from the INSIDE.
  const innermost = c.borderPointAncestorWrap === true ? ee.addSubgraph(`${outerName}i`, {}) : ee;
  return { main, innermost };
}
