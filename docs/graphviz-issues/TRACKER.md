# dot-engine issue tracker

One checklist item per issue file in this folder — nothing else. Check
the box only when the fix has landed in the pinned dot-engine `.tgz`
AND the affected plantuml-ts fixtures re-measure clean (the class /
object ratchets and census re-run instantly against an updated `.tgz`).

`[~]` marks an issue closed without an upstream fix to wait for —
either diagnosed as correct-by-oracle, or reclassified as our work.

- [x] 01-getlayout-render-spline-mismatch.md
- [x] 02-cluster-node-fractional-centering.md
- [x] 03-splines-attr-unsupported.md  <!-- RE-CHECKED 2026-09-03 (was [ ] the
        same day). CONSUMED at last by mission linetype-ortho-routing:
        DotInputGraph.linetype + core/dot-splines.ts#dotSplinesAttrs, emitted
        by BOTH applyGraphAttrs (layout) and graphAttrLines (DOT emitter),
        forwarded by all three engines (state/class/description). All 8
        fixtures now emit the exact splines line their own cached jar DOT
        carries, on all 10 layout passes -- ortho five with
        forcelabels=true, polyline three without (DotStringFactory.java
        :161-169's asymmetry, confirmed against real jar data with zero
        counter-examples). pavuzo-79-zodu430 re-measures CLEAN (12/12
        declarations exact, -1.579968 px -> 0), so this file's own
        checkbox rule is satisfied. The blast radius below was measured and
        held exactly: grep of oracle/goldens/ found splines= in precisely
        those 8 of 1,865 golden dirs, and nothing outside them moved.
        ORIGINAL 2026-09-03 UNCHECKING FOLLOWS, unedited:
        The UPSTREAM half is fixed and verified working: the pinned 1.6.0
        honours `splines=ortho` exactly, matching native graphviz 15.1.1 on
        bb width, node centring and both xlabel positions (measured, see
        issue 17). But the plantuml-ts CONSUMPTION never happened -- nothing
        in src/ ever started emitting the attribute. `applyGraphAttrs`
        (core/graph-layout-build.ts:34-43) sets rankdir/nodesep/ranksep/
        aspect; `graphAttrLines` (core/svek-dot-emit.ts:66-77) pushes
        nodesep/ranksep/remincross/searchsize/rankdir=LR; `DotInputGraph`
        has no field to carry it; zero splines/forcelabels emission anywhere
        in src/. So every `skinparam linetype ortho|polyline` layout still
        runs on graphviz's DEFAULT CURVED routing where the jar runs ortho.
        `theme.linetype` is parsed and plumbed to the per-edge
        moveLabelToXlabel switch ONLY (state-dot-graph.ts:238,
        state-composite-edge-label.ts:98, link-edge-attrs.ts:361) -- issue 16
        wired the label half of the feature, the routing half was never
        wired. Upstream emits both attrs at DotStringFactory.java:161-169,
        between searchsize=500 (:154) and rankdir=LR (:171), exactly the gap
        in graphAttrLines. Un-checked under this file's own rule (box
        requires the fix landed AND affected fixtures re-measuring clean):
        pavuzo-79-zodu430 demonstrably does not, and issue 17 is this
        entry's downstream symptom. Blast radius: 8 cached oracle fixtures
        carry splines= in their jar DOT (class bujedi-30-cize673,
        dimisi-54-dula946, gamevo-26-runo973, jakapi-64-tine258,
        kuxato-79-muno809; component zosaxo-93-nici652; state
        kejabo-83-vinu490, pavuzo-79-zodu430) plus 21 unclassified corpus
        fixtures. NOT a one-liner -- ortho routing moves every edge on a
        fixture; wants its own mission with before/after pins. Note the
        DOT-parity harness (tests/oracle/svek-dot.ts) has zero splines/
        linetype tokens and structurally cannot see this gap, which is why
        the state suite reads DOT EQUAL 266/268 with materially different
        routing. Full artifact:
        .agent-notes/gvi17-splines-never-emitted.md -->
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
        and were not asked for.
        SI31 T1 (2026-08-19): pinned to 1.6.0 (bump verified inert -- 0 rows,
        0 fixtures moved on the version bump alone). Consumer half landed:
        `addEdges` (graph-layout-build-edges.ts) forwards `a.xlabel` as a
        FIXEDSIZE HTML table (mirrors `label`'s own box variant), and
        `toEdgeEntry` (graph-layout.ts) maps `ge.xlabel` onto `labelX`/
        `labelY`. A `labelWidth`/`labelHeight` echo from the `xlabel` pair
        was also drafted and then REMOVED before commit: measured both ways
        it changed 0 of 2660 harness rows and 0 of 2017 rendered fixtures,
        and the comment justifying it claimed it drove pavuzo-79-zodu430 to
        exact, which direct measurement disproved. Unrequested and provably
        inert, so it did not land.

        STILL UNCHECKED: pavuzo-79-zodu430 scope 2 width idx 2 moved
        -2.460024 px -> -1.579968 px, not the exact 0 this issue's own
        "Verification when it lands" section predicted. Diagnosed to the
        four-part standard (rules/diagnosis.md):

        MECHANISM: for this exact fixture's inner scope (Idle/Configuring +
        2 xlabeled EvConfig edges, splines=ortho), @knowvah/dot-engine's
        xlabel-driven canvas/rank-centring reserves ~1.58pt LESS horizontal
        room than native graphviz 15.1.1 does on the byte-identical input --
        confirmed by a controlled A/B, not the single-repro spot-check this
        entry previously relied on (that check used a hand-typed node width
        of 1.2731in instead of the real 1.273090in and coincidentally
        matched dot-engine's own output because of it -- a same-precision-
        error-on-both-sides artifact, not a genuine fidelity proof; the
        prior "dot-engine xlp matches native exactly" claim here was WRONG
        and is corrected below, not repeated).

        ORIGIN (jar side, verified faithful, not the cause): SvekResult
        .java:130-133 (calculateDimension: minMax.getDimension()
        .delta(15,15)), InnerStateAutonom.java:186-195
        (calculateDimensionSlow: text.mergeTB(attr,img).delta(MARGIN*2+
        2*MARGIN_LINE+marginForFields), MARGIN=MARGIN_LINE=5 -> delta=20),
        XDimension2D.java:101-105 (mergeTB 3-arg = Math.max of the three
        widths). This port's own computeSvekResultGeometry
        (layout-ink-extent.ts) + measureAutonomWrapper
        (state-composite-sizing.ts) reproduce this chain byte-for-byte
        (gated tracing, reverted): ink 106.5825 + 15 + 20 = 141.5825,
        matching the harness's measured "ours" exactly. SvekEdge.java
        :433-437 (ortho fork) and :504-521 (appendTable's (int)
        truncation) are also faithfully mirrored -- the 54x15 reservation
        this port emits is byte-identical to the jar's own cached
        svek-1.dot. None of jar's OWN arithmetic is the cause.

        ORIGIN (real cause, upstream of jar and this port both): native
        dot -Txdot, fed jar's own cached node widths (0.694444/1.273090)
        for this reduced sub-graph, reports xlp="27,75.558" (matching this
        issue's ORIGINAL FILING's own quoted repro value) and
        xlp="43.667,60.442", bb="0,0,108.16,192". The SAME graph built
        through this port's OWN addNodes/addEdges and read back via
        getLayout() (not text-serialized, full float precision) reports
        xlabel={x:27,y:75.47} / {x:40.5,y:60.47}, node centres at x=60.75,
        bb width=106.581. The first edge's xlp.x matches (27); the second
        diverges by 3.17pt (40.5 vs 43.667) and the node centring itself
        (not just the label) diverges by 1.58pt (60.75 vs 62.333).
        Removing the xlabel attributes entirely from the SAME native input
        drops its bb back to 91.662 (bare node width, centred at 45.831) --
        so xlabels genuinely widen native's canvas/centring by +16.502pt,
        against this port's own +14.919pt for the identical input. This is
        graphviz's splines=ortho xlabel canvas-reservation path
        (~/git/graphviz/lib/dotgen/dotsplines.c's EDGETYPE_ORTHO branch,
        setEdgeLabelPos/orthoEdges, ~line 249; lib/common/postproc.c
        :405-616's addXLabels), which @knowvah/dot-engine ports in
        label/xlabels.ts -- NOT a ~/git/plantuml file, so this is filed as
        a dot-engine geometry gap, not a jar mismatch.

        CAUSAL CHAIN (exact arithmetic): ink width = maxX - minX, where
        maxX is Configuring's own right edge (dominant on both sides,
        translation-invariant) and minX is the Idle->Configuring label's
        box left edge (dominant on both sides; the second edge's own 3.17pt
        drift never binds either bound, verified by direct computation on
        both geometries). Configuring's right edge = centre + halfWidth;
        halfWidth is identical (45.831, same node dims both sides), so the
        ENTIRE gap is the centre-x shift: native/jar centre 62.333 vs this
        port's 60.75, a delta of 1.583. Ink width: jar 108.164 vs ours
        106.581 (delta 1.583). This delta propagates UNCHANGED through +15
        (SvekResult margin) and +20 (InnerStateAutonom chrome, both
        additive and both verified identical above) to the composite's
        declared width: 108.164+35=143.164 (jar, matches the harness's
        1.988368in x 72 = 143.162 to display rounding) vs 106.581+35=
        141.581 (ours, matches 1.966424in x 72 = 141.583). 143.164-141.581=
        1.583 =~ -1.579968 px deltaPx (the ~0.003 residual is the harness's
        own 6-decimal-place rounding on both "ours" and "jar", not a third
        cause).

        RULED OUT: (1) getMinXY's 2-decimal SVG-scrape quantization
        (state-transition-label.ts#svgPrecision) -- bounded at <=0.005px,
        two orders of magnitude too small. (2) labelShield
        (SvekEdge.java:353-356) -- proven 0 via jar's own cached DOT
        (WIDTH="54" matches this port's unshielded reservation exactly; a
        nonzero shield would inflate BOTH). (3)
        divideLabelWidthByTwo/eventuallyDivideByTwo
        (SvekEdge.java:314-316,485-490) -- gated on NoteLinkStrategy
        .HALF_*, never set for a plain inline label. (4) appendTable's
        (int) truncation (SvekEdge.java:504-521) -- both sides truncate 54
        identically, proven via the byte-identical cached DOT. (5) the
        composite title text "NotShooting" dominating Math.max instead of
        childImg -- measured 77.0875 on this port, 77.087 (textLength) in
        jar's own cached SVG; nowhere near the ~123pt needed to dominate on
        either side. (6) this task's own consumption seam
        (addEdges/toEdgeEntry) -- unit-tested, and the reservation box and
        xlp.x for the FIRST edge match jar exactly, ruling out a
        forwarding/mapping bug specifically (a systematic seam bug would
        show on both edges, not one).

        NEXT INSTRUMENTATION (not yet done): isolate whether
        @knowvah/dot-engine's shortfall is in canvas-width reservation (a
        fixed per-xlabel margin term) or in the force-search's candidate
        set for the SECOND edge specifically (whose 3.17pt drift may or may
        not be the same root cause as the 1.58pt centring shortfall -- not
        yet proven to be one mechanism versus two coincident ones). File as
        a new docs/graphviz-issues/ entry with this A/B (native-with-vs-
        without-xlabel bb) as the repro; that filing, not this task, is
        where dot-engine's own label/xlabels.ts source would actually be
        read. ORIGINAL FILING:
        filed 2026-08-19, while planning the SI29 follow-on fix batch (G20b). EdgeGeometry carries no xlabel field, so every `linetype ortho`/`polyline` transition label falls back to perpendicularOffsetLabel instead of graphviz's force-search; pavuzo-79-zodu430 scope 2 width is -2.460 px because of it. Verified live on the installed 1.5.0, not inferred from the types: with `xlabel="X"` render() DOES emit the <text> (x=30.94) while getLayout()'s edge has no label field at all, and the x differs from the `label="X"` control (41.06) — so the engine places it by the real xlabels.c search and simply does not publish it. Same shape as 13 and 06. Consumption here is blocked until this lands and the .tgz moves; the plantuml-ts half (forward a?.xlabel in graph-layout-build-edges.ts, map ge.xlabel in toEdgeEntry) is deliberately NOT written in the meantime, since no fixture could exercise it.

        CORRECTED 2026-09-03: the MECHANISM/ORIGIN/CAUSAL CHAIN blocks above
        attribute the residual -1.579968 px to @knowvah/dot-engine reserving
        less ortho xlabel canvas than native, in label/xlabels.ts. That
        attribution is WITHDRAWN -- the pinned 1.6.0 is exact against the
        native oracle on this fixture's own svek-1.dot, byte-for-byte via
        -Tdot and to full float precision via getLayout(). See issue 17,
        reclassified [~] the same day, for the disproof and for where the
        1.583 actually lives (the ortho edge port offset, +-8.333 vs +-6.75).
        The "RULED OUT" list and the jar-side ORIGIN analysis are unaffected;
        only the upstream attribution was wrong.
        This box stays UNCHECKED under this file's own rule -- the fix landed
        and is consumed, but pavuzo-79-zodu430 still does not re-measure
        clean. Its blocker is now a plantuml-ts work item (17), not an
        upstream wait.
        REFINED 2026-09-03: that blocker is specifically issue 03's
        un-consumed fix -- `splines=ortho` is never emitted, so the ortho
        ROUTING half of `skinparam linetype ortho` was never wired even
        though this entry wired the LABEL half. pavuzo-79-zodu430 closes
        when 03 does. See 17's second-pass block and
        .agent-notes/gvi17-splines-never-emitted.md. -->
