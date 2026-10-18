# dot-engine issue tracker

One checklist item per issue file in this folder — nothing else. Check
the box only when the fix has landed in the pinned dot-engine `.tgz`
AND the affected plantuml-ts fixtures re-measure clean (the class /
object ratchets and census re-run instantly against an updated `.tgz`).

<!-- NOTE 2026-10-14: dot-engine's oracle is now native graphviz 16.1.0
     (headless text metrics), and on the issue repros its output is identical
     to homebrew 16.1.0 run headless. A filing against pango-enabled
     homebrew 16.1.0 therefore compares like with like, apart from
     pango-measured text: per dot-engine test/golden/inputs/PROVENANCE.md
     only pt-issue-29-pair and pt-issue-31-inline measure text. -->

<!-- NOTE 2026-10-14: plantuml-ts pins @knowvah/dot-engine 2.4.0 (PR #85 fixes
     via 2.3.1 plus PR #86, the graphviz 16.1.0 sync). Across all 4903 cached
     fixtures, 10 render differently from 2.3.0 and 0 change verdict
     except class/nugecu-04-tona107, which became conformant. On every
     re-measured issue fixture, 2.4.0 renders the jar's own svek-1.dot
     byte-identical to native dot -Tsvg. Where a fixture still differs, the
     entry's 2026-10-14 line says whether our DOT input differs or the
     residual is post-layout. Measurements are in
     .agent-notes/dot-engine-2.4.0-bump.md. -->

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
        .agent-notes/class-edge-label-rank-gap.md. 
        CONSUMED 2026-10-15 (codd): engine and builder clean on 39 of 42 description minlen=0 labelled-edge rows (T0b). codd T7a draws description edge labels at the table corner + margin (SvekEdge.java:951-954): jecici 39/81 -> 27/78. Still ours: label-box INPUT on berelu (37/74; magic-arrow glyph unported), vugaso (1/19, lollipop box) and pumoko (110/827, `Rel_*` empty labels). -->
- [~] 12-port-label-placement-near-head-node.md  <!-- RECLASSIFIED 2026-08-13:
        NOT a dot-engine defect. Port-label placement is byte-identical to the
        native oracle on the filed repro in three forms and on the fixture's
        real svek DOT (7 port labels). The residual 41 diffs on
        object/tobuka-93-jale775 are all port-label text x/y, every y delta half
        the label-box height with opposite signs for an edge's two ends — one
        formula fed correct centres cannot do that, so the mechanism is ours,
        in portLabelAnchor (class-edge-geo.ts:202-223). 
        CONSUMED 2026-10-15 (codd): T9 carries quantifier text to taillabel/headlabel (link-edge-attrs.ts applyQualifierLabels; SvekEdge.java:447-468); builder == native incl. tail_lp/head_lp on fetefi, nofunu, purevo; T8 fixed misube's node order (GraphvizImageBuilder.java:226-227). Render-diff b5: purevo 1/0, misube 1/0, fetefi 3/2, nofunu 23/4 -- the quantifier TEXT is not drawn yet (ours, renderer-edge/SvekEdge). -->
- [x] 13-edge-tail-head-label-positions-not-in-getlayout.md
- [x] 14-cluster-label-position-not-in-getlayout.md  <!-- FIXED upstream
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
        moment T7 landed the bump recorded above, and removed 2026-08-15.)
        2026-10-12 (dot-engine plantuml-tracker-2): consumer-side; no
        dot-engine work. 
        CONSUMED 2026-10-15 (codd): engine == native; cluster.label still never consumed. T2 draws containers at the engine cluster rect; T7b centres rect/rectangle/card titles from the composite title style (ClusterHeader.java:121-128, USymbolRectangle.java:126-131) while package/folder titles stay at USymbolFolder.java:228 UTranslate(4, 2). Box stays open: no upstream fix to consume; ours on the remaining title rows. 
        TICKED 2026-10-16 (gtc T8, D3): the ClusterHeader-family state composite title Y now reads `clusters[].label` (min Y = label.y - label.height/2), as DotStringFactory.java:436-439 / Cluster.java:274-276 / :496-498 do; CLUSTER_TITLE_BASELINE_MARGIN removed. Zero conformant losses in all engines; output byte-identical on all 273 state rows, 0 state census rows moving away. Border-point family and class/description package titles unchanged by D3. -->
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
        transitions before LimitFinder folds the spline into the ink extent. 
        CONSUMED 2026-10-15 (codd): IDENTICAL on 50/50 zaent fixtures (T0b). codd T2 draws the cluster box at the engine rect, which moved the ours-draw zaent rows (e.g. repoge 36/18 -> 37/16, link label + magic-arrow residuals). -->
- [x] 16-edge-xlabel-position-not-in-getlayout.md  <!-- FIXED upstream
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
        .agent-notes/gvi17-splines-never-emitted.md.
        2026-10-12 (dot-engine plantuml-tracker-2): consumer-side; no
        dot-engine work. 03 is consumed -- re-measure pavuzo-79-zodu430 and
        tick if clean.
        RE-MEASURED 2026-10-14 (dot-engine pinned at 2.4.0): state/pavuzo-79-zodu430 is still 4/85, so the box stays open. Our builder graph lays out identically to native `dot -Tdot` on the jar DOT (bb and all 6 edge pos), so the residual is plantuml-ts post-layout work. 
        TICKED 2026-10-16 (gtc T7a/T7b): state/pavuzo-79-zodu430 conformant on dot-engine 2.4.0; render-diff 0/0. T7a emits textLength on transition label text (SvgGraphics.java:700-706); T7b folds the xlabel's marged-block UEmpty into the document ink walk (TextBlockMarged.java:79-87, LimitFinder.java:159-162, SvekResult.java:130-135), closing the uniform 1 px x shift. -->
