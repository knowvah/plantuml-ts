# dot-engine issue tracker

One checklist item per issue file in this folder — nothing else. Check
the box only when the fix has landed in the pinned dot-engine `.tgz`
AND the affected plantuml-ts fixtures re-measure clean (the class /
object ratchets and census re-run instantly against an updated `.tgz`).

`[~]` marks an issue closed without an upstream fix to wait for —
either diagnosed as correct-by-oracle, or reclassified as our work.

- [x] 01-getlayout-render-spline-mismatch.md
- [x] 02-cluster-node-fractional-centering.md
- [x] 03-splines-attr-unsupported.md
- [x] 04-anchor-point-rank-assignment.md
- [x] 05-cluster-label-dimensions-ignored.md
- [x] 06-cluster-bbox-not-in-getlayout.md
- [x] 07-html-label-mark-not-exported.md
- [x] 08-cluster-scoped-rank-subgraph-bbox.md
- [~] 09-routesplines-drops-edge-on-record-ports.md  <!-- CLOSED 2026-08-13 as
        correct-by-oracle, not fixed. The jar routes the edge and we drop it,
        but the C drops it too: dot-engine fed the exact polygon and endpoints
        its router builds to graphviz's own libpathplan, and Pshortestpath
        returns -1 as-is, deduped, and reversed. Making that edge route would
        be a divergence from the C, so there is no upstream fix to wait for.
        Supersedes the earlier note here that recorded it as reproduced and
        pending. -->
- [x] 10-edge-spline-sp-ep-not-exposed.md  <!-- FIXED upstream 2026-08-13
        (dot-engine #47): EdgeGeometry carries sp/ep, gated on C's sflag/eflag.
        CONSUMED HERE 2026-08-15 on the pinned 1.5.0: arrowhead/arrowtail/
        arrowsize now pass through DotInputEdge, epX/epY republish bezier.ep,
        and json/JsonCurve.ts draws the head to it (ARROW_LENGTH and the
        extrapolation deleted). `sp` deliberately NOT plumbed — upstream's own
        JsonCurve stores it and never reads it. Two premises in the issue file
        were wrong and are corrected there: the attr list is THREE calls
        (arrowtail=none as well), and `ep` was ALWAYS reported because
        graphviz defaults arrowhead=normal — the attrs change the SHORTENING,
        not ep's availability. Arrow tips now land on their target node (they
        were 3.9px short of it); the residual ~6.7px against jar is the
        Smetana node-position delta, recorded not chased per the 2026-08-09
        one-engine ruling. -->
- [~] 11-flat-edge-label-width-ignored-in-nodesep.md  <!-- RECLASSIFIED 2026-08-13:
        NOT a dot-engine defect. The engine honors the label box; this was
        measured through graph-layout-build-edges.ts's plain-text label path,
        which never sends a width. Given a FIXEDSIZE table it tracks the jar
        within ~0.6 horizontally and matches real graphviz exactly vertically.
        No upstream fix to wait for -- work is ours, scoped in
        .agent-notes/class-edge-label-rank-gap.md. -->
- [~] 12-port-label-placement-near-head-node.md  <!-- RECLASSIFIED 2026-08-13:
        NOT a dot-engine defect. Port-label placement is byte-identical to the
        native oracle on the filed repro in three forms and on the fixture's
        real svek DOT (7 port labels). The residual 41 diffs on
        object/tobuka-93-jale775 are all port-label text x/y, every y delta half
        the label-box height with opposite signs for an edge's two ends — one
        formula fed correct centres cannot do that, so the mechanism is ours,
        in portLabelAnchor (class-edge-geo.ts:202-223). -->