- [x] 17-ortho-xlabel-canvas-reservation-short.md  <!-- RESOLVED 2026-09-03 by
        mission linetype-ortho-routing. This entry's own reclassification was
        right that the engine is innocent and right that the 1.583 is the
        ortho port offset; the ROOT was issue 03's un-consumed fix --
        splines=ortho was never emitted, so the layout ran on graphviz's
        default CURVED routing. Forwarding skinparam linetype to the
        graph-level attrs closes it: scope 2 width idx 2 goes -1.579968 px
        -> 0, all 12 declarations exact, and the fixture's max SVG delta
        drops 71.626 -> 1.007. NOTE the ~0.002 px residual predicted in
        .agent-notes/gvi17-splines-never-emitted.md was never real -- it was
        that note's standalone REPLAY deviating from the real pipeline by
        0.002072 px; see the correction appended to that file.
        ORIGINAL 2026-09-03 RECLASSIFICATION FOLLOWS, unedited:
        RECLASSIFIED
        2026-09-03: NOT a dot-engine defect, closed with no upstream fix to
        wait for. The filing's premise -- that the engine reserves ~1.58pt
        LESS horizontal canvas for an ortho edge's xlabels than native
        graphviz on byte-identical input -- does not reproduce. Measured
        against the PINNED 1.6.0 in this repo's own node_modules (and
        separately against dot-engine's src/ HEAD; both exact, so this does
        not turn on HEAD drift): `-Tdot` on this fixture's own cached
        svek-1.dot is BYTE-IDENTICAL to the native oracle, and through the
        exact API path graph-layout-build-edges.ts uses (createGraph +
        addNode/addEdge + setHtmlAttr('xlabel', fixedSizeTable(54,15)) +
        getLayout()) the engine reports bb width 108.164568, node centre x
        62.333328, xlabel.x 27 and 43.666656 -- matching native on all four,
        including the two the filing recorded as diverging (106.581, 60.75,
        40.5). Robust to dropping forcelabels/searchsize/remincross and to
        including or excluding the start-circle node sh0006.
        The 1.583 is NOT xlabel placement: it is the ortho edge PORT OFFSET
        from the node centre. Native routes the two sh0007<->sh0008 edges at
        +-8.333 about 62.333 (= 50/6, sh0007's width); the geometry the
        filing measured has them at +-6.75. That single term is the whole
        residual, and it also settles the filing's own open question --
        (1) the second edge's 3.17pt xlp drift and (2) the 1.58pt centring
        shift are ONE mechanism, since 3.167 = 2 x 1.583 (symmetric
        displacement about the centre), not two coincident ones.
        The 106.581 was measured on a graph built through this port's own
        addNodes/addEdges, so the divergence is in what THAT path feeds the
        engine. Work is ours: dump the DOT this port builds for
        pavuzo-79-zodu430's inner scope and diff it against the jar's cached
        svek-1.dot (node width/height and the xlabel box are the candidates
        that would move the offset). Full disproof, arithmetic and the
        preserved original filing are in the issue file.
        MECHANISM FOUND 2026-09-03 (second pass), and the next step above is
        WRONG: node width/height (20/50/91.6625) and the xlabel box (54x15)
        all match the jar's cached DOT exactly. The cause is that
        `splines=ortho` is NEVER EMITTED AT ALL -- not by the DOT emitter
        (svek-dot-emit.ts:66-77), not by the layout builder
        (graph-layout-build.ts:34-43), and DotInputGraph has no field for it
        -- so every ortho layout runs on graphviz's default CURVED routing.
        Proven by replaying this fixture's real captured DotInputGraph
        through the identical build path and toggling only that attr:
        without it bb=106.581238, centre=60.7500, edge2 xlabel.x=40.5000;
        with it bb=108.164568, centre=62.3333, edge2 xlabel.x=43.6667. The
        first column reproduces the ORIGINAL filing's three "engine" numbers
        (106.581/60.75/40.5) TO THE DIGIT -- those measurements were always
        real, they were measurements of OUR OWN graph misattributed to the
        engine. Expected on fix: 108.164568+35 = 1.988397in vs jar's
        1.988368in, ~0.002px. Also corrects this entry's own derived "+-6.75
        straight port offset": the spline dump it asked for is now captured
        and the edges are CURVED at ~+-6.18 (39.645/38.892/38.893/39.649).
        Its "one mechanism, not two" conclusion IS confirmed (3.1667 =
        2 x 1.5833). This issue is the downstream symptom of issue 03's
        un-consumed fix -- 03 is now unchecked and carries the work and the
        blast radius. Full artifact:
        .agent-notes/gvi17-splines-never-emitted.md -->