- [~] 18-compound-clip-last-segment-shape-delta.md  <!-- RECLASSIFIED 2026-09-26: NOT
        dot-engine. On the cached svek-1.dot of bejusa-95-gafo325 and
        pecabi-95-demu756, dot-engine (main and branch), native graphviz 15.1 and
        homebrew graphviz 16.1 emit IDENTICAL splines (0 pos diffs, all three).
        The raw pre-clip curve is therefore not the variable; the ~20px/~4.9px
        gap lives in the jar's own graphviz or in this repo's simulateCompound
        clip. Work is ours. ORIGINAL NOTE FOLLOWS: FILED 2026-09-22
        (cdd-T13). `bejusa-95-gafo325`'s two cluster-anchored composition
        edges whose `simulateCompound` clip lands on their LAST bezier
        segment (`VCAN_DRV *-- PCAN_DRV`, `PCAN_DRV *-- Bus_Rx`) land ~20px
        short of the jar's own clip point, and `pecabi-95-demu756`/
        `sanixi-31-nofa193`'s `note top of <package>` connector (same
        `simulateCompound` clip, T13's note-layout-tip.ts wiring) lands
        ~4.9px short, same signature -- even though the cluster rectangle
        and every node position are verified byte-identical between
        engines and the clip algorithm (`spline-clip.ts`) is
        unmodified/faithful. The structurally-identical sibling edge
        (`PCAN_DRV *-- Bus_Tx`) clips exact (<0.001px), and
        `bajotu-30-soku184` (T13's own acceptance fixture) clips EXACT too
        -- both negative controls ruling out a wiring bug -- see the issue
        file for the full elimination chain. Not chased (stop 8); a
        per-curve dot-engine routing delta, not a general defect in T13's
        clip.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-18.test.ts (bajotu, bejusa, pecabi, sanixi) 
        CONSUMED 2026-10-15 (codd): description clip boxes now come from the engine cluster rect (T2 M1); no engine wait. -->
- [x] 19-flat-edge-ignores-html-table-port.md  <!-- CONSUMED 2026-09-26 via dot-engine 1.6.1 (cdd4 T0d): camuna, nafiki, coxose, mucoti, rifuzu, sefazi class-conformant; ririlu raw layout byte-matches real dot, its remaining SVG residual is the plantuml-ts B-6 Kal stall. FIXED 2026-09-26 on
        dot-engine branch fix/plantuml-tracker-issues (022a21b7), NOT YET PUBLISHED. Mechanism: make_flat_adj_edges
        takes the rotated aux-graph path when either end has a DEFINED port; the
        port gated on port SIDE, so an interior HTML cell (side 0) fell to a stub
        fitter ("triangulation failed"). All 7 edges (mucoti, sefazi, coxose x2,
        ririlu x2, rifuzu) and camuna now byte-match native -Tdot. RE-VERIFIED 2026-09-25
        (cdd3-T5): still open, 7 class fixtures / 9 edges (coxose x2,
        ririlu x2, mucoti, sefazi, rifuzu; camuna + nafiki added
        2026-09-26 by cdd4 planning, same signature on sh0007:h->sh0009); dot-engine prints `triangulation
        failed` once per failing edge, real dot 16.1.0 none; every other
        element byte-equal. Probe numbers in the issue file.
        ORIGINAL FILING NOTE FOLLOWS: FILED 2026-09-22
        (cdd-T15). A `minlen=0` (same-rank) edge that targets an HTML-table
        node's `PORT="h"` cell (`sh0007:h->sh0008`) starts/ends at the
        node's BOUNDING BOX instead of the port cell; the identical seam on
        a RANKED edge lands on the cell correctly (`baneru-00-kuro607`,
        y=54.818 vs the cell's 55). Isolated by running the CACHED ORACLE
        DOT itself through real graphviz 16.1.0 (`dot -Tplain`), which puts
        `mucoti-34-seve858`'s flat edge at x=78.9 (the cell) where
        dot-engine puts it at 142.879 (the box) -- same input bytes, one
        variable. Costs `mucoti-34-seve858` +1 diff against the pre-T15
        baseline; `sefazi-02-defe499` and `camuna-58-veca254` carry the
        same delta but still fall 35/142. Not chased (stop 8); no
        compensation applied, since any would be fitting.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-19.test.ts (baneru, camuna, coxose, mucoti, nafiki, rifuzu, ririlu, sefazi) -->
- [~] 20-taillabel-headlabel-no-canvas-reservation.md  <!-- RECLASSIFIED
        2026-09-25 (cdd3-T5): NOT dot-engine. Engine == real dot 16.1.0 on
        the cached DOT and on our API-built graph (bb 107.58, node x 55);
        the filing compared real's absolute centre with our
        post-shiftToOrigin offset. focaci's real residual is ours:
        class-ink-box.ts:430 bounds the raw-text headLabel anchor
        ("~* initiators", 61.1px) instead of the drawn quantifierLines.
        ORIGINAL NOTE FOLLOWS: FILED 2026-09-23
        (cdd-B7FU-R3, item 4). An edge carrying BOTH `taillabel` and
        `headlabel` HTML tables (`A "role1" 
        CONSUMED 2026-10-15 (codd): purevo's input defect (#12 mechanism) fixed by T9; builder == native incl. tail_lp/head_lp; render-diff 1/0 (quantifier text not drawn, ours). --> "role2" B`) gets NO extra
        canvas/centring reservation from dot-engine, where real graphviz
        reserves ~2.425px asymmetrically (left side only) for the identical
        byte-equal DOT input. Isolated with a controlled A/B on
        `class/focaci-80-suzu938`'s own cached `svek-1.dot`: deleting just
        the `taillabel`/`headlabel` attributes from the SAME graph text (via
        real `dot -Tplain`) collapses the node centring from 0.76389in to
        0.73021in -- EXACTLY dot-engine's own (label-attribute-independent)
        centring, confirming dot-engine's no-label behaviour is correct and
        the divergence is entirely in how it handles the two label
        attributes. `focaci-80-suzu938` stays `structural-match` (0
        structural / ~92 numeric, all one cascading ~2.4px delta). Not
        chased (stop 8); no compensation applied.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-20.test.ts (focaci) -->
- [~] 21-same-rank-node-order-mirrored.md  <!-- RECLASSIFIED 2026-09-25
        (cdd3-T5): NOT dot-engine. Engine == real dot on the cached DOT for
        both. boseba: our graph drops `together` cluster2t0 (deleting it
        from the cached DOT makes REAL dot reproduce our mirror, 773.0pt);
        majuva: `@3` forwarded as weight=3, which upstream never emits
        (adding it to the cached DOT makes REAL dot reproduce our layout,
        bb 151.04). ORIGINAL NOTE FOLLOWS: FILED 2026-09-23 (cdd-T37,
        M8 boseba/majuva). Byte-identical DOT (`dot-sync-report.ts`
        structurallyEqual=true) for both `boseba-99-zopo693` and
        `majuva-44-luta965`; feeding the SAME cached DOT to a real
        graphviz 16.1.0 binary reproduces the jar's own node order
        exactly (bbox within ~1px of the jar's final canvas for both).
        dot-engine's `getLayout()` returns the EXACT MIRROR of that
        order for one same-rank triple (`boseba`'s `UserPerso`/
        `UserPro`/`UserSpace`, all three children of `User`) -- node
        sizes match, only left-right order flips. Cascades into a wider
        canvas (40px / 91px) and a visibly rerouted edge for the
        reordered nodes' own edges -- confirmed downstream, not an
        independent edge-routing bug (T37's own `render-diff`: the one
        structural diff is exactly the rerouted path, every numeric diff
        explained by the uniform shift). Not chased into dot-engine's own
        mincross/ordering source (stop 8, one diagnosis pass); no
        plantuml-ts change warranted -- the DOT input is already correct.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-21.test.ts (inline, boseba, majuva) -->
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
- [x] 22-sametail-port-plaintext-lr-clip-offset.md  <!-- CONSUMED 2026-09-26 via dot-engine 1.6.1 (cdd4 T0d): pijiju class-conformant. FIXED 2026-09-26 on
        dot-engine branch fix/plantuml-tracker-issues (b93b67b8), NOT YET PUBLISHED. Mechanism: sameport used a
        rect/ellipse approximation that always grew the boundary by penwidth/2;
        C's shape_clip uses poly_inside, which tests a peripheries=0 node's raw
        vertices. Ported shape_clip; pijiju-95-xexi872 -Tdot now byte-matches. FILED 2026-09-25
        (cdd3-T6, from E2-6). `class/pijiju-95-xexi872`: a `sametail` group's
        shared start point on a `shape=plaintext` HTML-table node under
        `rankdir=LR` clips 1.5px outside the node boundary in dot-engine
        1.6.0 (real graphviz 16.1.0: x=97; engine: x=98.5). Controls with
        `shape=rect` (same footprint) or `rankdir=TB` both match real
        exactly, isolating the trigger to plaintext/HTML + LR together.
        Re-verified against the pinned dot-engine 1.6.0. Not chased into
        dot-engine's own `sameport.c` source beyond the port-construction
        call site.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-22.test.ts (sametail-min[, -rect, -tb], pijiju, quote) -->
- [x] 23-flat-labelled-edge-mirrored-label-side.md  <!-- FIXED 2026-10-12, on main cdf597bc (PR #85, rebase-merged),
        published in @knowvah/dot-engine 2.3.1 (2026-10-12T13:41Z).
        PREVIOUS NOTE FOLLOWS: FIXED 2026-10-12 on
        dot-engine branch fix/plantuml-tracker-issues-2 (44aba8a3), NOT YET PUBLISHED.
        Mechanism: not floating-point noise -- the two candidate split corners
        differ by 1 ULP and C decides deterministically. reallyroutespline
        (route.c) uses libm hypot (448), strict `>` (139) and a clang
        fp-contract-fused Bezier eval (137-138); the port used Math.hypot, an
        unfused eval and a tolerant tie-break. Outcome: hypot + contraction,
        not hypot alone -- with libm hypot but no fusion, widths 5/12/20 still
        mirror. dot-engine A3 is retired (all members conformant).
        Verified against native graphviz 15.x (our oracle); the filing compared
        against homebrew 16.1.0.
        Re-measure on the next .tgz bump: class/nugecu-04-tona107.
        PREVIOUS NOTE FOLLOWS: ACCEPTED DIVERGENCE
        2026-09-26: another instance of dot-engine docs/known-divergences.md
        A3 (spline-routing tie-break). A symmetric label corridor makes the
        two candidate split corners an exact tie, and C and the port resolve
        it on floating-point noise. No upstream fix to wait for.
        ORIGINAL NOTE FOLLOWS: FILED 2026-09-25
        (cdd3-T6, from E2-7). `class/nugecu-04-tona107`: a flat (`minlen=0`)
        labelled edge routes via the mirrored side of its label box for
        SOME label widths (9, 20) and matches real graphviz exactly for
        others (5, 12, 30) -- a tie-break divergence in dot-engine's
        box-corridor shortest-path search (`make_flat_labeled_edge` /
        `routesplines`), not a constant offset. Re-verified against the
        pinned 1.6.0 with a 5-point width sweep.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-23.test.ts (w5/w9/w12/w20/w30, nugecu)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): class/nugecu-04-tona107 render-diff 0/23 -> 0/0, survey structural-match -> conformant; pinned in oracle/goldens/svg-class/ratchet.json; its accepted divergence is retired. Box ticked. -->
- [x] 24-flat-labelled-minlen0-edge-spline-diverges.md  <!-- CONSUMED 2026-09-26 via dot-engine 1.6.1 (cdd4 T0d): givoli, nadepi, tekena class-conformant. FIXED 2026-09-26 on
        dot-engine branch fix/plantuml-tracker-issues (8c9579ea), NOT YET PUBLISHED. Mechanism: dot_splines_ routes
        flat edges in-loop at their edgecmp position; the port deferred every
        flat group until after all regular edges, so a later chain's
        recover_slack/resize_vn had already moved sh0030's left vnode
        (951->969), widening maximal_bbox by 18pt. givoli, tekena, nadepi now
        byte-match native pos. FILED 2026-09-25
        (cdd3-T6, from C-12). `class/givoli-70-rade072` /
        `tekena-28-fobe713` / `nadepi-13-mufu566`: the flat labelled edge
        `sh0030->sh0014` routes with a spline up to 18px off real graphviz
        on byte-identical DOT and identical node/label positions. EXPLICITLY
        CHECKED against issue 23's mirror mechanism and ruled out --
        mirroring dot-engine's points about the label centre does not
        reproduce real's list, and the two engines' y-values differ
        point-for-point where issue 23's mirror pairs always matched y
        exactly (probe: scratch/T6-c12-mirror-check.mts). Filed as a
        separate issue in the same feature area (flat labelled edge
        routing) rather than folded into 23.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-24.test.ts (givoli, nadepi, tekena). RESIDUAL: the coordinates quoted in the issue file (lp="1063,902.5", pos="1169.7,850.43 ...") do not match the current cached fixture givoli; its svek-1.dot was regenerated 2026-10-09, after the issue was filed. Homebrew 16.1.0 and the dot-engine oracle both give lp="1093,902.5", pos="1208.3,850.47 ..." on the current fixture, so the quoted numbers are stale and should be re-measured against it. -->
- [x] 25-edge-label-published-when-unplaced.md  <!-- CONSUMED 2026-09-26 via dot-engine 1.6.1 (cdd4 T0d): delasa class-conformant with no plantuml-ts change; the consumer half is verified by cdd4 T11. FIXED 2026-09-26 on
        dot-engine branch fix/plantuml-tracker-issues (5932a793), NOT YET PUBLISHED. getLayout() now applies the
        same `set` gate to the centre label as to tail/head/xlabel; delasa's 3
        labels read back absent. Consumer half (class-edge-geo.ts skipping an
        absent label) still to do here. FILED 2026-09-25
        (cdd3-T6, from E3-12). `class/delasa-80-jusu462` (3 edges): real
        graphviz leaves some centre edge labels unplaced
        (`ED_label(e)->set` false, `lp="0,8"` sentinel, no `<text>` drawn),
        but dot-engine 1.6.0's typed `getLayout()` API still publishes
        `EdgeGeometry.label` at the sentinel/origin position -- unlike
        `tailLabel`/`headLabel`/`xlabel`, which are already correctly gated
        on the same "was it placed" condition. Re-verified: real `-Tsvg`
        draws 0 `<text>` in the 3 labels' colours; dot-engine's
        `getLayout()` returns a non-null `label` for all 3
        (scratch/T6-e3-12-label-gate.mts).
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-25.test.ts (delasa) -->
- [x] 26-self-loop-in-cluster-with-flat-labelled-edge.md  <!-- CONSUMED 2026-09-26 via dot-engine 1.6.1 (cdd4 T0d): cobumi class-conformant. FIXED 2026-09-26 on
        dot-engine branch fix/plantuml-tracker-issues (52982142), NOT YET PUBLISHED. Mechanism: C's abomination
        adds the flat-label rank at index -1 and leaves ND_rank alone; the port
        renumbers +1, so dot_splines_'s literal `r > 0` (self-loop sizey,
        dotsplines.c:392) passed and sizey came off the label rank (159.5 vs
        C's ND_ht 90). cobumi-83-bapu892 self-loop now byte-matches. FILED 2026-09-25
        (cdd3-T6, from E3-D1). `class/cobumi-83-bapu892`: a self-loop's
        spline is taller in dot-engine 1.6.0 than in real graphviz
        (uniform +-12.98px on non-centre-line points) when the looped node
        sits in a cluster that also holds a labelled flat edge. A lone
        self-loop, or a self-loop alone in an empty cluster, does NOT
        reproduce it -- re-verified on the bisected 13-line repro
        (scratch/E3-selfloop-bisect.dot) carried over from E3. Residual on
        top of E3-18's `Bibliotekon#addLine` fix (plantuml-ts-side, this
        mission), not superseded by it.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-26.test.ts (selfloop-min/-cluster/-bisect, cobumi, quote) -->
- [~] E3-D2 lead (builder `setAttr('remincross','true')` before
        `searchsize` cancels searchsize) NOT FILED 2026-09-25 (cdd3-T6):
        does not reproduce on the pinned dot-engine 1.6.0. Re-ran the
        builder-vs-text harness (`E3-builder-vs-text3.mts` and a new
        order-controlled probe, `scratch/T6-e3-d2-order.mts`) with
        `remincross` set BEFORE `searchsize`: 0/184 node mismatches, same as
        `searchsize`-only and `searchsize`-then-`remincross`; only the
        baseline with NEITHER attribute set reproduces the original 33
        mismatches (sanity check, matching E3.md's own number exactly). The
        order-sensitivity E3.md recorded as a MEDIUM-confidence lead does
        not hold today -- measurement recorded here, no issue filed. -->
- [x] 27-parser-accepts-node-brace-block.md  <!-- FIXED 2026-10-12, on main b18c06e1 (PR #85, rebase-merged),
        published in @knowvah/dot-engine 2.3.1 (2026-10-12T13:41Z).
        PREVIOUS NOTE FOLLOWS: FIXED 2026-10-12 on
        dot-engine branch fix/plantuml-tracker-issues-2 (fdd6d03d), NOT YET PUBLISHED.
        Mechanism: grammar.y attrstmt requires a bracket attrlist; the
        port's AttrList had an empty alternative, so `node { ... }` parsed as an
        attr statement plus an anonymous subgraph. Now rejected with a
        ParseError. Error-text parity (graphviz `syntax error in line N near
        'tok'`) not implemented -- ParseError contract kept (dot-engine AD-4).
        Verified against native graphviz 15.x (our oracle); the filing compared
        against homebrew 16.1.0.
        Re-measure on the next .tgz bump: none named in the filing (parser-only).
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (unwind-U2): `node { shape=box }` parses in dot-engine 1.6.1, graphviz rejects; also peggy vs yacc error text on invalid DOT.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-27.test.ts (ParseError case)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): parser-only, and plantuml-ts never emits an attribute statement without a bracket list; no fixture to re-measure. Box ticked. -->
- [ ] 28-flat-nonadjacent-edge-ignores-splines-polyline-line.md  <!-- FIXED 2026-10-12, on main d3d7297f (PR #85, rebase-merged),
        published in @knowvah/dot-engine 2.3.1 (2026-10-12T13:41Z).
        PREVIOUS NOTE FOLLOWS: FIXED 2026-10-12 on
        dot-engine branch fix/plantuml-tracker-issues-2 (87de3eea), NOT YET PUBLISHED.
        Mechanism: make_flat_edge / make_flat_adj_edges dispatch on the
        graph edge type (line -> makeSimpleFlat, non-spline -> routepolylines);
        the port hard-coded EDGETYPE_SPLINE for flat edges.
        Verified against native graphviz 15.x (our oracle); the filing compared
        against homebrew 16.1.0.
        Re-measure on the next .tgz bump: unknown/deroxu-29-gude369.
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (lgm-T0c): flat edge across a non-neighbour ignores splines=polyline/line (routesplines used); deroxu-29-gude369.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-28.test.ts (polyline, line, deroxu, quotes)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): unknown/deroxu-29-gude369 is still 879/2500 (unchanged count; bytes moved). Our builder graph does NOT lay out like native on the jar DOT, because our DOT input differs from the jar's although `dotEqual` reports true: same 38 clusters, but our port-table node sizes differ, giving bb width 4958 vs 3757 and 7/246 matching edge pos. 2.4.0 renders the jar's own svek-1.dot byte-identical to native, so the remaining work is ours (a DOT-input gap), not an upstream wait.
        CONSUMED 2026-10-14 (dsw, merge to main pending): unknown/deroxu-29-gude369 layoutParity unequal (bb 4958 vs 3757) -> EQUAL (bb 3757, 246/246 edge pos = native). Two plantuml-ts input defects, both fixed in description: multi-line port label sized single-line (SvekNode.java:181-190) and LEFT/UP links never marked inverted (CommandLinkElement.java:325-326, Cluster.java:195-212). render-diff 879/2500 -> 743/2505: the remaining residual is ours and post-layout (skinparam dpi 60 scale and the title, not traced). Box stays open: the fixture does not yet re-measure clean. 
        CONSUMED 2026-10-15 (codd): deroxu layout-equal; T4 ported scale/dpi under chrome and the dash scaling: render-diff 743/2505 -> 719/1237. Residual ours (Shadowing<<stereo>>, colours, @id). -->
- [ ] 29-ortho-self-loop-edge-lost.md  <!-- FIXED 2026-10-12, on main ea0a8849 (PR #85, rebase-merged),
        published in @knowvah/dot-engine 2.3.1 (2026-10-12T13:41Z).
        PREVIOUS NOTE FOLLOWS: FIXED 2026-10-12 on
        dot-engine branch fix/plantuml-tracker-issues-2 (33a928d8), NOT YET PUBLISHED.
        Mechanism: the ortho adapter skipped every tail == head edge;
        C's orthoEdges gather (ortho.c:1207-1228) keeps loops and routes them
        via addLoop.
        Verified against native graphviz 15.x (our oracle); the filing compared
        against homebrew 16.1.0.
        Re-measure on the next .tgz bump: unknown/xagonu-36-sudi116.
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (lgm-T0c): `splines=ortho; a->a` loses the loop ("lost a a edge"), real draws it; xagonu-36-sudi116.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-29.test.ts (inline, pair, quote; pair measures text)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): unknown/xagonu-36-sudi116 is still 192/594, bytes unchanged. Our builder graph does NOT lay out like native on the jar DOT, because our DOT input differs from the jar's (`dotEqual` is false here): we emit 13 clusters against the jar's 43, missing the package wrapper clusters. 2.4.0 renders the jar's own svek-1.dot byte-identical to native, so the remaining work is ours (a DOT-input gap), not an upstream wait.
        CONSUMED 2026-10-14 (dsw, merge to main pending): unknown/xagonu-36-sudi116 cluster tree jar 43 vs ours 13 -> equal nesting (jar 12 vs ours 12 base clusters with matching wrappers); layoutParity still differs on cluster bb (449.70 vs 443.70) because our DOT lacks the jar's two self-loop xlabel TABLEs (sh0050->sh0050 139x38, zaent0019->zaent0019 142x25; suspected, ours). render-diff 192/594 -> 191/586. Box stays open. 
        CONSUMED 2026-10-15 (codd): xagonu was an INPUT defect -- description buildDotEdges skipped every self-loop (layout-dot-tree.ts:422); T9 emits them and the builder lays out identical to native (bb 1044x1316); dotEqual/layoutEqual true, pinned in layout-parity. Render-diff 191/586 -> 45/887 (label `\r` prefix, edge draw order: ours). Box open: fixtures not clean. -->
- [ ] 30-flat-adjacent-edge-pair-with-port-endpoint-offset.md  <!-- FIXED 2026-10-12, on main 87347711 (PR #85, rebase-merged),
        published in @knowvah/dot-engine 2.3.1 (2026-10-12T13:41Z).
        PREVIOUS NOTE FOLLOWS: FIXED 2026-10-12 on
        dot-engine branch fix/plantuml-tracker-issues-2 (bdd614d5), NOT YET PUBLISHED.
        Mechanism: C groups every adjacent flat edge sharing a main edge
        into one make_flat_adj_edges call and routes the port-less edge through
        the aux graph; the port split the group by port presence, so that edge
        took makeSimpleFlat and clipped at a different point (54.28 vs 54.46).
        Verified against native graphviz 15.x (our oracle); the filing compared
        against homebrew 16.1.0.
        Re-measure on the next .tgz bump: class/sokevu-87-toce485, component/repoge-41-demu604.
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (lgm-T0c): adjacent flat edge pair with one port: port-less edge endpoints off ~0.2px; sokevu-87-toce485, repoge-41-demu604.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-30.test.ts (inline, repoge, sokevu, port-first, quote)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): class/sokevu-87-toce485 conformant (it was before the bump too); component/repoge-41-demu604 still 36/20, bytes unchanged. Our builder graph does NOT lay out like native on the jar DOT, because our DOT input differs from the jar's although `dotEqual` reports true: we emit 2 clusters against the jar's 4 (missing the cluster<N>p0/p1 wrappers). 2.4.0 renders the jar's own svek-1.dot byte-identical to native, so the remaining work is ours (a DOT-input gap), not an upstream wait.
        CONSUMED 2026-10-14 (dsw, merge to main pending): class/sokevu-87-toce485 conformant (0/0) and layout-equal. component/repoge-41-demu604 layoutParity jar 4 vs ours 2 clusters -> EQUAL (core a/i wrappers around a linked port cluster, ClusterDotString.java:98-99,151-152,175-181); render-diff 36/20 -> 36/18, residual is ours and post-layout. Box stays open until repoge re-measures clean. 
        CONSUMED 2026-10-15 (codd): repoge still builder == native, layoutParity EQUAL; render-diff 36/18 -> 37/16 after the codd drawing fixes; residual ours (draw order/labels). -->
- [~] 31-routing-failure-lost-edge-exit-status.md  <!-- OUTCOME 2026-10-14: the
        dot-engine port printed `Pshortestpath failed` 3x vs native 1x (inline,
        zuduxu) and 36x vs 34x (rubebe), with identical lost-edge sets. FIXED on
        dot-engine main 5b6b9bfc (PR #86, rebase-merged; branch sha 54bd3b9b,
        `fix(dot): consume edges lost by group and chain routing`), NOT YET
        PUBLISHED. Mechanism: three
        failure paths did not mark the edge lost, so a backstop re-routed it and
        re-printed the warning. Warning counts now match native.
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (lgm-T0c): zuduxu-90-kosi876 / rubebe-45-sura795 "rejected" by dot only via exit 1 (Pshortestpath failed, edges lost identically); same SVG, not the issue-27 class.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-31.test.ts (inline, zuduxu, rubebe: SVG + lost-edge set + warning count; inline measures text)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): published in 2.4.0 (PR #86; the branch sha 54bd3b9b was rebased to 5b6b9bfc). unknown/rubebe-45-sura795 160/63 and class/zuduxu-90-kosi876 127/52, bytes unchanged. Our own builder graph lays out identically to native `dot -Tdot` on the jar DOT (bb and every edge pos), so the residual is plantuml-ts post-layout work, not an upstream wait. -->
- [x] 32-adjacent-flat-parallel-labelled-edges-mirrored-detour.md  <!-- FIXED 2026-10-12, on main cdf597bc (PR #85, rebase-merged),
        published in @knowvah/dot-engine 2.3.1 (2026-10-12T13:41Z).
        PREVIOUS NOTE FOLLOWS: FIXED 2026-10-12 on
        dot-engine branch fix/plantuml-tracker-issues-2 (44aba8a3), NOT YET PUBLISHED.
        Mechanism: same as 23 -- the max-deviation split in
        reallyroutespline now matches C bit for bit (libm hypot, strict `>`,
        clang fp-contract fusion). Separate, NOT a port bug: the upper label
        sits outside the viewBox in native 15.x and graphvizonline too (C never
        updateBBs makeSimpleFlatLabels labels, dotsplines.c:410-417);
        graphvizonline only shows it because svg-pan-zoom drops the viewBox and
        the panel is taller than the drawing. Consumer fix: grow the viewBox to
        the drawn extent.
        Verified against native graphviz 15.x (our oracle); the filing compared
        against homebrew 16.1.0.
        Re-measure on the next .tgz bump: component/zosuje-43-zebi775, unknown/bamami-10-lava790,
        bobixe-18-riza923, pugodi-27-kone040, rufopi-30-roro642.
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (lgm-T0c): makeSimpleFlatLabels detour edge is the x-mirror of real; zosuje-43-zebi775, bamami-10-lava790, bobixe-18-riza923, pugodi-27-kone040, rufopi-30-roro642. Same family as 23.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-32.test.ts (inline, zosuje, bamami, bobixe, pugodi, rufopi, quotes)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): none of zosuje (20/180), bamami, bobixe, pugodi (0/100 each) or rufopi (5/103) moved a byte. Our builder graph does NOT lay out like native on the jar DOT, because our DOT input differs from the jar's although `dotEqual` reports true: the jar wraps the package in cluster6p0 > cluster6 (17x23 label TABLE) > cluster6p1; we emit one cluster with a plain-text label (1 vs 3 clusters, bb 145x90.57 vs 177x113.07). 2.4.0 renders the jar's own svek-1.dot byte-identical to native, so the remaining work is ours (a DOT-input gap), not an upstream wait.
        CONSUMED 2026-10-14 (dsw, merge to main pending): bamami, bobixe, pugodi, rufopi and zosuje all layoutParity unequal (jar 3 vs ours 1 clusters: missing p0/p1 protection wrappers + title TABLE) -> EQUAL, i.e. the engine fix now reaches them. render-diff bamami/bobixe/pugodi 0/100 -> 0/88, rufopi 5/103 -> 5/91, zosuje 20/180 unchanged: the residuals are ours and post-layout (e.g. bamami svg height 232 vs 219). Box stays open until they re-measure clean. 
        CONSUMED 2026-10-15 (codd): T2 draws the package at the engine cluster rect and T4 reads the exporter margin: bamami, bobixe, pugodi 0/88 -> 0/0 (conformant), rufopi 5/91 -> 2/0, zosuje 20/180 -> 17/0. Box stays open until rufopi and zosuje re-measure clean (their residuals are ours: cluster fill/second title line, zosuje style colours). 
        MEASURED 2026-10-16 (gtc T1, dot-engine 2.4.0): unknown/rufopi-30-roro642 now conformant, render-diff 0/0 (container fill from the root `<style>` BackgroundColor, Cluster.java:285-296/:701-710); component/zosuje-43-zebi775 still 17/0, open for T2. 
        MEASURED 2026-10-16 (gtc T2): component/zosuje-43-zebi775 17/0 -> 13/0 (group BackGroundColor/LineColor from the merged `root, element, <diagram>, group, <uSymbol>` style, Cluster.java:285-296/:312-319/:701-710). Open: 1 `font-style` (component `<style> FontStyle` never reaches the theme, src/core/style-map-element.ts:30-38; EntityImageDescription.java:142-172) and 12 link stroke/fill (`<style> arrow { LineColor }` has no description cascade, SvekEdge.java:816-821/:874-876; port renderer-edge.ts:129). Both origins are src/core: halted for a ruling (gtc stop 1). 
        TICKED 2026-10-18 (gtc T2b): unknown/rufopi-30-roro642, component/zosuje-43-zebi775, unknown/bamami-10-lava790, unknown/bobixe-18-riza923, unknown/pugodi-27-kone040 conformant on dot-engine 2.4.0; render-diff 0/0 on all five. zosuje's last 13 closed by T2b: bucket FontStyle reaching the theme (EntityImageDescription.java:142-172) and the description arrow cascade `root, element, componentdiagram, arrow` (SvekEdge.java:816-821). -->
- [x] 33-parallel-labelled-edges-second-edge-bend-position.md  <!-- FIXED 2026-10-12, on main cdf597bc (PR #85, rebase-merged),
        published in @knowvah/dot-engine 2.3.1 (2026-10-12T13:41Z).
        PREVIOUS NOTE FOLLOWS: FIXED 2026-10-12 on
        dot-engine branch fix/plantuml-tracker-issues-2 (44aba8a3), NOT YET PUBLISHED.
        Mechanism: same as 23 -- the second edge's Bezier join followed
        the port's max-deviation split; now C's split point bit for bit.
        Verified against native graphviz 15.x (our oracle); the filing compared
        against homebrew 16.1.0.
        Re-measure on the next .tgz bump: component/xenusu-76-sabi405.
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (lgm-T0c): parallel labelled non-flat edges, second edge's Bezier join at other label-box end; xenusu-76-sabi405.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-33.test.ts (inline, xenusu, quote)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): component/xenusu-76-sabi405 render-diff 7/29 -> 7/8 (the bend moved to the jar's side). Our own builder graph lays out identically to native `dot -Tdot` on the jar DOT (bb and every edge pos), so the residual is plantuml-ts post-layout work, not an upstream wait. 
        MEASURED 2026-10-18 (gtc T3): component/xenusu-76-sabi405 7/2 -> 0/2 (structural-match): `skinparam arrow<<tag>> { Color X;line.Bold() }` now reaches the link (FromSkinparamToStyle.java:292-410; SvekEdge.java:816-821). The 2 numeric are svg/@width + viewBox 354 vs 353: the edge label's TextBlockMarged UEmpty (SvekEdge.java:372-373, TextBlockMarged.java:81-87) is not drawn by src/core/svek/SvekEdge.ts:330-336; user allowed that file 2026-10-18 (T3b). 
        TICKED 2026-10-18 (gtc T3b): component/xenusu-76-sabi405 conformant on dot-engine 2.4.0; render-diff 0/0. T3 stereotyped arrow skinparams + T3b edge label TextBlockMarged UEmpty (SvekEdge.java:372-373, TextBlockMarged.java:81-87). -->
- [x] 34-html-table-border-emitted-before-cells.md  <!-- FIXED 2026-10-14, on dot-engine main 67f3ad3a
        (PR #86, rebase-merged; branch sha 704a97ed), NOT YET PUBLISHED.
        Mechanism: port of graphviz 16.1 commit f0d07786b, which draws the table
        rules and border before the cells (emit_html_tbl); dot-engine drew them
        after (15.x order). The oracle is now 16.1.0.
        PREVIOUS NOTE FOLLOWS: VERSION SKEW
        2026-10-12: native 15.x draws cells then border, as the port does;
        16.1.0 reordered emit_html_tbl. Tracked by the dot-engine graphviz
        16.1.0 sync follow-on. No dot-engine fix on the 15.x oracle.
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (lgm-T0c): 16.1.0 draws table border before cells, dot-engine after (matches 15.0 source); order-only; seen in rubebe-45-sura795.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-34.test.ts (inline, rubebe, quote)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): published in 2.4.0 (PR #86; the branch sha 704a97ed was rebased to 67f3ad3a). The emission order only affects dot-engine's own SVG renderer, which svek discards; unknown/rubebe-45-sura795 is still 160/63, bytes unchanged. Our own builder graph lays out identically to native `dot -Tdot` on the jar DOT (bb and every edge pos), so the residual is plantuml-ts post-layout work, not an upstream wait.
        TICKED 2026-10-16 (gtc T0): unknown/rubebe-45-sura795 conformant on dot-engine 2.4.0 (survey verdict conformant, errorPage: true; the stock jar crashes with an NPE, `pt4` is null, and stock-error-pages.json carries provenance oracle-widths); render-diff n/a (error page, docs/svg-conformance.md "Error pages"). -->
- [x] 35-narrow-edge-label-parallel-edges-layout-offset.md  <!-- FIXED 2026-10-12, on main cdf597bc (PR #85, rebase-merged),
        published in @knowvah/dot-engine 2.3.1 (2026-10-12T13:41Z).
        PREVIOUS NOTE FOLLOWS: FIXED 2026-10-12 on
        dot-engine branch fix/plantuml-tracker-issues-2 (44aba8a3), NOT YET PUBLISHED.
        Mechanism: same family as 23 -- the faithful max-deviation split
        reproduces native on the filed repro (dot-engine golden pt-issue-35).
        Verified against native graphviz 15.x (our oracle); the filing compared
        against homebrew 16.1.0.
        Re-measure on the next .tgz bump: unknown/bamami-10-lava790 (the filing names no isolating
        fixture).
        PREVIOUS NOTE FOLLOWS: FILED 2026-10-08 (lgm-T0c): narrow-label parallel edges put nodes at fractional x in real, integer in dot-engine (0.226px); no fixture isolates it.
        RE-VERIFIED 2026-10-14 against graphviz 16.1.0 (dot-engine oracle now matches homebrew 16.1.0): pass — test/golden/pt-issue-35.test.ts (inline, bamami, quote)
        CONSUMED 2026-10-14 in plantuml-ts (dot-engine pinned at 2.4.0): unknown/bamami-10-lava790 is still 0/100, bytes unchanged. Our builder graph does NOT lay out like native on the jar DOT, because our DOT input differs from the jar's although `dotEqual` reports true: the same missing package wrapper clusters as 32. 2.4.0 renders the jar's own svek-1.dot byte-identical to native, so the remaining work is ours (a DOT-input gap), not an upstream wait. 
        CONSUMED 2026-10-15 (codd): unknown/bamami-10-lava790 re-measures CLEAN on dot-engine 2.4.0 (render-diff 0/0, survey conformant, dotEqual and layoutEqual true) after T2's cluster-rect drawing. Box ticked under the file's rule. -->
- [ ] 36-flat-adjacent-unlabelled-edge-endpoint-offset.md  <!-- FILED 2026-10-15 (codd-T0b): single flat adjacent minlen=0 edge, no port/label, endpoints 0.1-0.3 px off native 16.1.0; unknown/zodela-36-sica712, usecase/cimare-47-deke334 (conformant, invisible edges). 
        CONSUMED 2026-10-15 (codd): still the engine's; zodela-36-sica712 now 0/1 (the one numeric diff is this sub-px rect x). -->
  <!-- 23 ALSO SEEN 2026-10-08 (lgm-T0c): nugecu-04-tona107 minimises to this mechanism; related 32, 33.
        CONSUMED 2026-10-14 (dsw, merge to main pending): unknown/bamami-10-lava790 layoutParity unequal -> EQUAL (p0/p1 wrappers + 17x23 title TABLE); render-diff 0/100 -> 0/88, post-layout residual ours. Box stays open. -->
