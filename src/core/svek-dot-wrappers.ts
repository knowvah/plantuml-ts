/**
 * ClusterDotString's protection-wrapper nesting, shared by the two consumers
 * of one `DotInputGraph`: the LAYOUT builder (`graph-layout-build.ts`
 * #addClusters, which already built this nesting) and the DOT-TEXT emitter
 * (`svek-dot-emit.ts`, which did not until G9/T1).
 *
 * Jar wraps each logical cluster in up to four nested, label-less subgraphs —
 * outer `a`/`p0`, the base `cluster<N>`, inner `i`/`p1`:
 *
 *   subgraph cluster6a {label="";subgraph cluster6p0 {label="";
 *     subgraph cluster6 {style=solid;…;
 *       zaent0001 [shape=point,…];
 *       subgraph cluster6i {label="";subgraph cluster6p1 {label="";
 *         <members, nested child clusters>
 *   }}}}}
 *
 * (verbatim shape of `test-results/dot-cache/state/bupani-17-puxi938/svek-1.dot`).
 *
 * Which pair fires is decided upstream at `ClusterDotString.java:91-116`:
 *   - `a` (`:98-99`) and `i` (`:151-152`) — both on `thereALinkFromOrToGroup1`
 *   - `p0` (`:114-115`) and `p1` (`:154-155`) — on `protection0`/`protection1(type)`
 *   - `:109-112` — ANY border point (`entityPositionsExceptNormal.size() > 0`)
 *     forces `protection0`/`protection1` false, which is why the wrapper
 *     population and the border-point (pin) population are disjoint.
 *
 * This module does not re-derive those booleans: `DotInputCluster` already
 * carries jar's own answers, computed once in `state-composite-cluster.ts` and
 * consumed by the builder since G7 T7/T14b — `innerMarginLevels` for the plain
 * family (see its own doc comment for the full jar-source derivation) and
 * `borderPointAncestorWrap` for the border-point family. Reading the same
 * fields is what keeps the two consumers from drifting apart again; the
 * `wrapper-parity` fitness test asserts they have not.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:91-158,245-252
 */

import type { DotInputCluster } from './graph-layout.types.js';

/** Which wrapper levels a cluster gets, per `ClusterDotString.java:94-158`. */
export interface WrapperLevels {
  /** `thereALinkFromOrToGroup1` — the outer ancestor-link wrap (`:98`). */
  a: boolean;
  /** `protection0(type)`, forced false by any border point (`:109-115`). */
  p0: boolean;
  /** `thereALinkFromOrToGroup1` again — the inner ancestor wrap (`:151`). */
  i: boolean;
  /** `protection1(type)`, forced false by any border point (`:109-112,154`). */
  p1: boolean;
}

/**
 * The wrapper levels `cluster` resolves to — the SINGLE definition both the
 * layout builder and the DOT emitter answer this question with.
 *
 * The border-point family (`portRanksLabelOnEe`) takes the first branch:
 * `protection0`/`protection1` are forced false for it (`ClusterDotString
 * .java:109-112`), so only the `a`/`i` pair can fire there, gated by
 * `borderPointAncestorWrap` — jar's `thereALinkFromOrToGroup1` for a cluster
 * whose `entityPositionsExceptNormal` is non-empty. Every other cluster reads
 * `innerMarginLevels`, whose `2` value IS that same upstream boolean and
 * whose mere presence encodes `protection0`/`protection1` (both unconditionally
 * true for a title-table-eligible composite — see the field's own doc comment).
 */
export function wrapperLevels(cluster: DotInputCluster): WrapperLevels {
  if (cluster.portRanksLabelOnEe === true) {
    const wrap = cluster.borderPointAncestorWrap === true;
    return { a: wrap, p0: false, i: wrap, p1: false };
  }
  const levels = cluster.innerMarginLevels;
  return {
    a: levels === 2,
    p0: levels !== undefined,
    i: levels === 2,
    p1: levels !== undefined,
  };
}

/** `subgraphClusterNoLabel` (`ClusterDotString.java:245-252`) — an opening
 *  `subgraph <clusterId><suffix> {label="";` with no other attribute. */
export function subgraphNoLabel(clusterId: string, suffix: string): string {
  return `subgraph ${clusterId}${suffix} {label="";`;
}

/** The `a`/`p0` opens, outermost first (`ClusterDotString.java:98-115`). */
export function outerWrapperLines(clusterId: string, w: WrapperLevels): string[] {
  const out: string[] = [];
  if (w.a) out.push(subgraphNoLabel(clusterId, 'a'));
  if (w.p0) out.push(subgraphNoLabel(clusterId, 'p0'));
  return out;
}

/** The `i`/`p1` opens, outermost first (`ClusterDotString.java:151-155`). */
export function innerWrapperLines(clusterId: string, w: WrapperLevels): string[] {
  const out: string[] = [];
  if (w.i) out.push(subgraphNoLabel(clusterId, 'i'));
  if (w.p1) out.push(subgraphNoLabel(clusterId, 'p1'));
  return out;
}

/** How many `}` a cluster's own block owes, wrappers included — one per
 *  level plus the base cluster itself (`ClusterDotString.java:189-201`). */
export function closeCount(w: WrapperLevels): number {
  return 1 + Number(w.a) + Number(w.p0) + Number(w.i) + Number(w.p1);
}
