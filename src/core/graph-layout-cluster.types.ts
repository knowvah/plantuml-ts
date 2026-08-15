/**
 * `DotInputCluster` — the cluster half of the layout input contract.
 *
 * Split verbatim out of `graph-layout.types.ts` (which reached the repo's
 * 500-line file cap) with no edits to the type itself; that module re-exports
 * this one, so every existing `import type { DotInputCluster } from
 * './graph-layout.types.js'` keeps resolving. Mirrors the pre-existing
 * `graph-layout-result.types.ts` split of `DotLayoutResult`.
 */

/** A cluster (graphviz `subgraph cluster*`) the Svek-DOT emitter renders.
 *  Carries membership + title geometry; layout ignores it for now. */
export interface DotInputCluster {
  id: string;
  label?: string;
  labelWidth?: number;
  labelHeight?: number;
  /** Member node ids declared directly in this cluster (not nested children). */
  nodeIds: string[];
  /** Enclosing cluster id for nesting; absent ⇒ top-level. */
  parentId?: string;
  /** Svek `ClusterDotString.printRanks`' port rank-chain (EntityPosition
   *  PORTIN/PORTOUT children only) — one entry per rank present among this
   *  cluster's own port children, node ids in declaration order. The
   *  emitter chains them in ONE `A->B->C [arrowhead=none]` statement
   *  (Svek's own syntax, faithfully reproduced: the DOT-parity comparator's
   *  regex-based edge parser only extracts the LAST hop of a multi-hop
   *  chain statement, so matching this syntax exactly keeps both sides of
   *  the comparison symmetric) then links the last node to `portAnchorId`.
   *  Emitter- AND real-layout-consuming (`graph-layout-build.ts#addClusters`,
   *  G8/T1b's generic rank-constraint wiring for genuine PORTIN/PORTOUT
   *  ports, and G7 T14b's own dedicated `portRanksLabelOnEe` branch for the
   *  state border-point family). */
  portRanks?: { rank: 'source' | 'sink'; nodeIds: string[] }[];
  /** DOT id of this cluster's shared group-anchor node (`groupAnchorNodeId`
   *  / Svek's `Cluster.getSpecialPointId`) — required whenever `portRanks`
   *  is set; the last node of each rank-chain links to it
   *  (`ClusterDotString.empty()`). Emitter-only. */
  portAnchorId?: string;
  /** Mission A4/T4, mechanisms.md §2: state-diagram entry/exit border
   *  points (`EntityPosition.usePortP()` true for ENTRY_POINT/EXIT_POINT,
   *  not just PORTIN/PORTOUT) reuse the SAME `portRanks`/`portAnchorId`
   *  rank-group + `${id}ee` nesting shape as genuine ports (needed so the
   *  DOT-parity comparator's `{rank=...}` brace-stack quirk zeroes the
   *  cluster's member count on BOTH sides symmetrically — see
   *  tests/oracle/svek-dot.ts's `parseClusters`), but their rendered DOT
   *  differs from `hasPort()`'s (PORTIN/PORTOUT) NoLabel branch in two
   *  ways, verified on bitaxo-18-tamo974: (1) the real cluster TITLE moves
   *  onto the `${id}ee` subgraph's `label=` instead of staying blank
   *  (`ClusterDotString`'s WithLabel branch, `!hasPort()`), and (2) there
   *  is NO `A->B->anchor` rank-chain edge — the anchor sits unconnected
   *  inside `${id}ee`. When true, the emitter takes this WithLabel/no-chain
   *  shape instead of the NoLabel/chained one; additive — absent (the
   *  class/component/description PORTIN/PORTOUT precedent) is unaffected. */
  portRanksLabelOnEe?: true;
  /** G5 C3, mechanism 16 shape half (docs/graphviz-issues/07's RESOLVED
   *  note, @knowvah/dot-engine's `setHtmlAttr`): the real HTML
   *  `<TABLE FIXEDSIZE="TRUE" WIDTH=".." HEIGHT="..">` title-label
   *  reservation `graph-layout-build.ts#addClusters` feeds @knowvah/dot-engine's
   *  builder for THIS cluster's own subgraph, mirroring jar's real
   *  `ClusterDotString`/`ClusterHeader` mechanism (`SvekEdge.appendTable`,
   *  `label=<TABLE FIXEDSIZE="TRUE" WIDTH="cluster.getTitleAndAttribute
   *  Width()" HEIGHT="cluster.getTitleAndAttributeHeight()-5">`).
   *  Deliberately DISTINCT from `labelWidth`/`labelHeight` (the Svek-DOT
   *  TEXT emitter's own convention, `height=font.size` per line — used
   *  ONLY for the oracle DOT-parity comparator, which is STRUCTURAL-only
   *  and tolerant of the numeric label value, `tests/oracle/svek-dot.ts`'s
   *  own doc comment: "`width`/`height` are tolerant metrics... reported,
   *  not asserted"). `titleTableHeight` in particular is NOT derived from
   *  this port's own text-height convention at all — the FIXEDSIZE table's
   *  sole role is a graphviz layout-space RESERVATION signal (the visible
   *  title text is drawn separately, by this port's own renderer,
   *  `renderer-composite-box.ts`), so its value is jar-CALIBRATED, not
   *  jar-Java-internal-derived: G5 C2's marker sweep found @knowvah/dot-engine
   *  reserves `gap = HEIGHT + 16` above the first content rank (15-point
   *  linear sweep through this exact `setHtmlAttr` seam); G5 C3 confirmed
   *  jar's real single-line-title header gap is a CONTENT-WIDTH-
   *  INDEPENDENT constant 19px on 132/134 real corpus cluster samples (the
   *  2 exceptions both multi-line titles, `sosoxe-55-demi451`/`teseci-80-
   *  sivi292`, out of this iteration's scope — see `state-composite-
   *  cluster.ts`'s own doc comment). G6 T1 superseded the C2-era `3`
   *  (19-16) calibration: jar's real svek DOT emission is a content-
   *  independent `HEIGHT="9"` (70+ cached svek-*.dot samples), so
   *  `titleTableHeight=9` is the jar-verified constant for that case —
   *  NOT `cluster.getTitleAndAttribute
   *  Height()-5`'s Java-internal value, which this port does not reproduce
   *  bit-for-bit (a deliberately decoupled, resolved discrepancy — G5 C2's
   *  own "C3+ queue" sub-item 3). Additive: absent (every pre-C3 caller,
   *  and every C3-ineligible cluster — multi-line title, non-default
   *  font-size, or a `portRanksLabelOnEe` border-point cluster, which
   *  jar-verified needs a DIFFERENT title vertical offset, `state-
   *  composite-cluster.ts`'s own doc comment) falls back to the pre-
   *  existing plain-text `label` attr, unchanged. */
  titleTableWidth?: number;
  titleTableHeight?: number;
  /** G5 C7, mechanism 16 margin half (ledger.md §C7): jar's real cluster
   *  side/top/bottom margin is NOT graphviz's bare 8pt `CL_OFFSET` default —
   *  `ClusterDotString.printInternal` (`~/git/plantuml/.../svek/
   *  ClusterDotString.java`) nests a cluster's own real content inside 1-2
   *  extra "protection" `subgraph cluster*` wrappers ("p1" always, when
   *  `protection1()` — true for every non-swimlane, non-NODE-usymbol state
   *  composite in this port's corpus; "i" ADDITIONALLY when
   *  `thereALinkFromOrToGroup1` — a link's source or target is the group
   *  ENTITY ITSELF, not a descendant member, `SvekEdge#isLinkFromOrTo`'s
   *  exact-identity check), each an ordinary graphviz cluster subgraph that
   *  gets ITS OWN `CL_OFFSET` margin around its children — compounding to
   *  16px (1 extra level) or 24px (2) between real content and the drawn
   *  cluster boundary, jar-verified via a direct `dot -Tsvg` run on cached
   *  `svek-N.dot` (`gojuja-90-pune699`'s `A`: real oracle left margin
   *  42.83-18.83=24, matching 3×8pt: the outer cluster's own margin + "i" +
   *  "p1") and corpus-wide (84/84 cluster-bearing cached DOTs: "i" wrapper
   *  presence matches `zaent` special-point presence with ZERO
   *  counterexamples — the SAME `isThereALinkFromOrToGroup` boolean gates
   *  both, since `useProtectionWhenThereALinkFromOrToGroup` is true for
   *  every graphviz version this corpus's cache used,
   *  `GraphvizVersionFinder.java:90-96`). `1` emits ONE extra "p1"-only
   *  wrapper (16px); `2` ADDITIONALLY nests an "i" wrapper inside the outer
   *  cluster, outside "p1" (24px) — mirroring jar's exact nesting order.
   *  Additive: absent (every pre-C7 caller) falls back to the plain,
   *  unwrapped `sg.addNode(id)` loop (graphviz's bare 8pt default),
   *  unchanged. Set ONLY for `titleTableEligible` clusters that are NOT
   *  ALSO border-point (`state-composite-cluster.ts
   *  #resolveClusterComposite`'s own `!hasBorderPointChildren` guard) —
   *  jar's own `Cluster#manageEntryExitPoint`/`FrontierCalculator` path (the
   *  entrypoint/exitpoint family) reads member positions directly rather
   *  than graphviz's own reported raw cluster bbox, and `protection0()`/
   *  `protection1()` are unconditionally FALSE for that family regardless
   *  (`ClusterDotString.java:107-112`) — see `borderPointAncestorWrap`
   *  below for its own, narrower, replacement boolean (G7 T14b).
   *
   *  G7 T7 (`plans/g7-borderpoint-rank/decision-journal.md`, T5 root-cause
   *  row): the SAME value ALSO gates jar's OUTER "a"/"p0" ancestor pair
   *  (`ClusterDotString.java:91-116`), which `graph-layout-build.ts
   *  #addClusters` wraps around the whole cluster (a/p0/main/i/p1, outer to
   *  inner) — `protection0()` is unconditionally true whenever this field is
   *  set (same non-swimlane reasoning as `protection1()` above), and jar's
   *  `thereALinkFromOrToGroup1` is the exact boolean this field's own `2`
   *  value already encodes, so no separate field is needed. Verified against
   *  the real jar's cached svek DOT (`kotagu-43-miza629`'s `SubComposite`:
   *  `cluster12a{cluster12p0{cluster12{...cluster12i{cluster12p1{...}}}}}}`)
   *  and corpus-wide (307/307 cached DOTs pair "p0" with "p1"; 93/93 pair "a"
   *  with "i"; zero counterexamples). */
  innerMarginLevels?: 1 | 2;
  /** The one member of `nodeIds` that stays a DIRECT child of the outer
   *  cluster subgraph, unwrapped by `innerMarginLevels` — jar's zaent
   *  special-point anchor (`Cluster.getSpecialPointId`), which
   *  `ClusterDotString.printInternal` declares BEFORE opening the "i"/"p1"
   *  wrappers, not inside them (verified directly against `gojuja-90-
   *  pune699`'s cached `svek-2.dot`: `zaent0001` sits as a direct child of
   *  `cluster6`, sibling to — not descendant of — `cluster6i`). Ignored
   *  when `innerMarginLevels` is absent. */
  unwrappedNodeId?: string;
  /** G7 T14b (`plans/g6-cluster-geometry/batch-4/withlabel-derivation.md`
   *  §5 item 4, T19's confirmed edit list): `thereALinkFromOrToGroup1`
   *  (`ClusterDotString.java:91-96`) for a border-point (`portRanksLabelOnEe`)
   *  cluster SPECIFICALLY — `protection0()`/`protection1()` are forced FALSE
   *  whenever `entityPositionsExceptNormal.size() > 0` (`ClusterDotString
   *  .java:107-112`), so the plain family's `innerMarginLevels === 2`
   *  encoding of this SAME upstream boolean cannot double as this family's
   *  own trigger — a separate field is required. Gates BOTH `graph-layout-
   *  build.ts#addClusters`'s outer `${outerName}a` wrap (NEVER a `p0`
   *  sibling — protection0 is always off here) and its inner `${outerName}i`
   *  wrap (nested inside `${outerName}ee`, wrapping that subgraph's own
   *  non-port content). Meaningful ONLY when `portRanksLabelOnEe` is also
   *  `true`; ignored otherwise. */
  borderPointAncestorWrap?: true;
}