- [x] 13-edge-tail-head-label-positions-not-in-getlayout.md
- [ ] 14-cluster-label-position-not-in-getlayout.md  <!-- FIXED upstream
        2026-08-14: ClusterGeometry carries label {x, y, width, height}, where
        x/y is the label CENTRE (the box's own x/y is a corner, and render()'s
        <text> carries the baseline — three conventions in one object).
        Presence is gated on existence, not on the label's `set` flag, because
        C draws cluster labels on existence alone (emit.c:3920 has no ->set
        test, unlike emit_edge_label:2891) — so the filing's requested `set`
        gate was deliberately not implemented. Unchecked until the pinned .tgz
        moves and buildNamespaceGeos reads cluster.label instead of
        re-measuring; the gate is plans/namespace-cluster-box/.
        PUBLISHED 2026-08-15 in 1.5.0, verified here against that release's
        own dist/api/geometry.d.ts (not inferred from the version bump): the
        optional `label` field is present with the centre convention above.
        PINNED 2026-08-14 (T7, e5fa03cf): package.json is now ^1.5.0 and the
        field is surfaced through mapClusters onto DotLayoutResult.clusters[].
        STILL UNCHECKED, and this half will not be satisfied by the consumer
        the filing anticipated. buildNamespaceGeos does NOT read cluster.label
        and should not: Cluster#setTitlePosition/xyTitle is consumed only by
        drawUState/drawSwinLinesState (Cluster.java:439,497), while a package
        goes through ClusterDecoration.drawU and USymbolFolder#asBig, which
        draws the title at a fixed local UTranslate(4, 2) from the box corner
        (USymbolFolder.java:228). Wiring it cost 333 matched shapes. The
        genuine consumer is state's composite title, unbuilt — so no fixture
        moves either way yet, and the box stays open per this file's own rule
        rather than being ticked on the strength of the fix existing.
        (A trailing line here said "this repo is still on ^1.4.0" — stale the
        moment T7 landed the bump recorded above, and removed 2026-08-15.) -->
- [~] 15-cluster-anchor-point-ranked-with-target.md  <!-- RECLASSIFIED 2026-08-19:
        NOT a dot-engine defect. The filing compared two different quantities --
        the jar's DRAWN spline start (88.187, i.e. where PlantUML clips the path
        at cluster A's rectangle) against our UNCLIPPED spline start (112). The
        anchor never moved: on this fixture's own jar-emitted svek-1.dot the
        port's -Tdot is byte-identical to the native oracle (same cluster bbs,
        same zaent0002 pos 190,73, same spline), as it is on five hand-built
        variants of the shape. Mapping the oracle's spline into the jar's frame
        (dx=-5, dy=+45.09) reproduces the jar's own knots EXACTLY from the third
        segment on, and the jar's arrow tip 70.83,128.99 IS the oracle's
        endpoint -- same curve, both engines. The +7.82 is arithmetic: the
        oracle's control point 205.82 maps to 200.820, minus A's frontier 193 =
        7.820. Mechanism is PlantUML's Java-side DotPath#simulateCompound clip
        (SvekEdge.java:671-672), which graphviz's own dot_compoundEdges cannot
        supply for this shape -- with compound=true+ltail added, the head is
        inside the tail cluster's bb so makeCompoundEdge (compound.c:378-383)
        warns and leaves the spline alone (verified: output unchanged). No
        upstream fix to wait for -- work is ours, applying the simulateCompound
        clip we already ship (DIVERGENCES.md:688) to state composite-anchor
        transitions before LimitFinder folds the spline into the ink extent. -->
- [ ] 16-edge-xlabel-position-not-in-getlayout.md  <!-- FIXED upstream
        2026-08-19: EdgeGeometry carries `xlabel {x, y}`, snapshotted from
        edge.info.xlabel through the same flipY as every other coordinate and
        gated on the SAME `lp->set` flag issue 13 introduced (an xlabel the
        force search could not fit reads as absent, not as a label at the
        origin). Oracle-verified on the filing's own repro: native `dot -Tdot`
        reports xlp="30.945,98.35" against our {30.94482, 98.34964}. EDGE
        xlabels only -- node xlabels (ND_xlabel) are typed `unknown` upstream
        and were not asked for. UNCHECKED until the pinned .tgz moves and the
        consumer half lands (a?.xlabel in addEdges, ge.xlabel in toEdgeEntry,
        then pavuzo-79-zodu430 scope 2 -2.460 px -> 0). ORIGINAL FILING:
        filed 2026-08-19, while planning the SI29 follow-on fix batch (G20b). EdgeGeometry carries no xlabel field, so every `linetype ortho`/`polyline` transition label falls back to perpendicularOffsetLabel instead of graphviz's force-search; pavuzo-79-zodu430 scope 2 width is -2.460 px because of it. Verified live on the installed 1.5.0, not inferred from the types: with `xlabel="X"` render() DOES emit the <text> (x=30.94) while getLayout()'s edge has no label field at all, and the x differs from the `label="X"` control (41.06) — so the engine places it by the real xlabels.c search and simply does not publish it. Same shape as 13 and 06. Consumption here is blocked until this lands and the .tgz moves; the plantuml-ts half (forward a?.xlabel in graph-layout-build-edges.ts, map ge.xlabel in toEdgeEntry) is deliberately NOT written in the meantime, since no fixture could exercise it. -->
