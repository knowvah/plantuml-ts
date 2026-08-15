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
- [ ] 10-edge-spline-sp-ep-not-exposed.md  <!-- FIXED upstream 2026-08-13
        (dot-engine #47): EdgeGeometry carries sp/ep, gated on C's sflag/eflag.
        Unchecked until the pinned .tgz moves; no consumer here yet, so no
        fixture can move either way. The issue's premise that the engine
        neither reserves nor shortens for the arrowhead was checked upstream
        and is wrong — it already does, oracle-verified. Our remaining work is
        to pass arrowhead/arrowsize through DotInputEdge. -->
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
        This repo is still on ^1.4.0, so the box stays unchecked per the rule
        at the top of this file — plans/namespace-cluster-box/ T7 is what
        moves the pin and re-measures. -->
